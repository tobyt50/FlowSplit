import { forwardRef, Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AuditModule } from '../../audit/audit.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}