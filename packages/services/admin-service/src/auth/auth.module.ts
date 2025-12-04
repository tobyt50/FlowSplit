import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, USERS_SERVICE_TOKEN } from '@flowsplit/auth';
import { AdminAuthUserService } from './admin-auth-user.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    JwtStrategy,
    AdminAuthUserService,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: AdminAuthUserService,
    },
  ],
  exports: [PassportModule],
})
export class AuthModule {}