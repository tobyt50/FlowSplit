import { Module } from '@nestjs/common';
import { AuthService } from '../modules/auth.service';
import { AuthController } from '../modules/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '@flowsplit/auth';
import { SharedAuthModule } from '@flowsplit/auth'; 
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
    {
        provide: UsersService,
        useClass: UsersService
    },
  ],
})
export class AuthModule {}