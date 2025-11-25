import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService, SplitType, Prisma, SplitRule } from '@flowsplit/prisma';
import { CreateRuleDto } from './dto/create-rule.dto';
import { createId } from '@paralleldrive/cuid2';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createRuleDto: CreateRuleDto) {
    const { destinationWalletId, type, value } = createRuleDto;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Verify destination wallet ownership and existence
      const wallet = await tx.wallet.findFirst({
        where: { id: destinationWalletId, userId: userId },
      });
      if (!wallet) {
        throw new NotFoundException(
          `Destination wallet with ID ${destinationWalletId} not found or you do not have permission to use it.`,
        );
      }

      // 2. If creating a PERCENTAGE rule, validate the total does not exceed 100%
      if (type === SplitType.PERCENTAGE) {
        await this.validatePercentageTotal(userId, value, tx);
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

  async update(userId: string, ruleId: string, updateRuleDto: UpdateRuleDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Verify the rule exists and belongs to the user
        const existingRule = await tx.splitRule.findFirst({
            where: { id: ruleId, userId: userId },
        });

        if (!existingRule) {
            throw new NotFoundException(`Rule with ID ${ruleId} not found or you do not have permission to edit it.`);
        }

        // 2. If the update changes the destination wallet, re-verify ownership
        if (updateRuleDto.destinationWalletId && updateRuleDto.destinationWalletId !== existingRule.destinationWalletId) {
            const newWallet = await tx.wallet.findFirst({
                where: { id: updateRuleDto.destinationWalletId, userId: userId },
            });
            if (!newWallet) {
                throw new NotFoundException(`New destination wallet with ID ${updateRuleDto.destinationWalletId} not found or you do not have permission to use it.`);
            }
        }

        // 3. If the update changes the value or type of a PERCENTAGE rule, re-validate the total
        const newType = updateRuleDto.type || existingRule.type;
        const newValue = updateRuleDto.value || existingRule.value;

        if (newType === SplitType.PERCENTAGE && (updateRuleDto.value !== undefined || updateRuleDto.type !== undefined)) {
            // Exclude the current rule's value from the total before adding the new value
            await this.validatePercentageTotal(userId, newValue, tx, ruleId);
        }

        this.logger.log(`Updating rule ${ruleId} for user ${userId}`);
        return tx.splitRule.update({
            where: { id: ruleId },
            data: updateRuleDto,
        });
    });
  }

  async remove(userId: string, ruleId: string): Promise<void> {
    // We wrap this in a transaction for consistency, though it's a single operation
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Verify the rule exists and belongs to the user before deleting
        const rule = await tx.splitRule.findFirst({
            where: { id: ruleId, userId: userId },
        });

        if (!rule) {
            throw new NotFoundException(`Rule with ID ${ruleId} not found or you do not have permission to delete it.`);
        }

        this.logger.log(`Deleting rule ${ruleId} for user ${userId}`);
        await tx.splitRule.delete({
            where: { id: ruleId },
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

  /**
   * A private helper method to validate the total percentage for a user's rules.
   * Can be used for both creation and updates.
   * @param userId The user to validate against.
   * @param newValue The new percentage value being added or updated.
   * @param tx The Prisma transaction client.
   * @param ruleIdToExclude An optional rule ID to exclude from the sum (for update operations).
   */
  private async validatePercentageTotal(
    userId: string,
    newValue: number,
    tx: Prisma.TransactionClient,
    ruleIdToExclude?: string
  ) {
    const allPercentageRules = await tx.splitRule.findMany({
      where: {
        userId,
        isActive: true,
        type: SplitType.PERCENTAGE,
        // If we are updating, exclude the rule being updated from the initial sum
        NOT: {
          id: ruleIdToExclude,
        },
      },
    });

    const currentTotalPercentage = allPercentageRules.reduce(
      (sum: number, rule: SplitRule) => sum + rule.value,
      0,
    );

    if (currentTotalPercentage + newValue > 100) {
      throw new BadRequestException(
        `This action would cause the total percentage to exceed 100%. Current total (excluding this rule): ${currentTotalPercentage.toFixed(2)}%`,
      );
    }
  }
}