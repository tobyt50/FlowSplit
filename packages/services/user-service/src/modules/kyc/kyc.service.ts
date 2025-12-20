import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService, KycStatus, KycTier, IdType } from '@flowsplit/prisma';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import axios from 'axios';
import * as crypto from 'crypto';
import { S3Provider } from '@flowsplit/storage';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private encryptionKey: Buffer;
  private paystackClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storage: S3Provider,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {
    // Reuse the secure key for encrypting BVNs
    const key = this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY');
    if (!key) throw new Error('Encryption key missing');
    this.encryptionKey = Buffer.from(key, 'hex');

    this.paystackClient = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Step 1: Submit BVN for Verification
   * This is the entry point from the Frontend.
   */
  async submitBvn(userId: string, bvn: string, dob: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.providerId) throw new BadRequestException('User not registered with payment provider');

    // 1. Encrypt and Store BVN immediately
    const encryptedBvn = this.encrypt(bvn);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bvn: encryptedBvn,
        // Convert string YYYY-MM-DD to Date object
        dateOfBirth: new Date(dob),
        kycStatus: KycStatus.PENDING,
      },
    });

    try {
      // 2. Call Paystack Identity API
      // We validate the BVN against the user's First/Last name on file
      await this.paystackClient.post(`/customer/${user.providerId}/identification`, {
        country: 'NG',
        type: 'bvn',
        value: bvn,
        first_name: user.fullName.split(' ')[0],
        last_name: user.fullName.split(' ')[1] || '',
      });

      this.logger.log(`KYC initiated for user ${userId}`);
      return { status: 'PENDING', message: 'Verification in progress. You will be notified shortly.' };

    } catch (error: any) {
      this.logger.error('Paystack KYC submission failed', error.response?.data);
      // Revert status on API failure
      await this.prisma.user.update({
        where: { id: userId },
        data: { kycStatus: KycStatus.FAILED, kycRejectionReason: 'Provider submission error' },
      });
      throw new BadRequestException(error.response?.data?.message || 'Verification submission failed');
    }
  }

  /**
   * Step 2: Handle Webhook Success
   * Called when Paystack confirms the ID matches.
   */
  async processKycSuccess(customerCode: string) {
    const user = await this.prisma.user.findFirst({ where: { providerId: customerCode } });
    if (!user) return;

    this.logger.log(`KYC Success for user ${user.id}. Upgrading to Tier 1.`);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        kycStatus: KycStatus.VERIFIED,
        kycTier: KycTier.TIER_1,
        kycRejectionReason: null,
      },
    });
    
    const payload = { 
        userId: user.id, 
        tier: 'Tier 1', 
        message: 'Your identity has been verified successfully. Higher limits unlocked.' 
    };
    const record = new RmqRecordBuilder(payload).build();
    this.notificationClient.emit('kyc.success', record);
    // -------------------------------
  }

  /**
   * Step 3: Handle Webhook Failure
   */
  async processKycFailure(customerCode: string, reason: string) {
    const user = await this.prisma.user.findFirst({ where: { providerId: customerCode } });
    if (!user) return;

    this.logger.warn(`KYC Failed for user ${user.id}: ${reason}`);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        kycStatus: KycStatus.FAILED,
        kycTier: KycTier.TIER_0,
        kycRejectionReason: reason,
      },
    });

    const payload = { 
        userId: user.id, 
        reason: reason 
    };
    const record = new RmqRecordBuilder(payload).build();
    this.notificationClient.emit('kyc.failed', record);
    // -------------------------------
  }

  /**
   * Handles the submission of Tier 2 KYC documents (Government ID + Selfie).
   * Files are uploaded to S3, and metadata is encrypted/stored in DB.
   */
  async submitTier2Docs(
    userId: string,
    idType: IdType,
    idNumber: string,
    idImageBuffer: Buffer,
    idImageMime: string,
    selfieBuffer: Buffer,
    selfieMime: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // 1. Logic Check: Must have completed Tier 1 (BVN) first
    if (user.kycTier !== KycTier.TIER_1 && user.kycStatus !== KycStatus.VERIFIED) {
        // Exception: If they failed Tier 2 previously, allow retry.
        // Otherwise, block if they haven't even done Tier 1.
        if (user.kycStatus !== KycStatus.FAILED) {
            throw new BadRequestException('You must complete Tier 1 (BVN) verification before submitting documents.');
        }
    }

    this.logger.log(`Starting Tier 2 KYC submission for user ${userId}`);

    try {
        // 2. Upload Images to Secure S3 Storage (Parallel Uploads)
        // We store the 'Key' (path), not the full URL, for security.
        const [idKey, selfieKey] = await Promise.all([
            this.storage.uploadFile(idImageBuffer, idImageMime, 'documents'),
            this.storage.uploadFile(selfieBuffer, selfieMime, 'selfies')
        ]);

        // 3. Encrypt the sensitive ID Number
        const encryptedIdNum = this.encrypt(idNumber);

        // 4. Update Database
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                idType,
                idNumber: encryptedIdNum,
                idImageKey: idKey,
                selfieKey: selfieKey,
                kycStatus: KycStatus.PENDING, // Set to PENDING for manual/auto review
                // Note: We do NOT upgrade kycTier to TIER_2 yet. That happens only after Approval.
            }
        });

        // 5. Emit Event for Admin Notification (Optional but good for Ops)
        // In a real system, this puts the user into the "KYC Review Queue"
        this.logger.log(`Tier 2 docs uploaded for user ${userId}. Status set to PENDING.`);

        return { 
            status: 'PENDING', 
            message: 'Documents uploaded securely. Your application is under review.' 
        };

    } catch (error: any) {
        this.logger.error(`Tier 2 submission failed for user ${userId}`, error.stack);
        throw new BadRequestException('Failed to process documents. Please try again.');
    }
  }

  // --- CRYPTO HELPERS (Same as 2FA service) ---
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    // @ts-ignore: Suppress type conflict
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text);
    // @ts-ignore: Suppress type conflict for Buffer.concat
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
}