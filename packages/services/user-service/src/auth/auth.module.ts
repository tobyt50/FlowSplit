import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, USERS_SERVICE_TOKEN } from '@flowsplit/auth';
import { UsersModule } from '../modules/users.module';
import { UsersService } from '../modules/users.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UsersModule),
  ],
  providers: [
    JwtStrategy,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: UsersService,
    },
  ],
  exports: [PassportModule],
})
export class AuthModule {}