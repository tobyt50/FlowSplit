import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService, KycStatus, KycTier } from '@flowsplit/prisma';
import { S3Provider } from '@flowsplit/storage'; // Shared lib
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';

@Injectable()
export class AdminKycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Provider,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async getPendingReviews() {
    return this.prisma.user.findMany({
      where: { kycStatus: KycStatus.PENDING, idImageKey: { not: null } }, // Only show Tier 2 pending
      select: {
        id: true,
        fullName: true,
        email: true,
        kycTier: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }, // FIFO Queue
    });
  }

  async getKycDocuments(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Generate Temporary Signed URLs (Valid for 15 mins)
    const [idUrl, selfieUrl] = await Promise.all([
      user.idImageKey ? this.s3.getSignedUrlForView(user.idImageKey) : null,
      user.selfieKey ? this.s3.getSignedUrlForView(user.selfieKey) : null,
    ]);

    return {
      user: { fullName: user.fullName, email: user.email, dob: user.dateOfBirth },
      documents: { idUrl, selfieUrl, idType: user.idType, idNumber: user.idNumber } // In prod, decrypt idNumber
    };
  }

  async processReview(userId: string, approved: boolean, rejectionReason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (approved) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: KycStatus.VERIFIED,
          kycTier: KycTier.TIER_2, // Upgrade to Tier 2
          kycRejectionReason: null,
        },
      });

      // Emit Success Event
      this.notificationClient.emit('kyc.success', new RmqRecordBuilder({
        userId, tier: 'Tier 2', message: 'Your documents have been verified.'
      }).build());

    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: KycStatus.FAILED,
          kycRejectionReason: rejectionReason || 'Documents rejected by admin.',
          // Do not downgrade tier if they were already Tier 1, just fail the Tier 2 attempt
        },
      });

      // Emit Failure Event
      this.notificationClient.emit('kyc.failed', new RmqRecordBuilder({
        userId, reason: rejectionReason
      }).build());
    }

    return { success: true };
  }
}