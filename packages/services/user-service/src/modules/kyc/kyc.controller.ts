import { Controller, Post, Body, UseGuards, Req, Headers, BadRequestException, RawBodyRequest, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User, IdType } from '@flowsplit/prisma';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

// DTO
class SubmitKycDto {
  bvn!: string;
  dob!: string; // YYYY-MM-DD
}

@Controller({ path: 'kyc', version: '1' })
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly config: ConfigService,
  ) {}

  // 1. Frontend Endpoint
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  submitKyc(@CurrentUser() user: User, @Body() body: SubmitKycDto) {
    return this.kycService.submitBvn(user.id, body.bvn, body.dob);
  }

  /**
   * Endpoint for Tier 2 Document Submission.
   * Expects 'multipart/form-data' with fields:
   * - idType (String enum)
   * - idNumber (String)
   * - idImage (File)
   * - selfie (File)
   */
  @Post('submit-tier2')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'idImage', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]))
  async submitTier2(
    @CurrentUser() user: User,
    @Body() body: { idType: IdType; idNumber: string },
    @UploadedFiles() files: { idImage?: Express.Multer.File[]; selfie?: Express.Multer.File[] },
  ) {
    // 1. Strict File Validation
    if (!files.idImage || files.idImage.length === 0) {
        throw new BadRequestException('ID Document image is required.');
    }
    if (!files.selfie || files.selfie.length === 0) {
        throw new BadRequestException('Selfie image is required.');
    }
    if (!body.idType || !body.idNumber) {
        throw new BadRequestException('ID Type and Number are required.');
    }

    const idFile = files.idImage[0];
    const selfieFile = files.selfie[0];

    // 2. Validate File Types (Security)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedMimes.includes(idFile.mimetype) || !allowedMimes.includes(selfieFile.mimetype)) {
        throw new BadRequestException('Invalid file format. Only JPG, PNG, or PDF allowed.');
    }

    // 3. Call Service
    return this.kycService.submitTier2Docs(
        user.id, 
        body.idType, 
        body.idNumber, 
        idFile.buffer, 
        idFile.mimetype,
        selfieFile.buffer,
        selfieFile.mimetype
    );
  }

  // 3. Webhook Endpoint (Public, Secured by Signature)
  @Post('webhook/paystack')
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Missing request body');
    }
    const hash = crypto
      .createHmac('sha512', secret)
      .update(request.rawBody as any) 
      .digest('hex');

    if (hash !== signature) throw new BadRequestException('Invalid signature');

    const event = request.body;

    if (event.event === 'customeridentification.success') {
      await this.kycService.processKycSuccess(event.data.customer_code);
    } else if (event.event === 'customeridentification.failed') {
      await this.kycService.processKycFailure(event.data.customer_code, event.data.reason || 'Verification failed');
    }

    return { status: 'ok' };
  }
}