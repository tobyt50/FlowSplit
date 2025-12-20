import { Body, Controller, Post, HttpCode, HttpStatus, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest } from '@flowsplit/shared';
import { JwtAuthGuard } from '@flowsplit/auth';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TwoFactorLoginDto } from './dto/two-factor.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2faSecret(@Req() req: any) {
    const { otpauthUrl, secret } = await this.authService.generate2faSecret(req.user.id);
    // Generate QR code image on the fly
    const qrCodeUrl = await this.authService['twoFactorService'].generateQrCodeDataURL(otpauthUrl);
    return { secret, qrCodeUrl };
  }

  // 2. Enable 2FA (Protected by JWT)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2fa(@Req() req: any, @Body() body: { code: string; secret: string }) {
    return this.authService.enable2fa(req.user.id, body.code, body.secret);
  }

  /**
   * Disables 2FA. Requires current password for security.
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2fa(@Req() req: any, @Body() body: { password: string }) {
    return this.authService.disable2fa(req.user.id, body.password);
  }

  // 3. Verify Login (Public - relies on tempToken)
  @Post('2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  async loginWith2fa(@Body() body: TwoFactorLoginDto) {
    return this.authService.loginWith2fa(body.tempToken, body.code);
  }
}