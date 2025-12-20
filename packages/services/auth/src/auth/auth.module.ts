import { Module } from '@nestjs/common';
import { AuthService } from '../modules/auth.service';
import { AuthController } from '../modules/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, USERS_SERVICE_TOKEN } from '@flowsplit/auth';
import { UsersService } from '../users/users.service';
import { UsersModule } from '../users/users.module'; 
import { TwoFactorAuthService } from '../modules/two-factor-auth.service';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFactorAuthService,
    JwtStrategy,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: UsersService,
    },
  ],
  exports: [AuthService, JwtModule, PassportModule]
})
export class AuthModule {}