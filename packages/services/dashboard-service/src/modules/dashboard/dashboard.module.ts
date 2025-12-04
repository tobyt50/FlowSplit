import { forwardRef, Module } from '@nestjs/common';
import { DashboardController } from '../dashboard.controller';
import { DashboardService } from '../dashboard.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}