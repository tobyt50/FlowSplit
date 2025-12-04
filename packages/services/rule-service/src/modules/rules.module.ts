import { forwardRef, Module } from '@nestjs/common';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';

@Module({
  imports: [
  ],
  controllers: [RulesController],
  providers: [RulesService],
})
export class RulesModule {}