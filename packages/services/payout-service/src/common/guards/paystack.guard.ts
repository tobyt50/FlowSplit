import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class PaystackGuard implements CanActivate {
  private readonly logger = new Logger(PaystackGuard.name);

  constructor(private readonly configService: ConfigService) {}

  private safeCompare(a: string, b: string): boolean {
    const aBuf = new Uint8Array(Buffer.from(a, 'utf8'));
    const bBuf = new Uint8Array(Buffer.from(b, 'utf8'));

    if (aBuf.length !== bBuf.length) return false;

    return crypto.timingSafeEqual(aBuf, bBuf);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RawBodyRequest<Request>>();

    const signature = request.headers['x-paystack-signature'] as string;

    if (!signature) {
      this.logger.warn('Paystack signature missing.');
      throw new UnauthorizedException('Webhook signature missing.');
    }

    if (!request.rawBody) {
      this.logger.error('Missing rawBody.');
      throw new BadRequestException('Request raw body missing.');
    }

    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      this.logger.error('PAYSTACK_SECRET_KEY not configured.');
      throw new Error('Paystack secret key is not configured.');
    }

    const rawString = Buffer.isBuffer(request.rawBody)
      ? request.rawBody.toString('utf8')
      : String(request.rawBody);

    const calculatedSignature = crypto
      .createHmac('sha512', secret)
      .update(rawString, 'utf8')
      .digest('hex');

    const isValid = this.safeCompare(calculatedSignature, signature);

    if (!isValid) {
      this.logger.warn('Invalid Paystack webhook signature.');
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    return true;
  }
}
