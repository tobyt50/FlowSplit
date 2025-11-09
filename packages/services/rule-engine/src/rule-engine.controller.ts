import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { RuleEngineService } from './rule-engine.service';

interface DepositReceivedPayload {
  userId: string;
  transactionId: string;
  amount: number;
}

@Controller()
export class RuleEngineController {
  private readonly logger = new Logger(RuleEngineController.name);

  constructor(private readonly ruleEngineService: RuleEngineService) {}

  @EventPattern('deposit.received')
  async handleDepositReceived(
    @Payload() data: DepositReceivedPayload,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`Received event for transaction: ${data.transactionId}`);
      await this.ruleEngineService.processSplit(data);

      channel.ack(originalMsg);
      this.logger.log(`Successfully acknowledged event for transaction: ${data.transactionId}`);

    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let errorStack = undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else {
        errorMessage = `A non-error was thrown: ${JSON.stringify(error)}`;
      }

      this.logger.error(
        `Failed to process split for transaction ${data.transactionId}: ${errorMessage}`,
        errorStack,
      );
      
      channel.nack(originalMsg, false, true);
    }
  }
}