import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService, UserStatus } from '@flowsplit/prisma';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TwoFactorAuthService } from './two-factor-auth.service';
import * as crypto from 'crypto';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorAuthService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, email, phone, password } = registerDto;

    const userExists = await this.prisma.user.findFirst({
        where: { 
            OR: [
                { email },
                { phone }
            ]
        } 
    });


    if (userExists) {
      throw new ConflictException('User with this email or phone already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword,
        },
      });

      // Don't return the password
      const { password, ...result } = user;

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      // Return both user info and the token
      return {
        ...result,
        accessToken,
      };
      
    } catch (error) {
      throw new InternalServerErrorException('Could not create user.');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }
    if (user.status === UserStatus.DEACTIVATED) {
      throw new ForbiddenException('This account has been deactivated.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.isTwoFactorEnabled) {
      // Return a restricted temporary token valid for only 5 minutes
      const tempPayload = { sub: user.id, is2faPending: true };
      const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });
      
      return {
        requiresTwoFactor: true,
        tempToken,
        message: '2FA verification required',
      };
    }

    // Standard Login
    return this.generateAccessToken(user.id, user.email, user.role);
  }

  /**
   * Finalizes login by verifying the 2FA code (or recovery code).
   */
  async loginWith2fa(tempToken: string, code: string) {
    // 1. Verify the Temp Token
    let payload;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired login session.');
    }

    if (!payload.is2faPending) {
      throw new BadRequestException('Invalid token type.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found.');

    // 2. Attempt TOTP Verification
    let isValid = await this.twoFactorService.isTwoFactorCodeValid(code, user);

    // 3. If TOTP failed, Attempt Recovery Code Verification
    if (!isValid) {
      isValid = await this.twoFactorService.validateAndBurnRecoveryCode(user, code);
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code.');
    }

    // 4. Success - Issue Real Token
    return this.generateAccessToken(user.id, user.email, user.role);
  }

  // --- SETUP HELPERS ---

  async generate2faSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.twoFactorService.generateSecret(user.email);
  }

  async enable2fa(userId: string, code: string, secret: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.twoFactorService.enableTwoFactor(user, secret, code);
  }

  async disable2fa(userId: string, password: string) {
    // Critical: Require password re-verification to disable security
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new UnauthorizedException();
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid password.');

    await this.prisma.user.update({
        where: { id: userId },
        data: { 
            isTwoFactorEnabled: false, 
            twoFactorSecret: null, 
            twoFactorRecoveryCodes: [] 
        }
    });
    return { message: '2FA disabled successfully' };
  }

  private generateAccessToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      throw new UnauthorizedException('User not found or external auth used.');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('The current password provided is incorrect.');
    }

    const isSame = await bcrypt.compare(dto.newPassword, user.password);
    if (isSame) {
      throw new ConflictException('New password cannot be the same as the old password.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Generates a secure token, hashes it, saves to DB, and emits email event.
   * Always returns void/success to prevent email enumeration.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Anti-Enumeration: Return success even if user doesn't exist.
    if (!user) return;

    // 1. Generate High-Entropy Token (Raw)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash the token
    const tokenHash = await bcrypt.hash(rawToken, 10);

    // 3. Set Expiry (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 4. Save/Upsert to DB
    // We use upsert to ensure only one active token exists per user
    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt },
      create: { userId: user.id, tokenHash, expiresAt },
    });

    // 5. Emit Event
    // We send the RAW token in the email. We do NOT save the raw token.
    const payload = {
        email: user.email,
        userId: user.id,
        rawToken: rawToken, // Only time this leaves the server memory
        name: `${user.firstName} ${user.lastName}`,
    };
    
    this.notificationClient.emit('auth.forgot_password', new RmqRecordBuilder(payload).build());
  }

  /**
   * Verifies the token and updates the password.
   */
  async resetPassword(userId: string, rawToken: string, newPassword: string): Promise<void> {
    // 1. Find the token record
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
        where: { userId } 
    });

    if (!resetRecord) throw new BadRequestException('Invalid or expired reset link.');

    // 2. Check Expiry
    if (new Date() > resetRecord.expiresAt) {
        // Clean up expired token
        await this.prisma.passwordResetToken.delete({ where: { userId } });
        throw new BadRequestException('Reset link has expired.');
    }

    // 3. Verify Token Hash
    const isValid = await bcrypt.compare(rawToken, resetRecord.tokenHash);
    if (!isValid) throw new BadRequestException('Invalid reset link.');

    // 4. Update Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Transaction: Update User & Delete Token
    await this.prisma.$transaction([
        this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        }),
        this.prisma.passwordResetToken.delete({ where: { userId } })
    ]);
  }
}