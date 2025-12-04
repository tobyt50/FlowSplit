import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, USERS_SERVICE_TOKEN } from '@flowsplit/auth';
import { UsersModule } from '../modules/users.module';
import { UsersService } from '../modules/users.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: UsersService,
    },
  ],
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}