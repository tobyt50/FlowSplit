import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService, SplitType, Prisma, SplitRule } from '@flowsplit/prisma';
import { CreateRuleDto } from './dto/create-rule.dto';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createRuleDto: CreateRuleDto) {
    const { destinationWalletId, type, value } = createRuleDto;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findFirst({
        where: { id: destinationWalletId, userId: userId },
      });
      if (!wallet) {
        throw new NotFoundException(
          `Destination wallet with ID ${destinationWalletId} not found or you do not have permission to use it.`,
        );
      }

      if (type === SplitType.PERCENTAGE) {
        const allRules = await tx.splitRule.findMany({
          where: { userId, isActive: true, type: SplitType.PERCENTAGE },
        });

        const currentTotalPercentage = allRules.reduce(
          (sum: number, rule: SplitRule) => sum + rule.value,
          0,
        );
        if (currentTotalPercentage + value > 100) {
          throw new BadRequestException(
            `Adding this rule would cause the total percentage to exceed 100%. Current total: ${currentTotalPercentage}%`,
          );
        }
      }

      this.logger.log(`Creating rule '${createRuleDto.name}' for user ${userId}`);

      return tx.splitRule.create({
        data: {
          id: createId(),
          ...createRuleDto,
          userId: userId,
        },
      });
    });
  }

  async findAllForUser(userId: string) {
    this.logger.log(`Fetching all rules for user ${userId}`);
    return this.prisma.splitRule.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    });
  }
}