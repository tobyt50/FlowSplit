import { Module } from '@nestjs/common';
import { AuthService } from '../modules/auth.service';
import { AuthController } from '../modules/auth.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy, SharedAuthModule, USERS_SERVICE_TOKEN } from '@flowsplit/auth';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    ConfigModule,
    SharedAuthModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UsersService,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: UsersService,
    },
  ],
})
export class AuthModule {}