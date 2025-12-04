import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, USERS_SERVICE_TOKEN } from '@flowsplit/auth';
import { AdminUsersModule } from '../modules/users/admin-users.module';
import { AdminUsersService } from '../modules/users/admin-users.service';


@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => AdminUsersModule),
  ],
  providers: [
    JwtStrategy,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: AdminUsersService,
    },
  ],
  exports: [PassportModule],
})
export class AuthModule {}