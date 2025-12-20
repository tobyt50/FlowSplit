import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService, UserStatus } from '@flowsplit/prisma';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorAuthService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { fullName, email, phone, password } = registerDto;

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
          fullName,
          email,
          phone,
          password: hashedPassword,
        },
      });

      // Don't return the password
      const { password, ...result } = user;
      return result;
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
}