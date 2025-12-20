import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { User } from '@flowsplit/prisma';
import { PrismaService } from '@flowsplit/prisma';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TwoFactorAuthService {
  private encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY');
    if (!key) throw new Error('FATAL: TWO_FACTOR_ENCRYPTION_KEY is not defined');
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  /**
   * Generates a new TOTP secret for a user.
   * Returns the secret (for logic) and the otpauth URL (for QR code).
  */
  async generateSecret(email: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'FlowSplit', secret);
    return { secret, otpauthUrl };
  }

  /**
   * Generates a QR Code Data URL from the otpauth URL.
  */
  async generateQrCodeDataURL(otpauthUrl: string) {
    return qrcode.toDataURL(otpauthUrl);
  }

  /**
   * Verifies a user's token against their stored (encrypted) secret.
  */
  async isTwoFactorCodeValid(twoFactorCode: string, user: User) {
    if (!user.twoFactorSecret) return false;
    const decryptedSecret = this.decrypt(user.twoFactorSecret);
    return authenticator.verify({ token: twoFactorCode, secret: decryptedSecret });
  }

  /**
   * Enables 2FA.
   * Returns RAW recovery codes to the user ONCE.
   * Stores HASHED recovery codes in the DB.
   */
  async enableTwoFactor(user: User, secret: string, token: string) {
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) throw new UnauthorizedException('Invalid 2FA token provided.');

    // 1. Encrypt the Secret (Reversible) - Needed for future verification
    const encryptedSecret = this.encrypt(secret);

    // 2. Generate 10 High-Entropy Recovery Codes
    const recoveryCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(5).toString('hex').toUpperCase() // e.g. A1B2C-D3E4F
    );

    // 3. Hash Recovery Codes (Irreversible)
    // We use bcrypt. Note: Comparing 10 bcrypt hashes on login is CPU intensive but acceptable for recovery.
    const hashedRecoveryCodes = await Promise.all(
      recoveryCodes.map(code => bcrypt.hash(code, 10))
    );

    // 4. Save to DB
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isTwoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorRecoveryCodes: hashedRecoveryCodes, // Store hashes only
      },
    });

    // Return RAW codes to frontend to be shown ONE TIME
    return { recoveryCodes };
  }

  /**
   * Validates a recovery code and BURNS it (removes it from DB) if valid.
   * This is used when the user has lost their device.
   */
  async validateAndBurnRecoveryCode(user: User, code: string): Promise<boolean> {
    if (!user.twoFactorRecoveryCodes || user.twoFactorRecoveryCodes.length === 0) {
      return false;
    }

    // We must check the provided code against ALL stored hashes.
    let matchedHashIndex = -1;

    for (const [index, hash] of user.twoFactorRecoveryCodes.entries()) {
      const isMatch = await bcrypt.compare(code, hash);
      if (isMatch) {
        matchedHashIndex = index;
        break;
      }
    }

    if (matchedHashIndex === -1) {
      return false;
    }

    // Code is valid. BURN IT immediately.
    // We remove this specific hash from the array.
    const updatedCodes = [...user.twoFactorRecoveryCodes];
    updatedCodes.splice(matchedHashIndex, 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorRecoveryCodes: updatedCodes },
    });

    return true;
  }

  // --- CRYPTO HELPERS (AES-256-CBC) ---
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    
    // @ts-ignore: Suppress type conflict
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text);
    
    // @ts-ignore: Suppress type conflict for Buffer.concat
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    // @ts-ignore: Suppress type conflict
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    // @ts-ignore: Suppress type error for encryptedText Buffer
    let decrypted = decipher.update(encryptedText);
    
    // @ts-ignore: Suppress type conflict for Buffer.concat
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  }
}