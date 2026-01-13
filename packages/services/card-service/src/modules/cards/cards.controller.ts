import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  UseGuards, 
  BadRequestException, 
  Patch, 
  Delete, 
  HttpCode, 
  HttpStatus, 
  Inject 
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User, PrismaService, CardStatus } from '@flowsplit/prisma';
import { StripeIssuingService } from '../../providers/stripe/stripe-issuing.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { createId } from '@paralleldrive/cuid2';
import { UpdateCardStatusDto } from './dto/update-card-status.dto';

class CreateCardDto {
  @IsString() @IsNotEmpty() walletId!: string;
  @IsString() @IsNotEmpty() nameOnCard!: string;
}

@Controller({ path: 'cards', version: '1' })
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(
    // We inject using the token 'CARD_ISSUER'. 
    // In dev, this brings in MockIssuingService. In prod, it could bring in StripeIssuingService.
    // We use the StripeIssuingService type here to ensure our Mock implements the expected methods.
    @Inject('CARD_ISSUER') private stripeService: StripeIssuingService,
    private prisma: PrismaService
  ) {}

  @Post()
  async createCard(@CurrentUser() user: User, @Body() body: CreateCardDto) {
    // 1. Verify Wallet Ownership
    const wallet = await this.prisma.wallet.findFirst({
        where: { id: body.walletId, userId: user.id }
    });
    if (!wallet) throw new BadRequestException("Wallet not found");

    // 2. Issue Card via Provider (Mock or Real)
    // The service handles the idempotent Cardholder creation internally
    const stripeCard = await this.stripeService.createVirtualCard(user, wallet, body.nameOnCard);

    // 3. Save Virtual Card to Database
    const card = await this.prisma.virtualCard.create({
        data: {
            id: createId(),
            userId: user.id,
            walletId: wallet.id,
            nameOnCard: body.nameOnCard,
            provider: 'STRIPE', // We keep this as STRIPE even when mocking for consistency
            providerCardId: stripeCard.providerCardId,
            last4: stripeCard.last4,
            brand: stripeCard.brand,
            expiryMonth: stripeCard.expiryMonth,
            expiryYear: stripeCard.expiryYear,
            status: 'ACTIVE'
        }
    });

    return card;
  }

  @Get()
  async getUserCards(@CurrentUser() user: User) {
    return this.prisma.virtualCard.findMany({
        where: { userId: user.id },
        include: { wallet: true },
        orderBy: { createdAt: 'desc' }
    });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: UpdateCardStatusDto
  ) {
    const card = await this.prisma.virtualCard.findFirst({
        where: { id, userId: user.id }
    });
    if (!card) throw new BadRequestException("Card not found");

    const newStatus = body.status === 'FROZEN' ? CardStatus.FROZEN : CardStatus.ACTIVE;
    const stripeStatus = body.status === 'FROZEN' ? 'inactive' : 'active';

    // Sync status with Provider
    await this.stripeService.updateCardStatus(card.providerCardId, stripeStatus);

    // Update Local DB
    return this.prisma.virtualCard.update({
        where: { id },
        data: { status: newStatus }
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancelCard(
    @Param('id') id: string,
    @CurrentUser() user: User
  ) {
    const card = await this.prisma.virtualCard.findFirst({
        where: { id, userId: user.id }
    });

    if (!card) {
        throw new BadRequestException("Card not found or access denied.");
    }

    if (card.status === CardStatus.CANCELED) {
        throw new BadRequestException("Card is already canceled.");
    }

    // Irreversibly cancel on Provider
    await this.stripeService.cancelCard(card.providerCardId);

    // Update Local DB
    const updatedCard = await this.prisma.virtualCard.update({
        where: { id },
        data: { status: CardStatus.CANCELED }
    });

    return updatedCard;
  }
}