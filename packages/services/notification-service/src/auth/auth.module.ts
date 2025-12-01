import { Module } from '@nestjs/common';
import { JwtStrategy, USERS_SERVICE_TOKEN, SharedAuthModule } from '@flowsplit/auth';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    SharedAuthModule,
    UsersModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: USERS_SERVICE_TOKEN,
      useExisting: UsersService,
    },
  ],
})
export class AuthModule {}