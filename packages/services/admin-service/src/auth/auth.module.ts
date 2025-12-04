import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, USERS_SERVICE_TOKEN } from '@flowsplit/auth';
import { UsersService } from '../users/users.service';

@Global()
@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    JwtStrategy,
    UsersService,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: UsersService,
    },
  ],
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}