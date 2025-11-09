import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  RawBodyRequest,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class PaystackGuard implements CanActivate {
  private readonly logger = new Logger(PaystackGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>();

    const signature = request.headers['x-paystack-signature'] as string;
    if (!signature) {
      throw new UnauthorizedException('Paystack signature missing from header.');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Request body is missing.');
    }

    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      this.logger.error('FATAL: Paystack secret key is not configured.');
      throw new Error('Server misconfiguration: Paystack secret is missing.');
    }

    const rawBodyUint8Array = new Uint8Array(request.rawBody);

    const calculatedSignature = crypto
      .createHmac('sha512', secret)
      .update(rawBodyUint8Array)
      .digest('hex');

    try {
      const signatureBuffer = Buffer.from(signature, 'hex');
      const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'hex');

      if (signatureBuffer.length !== calculatedSignatureBuffer.length) {
        throw new UnauthorizedException('Invalid Paystack signature length.');
      }
      
      const signatureUint8Array = new Uint8Array(signatureBuffer);
      const calculatedSignatureUint8Array = new Uint8Array(calculatedSignatureBuffer);

      const isSignatureValid = crypto.timingSafeEqual(
        calculatedSignatureUint8Array,
        signatureUint8Array,
      );

      if (!isSignatureValid) {
        throw new UnauthorizedException('Invalid Paystack signature.');
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.warn(`Error during signature validation: ${error.message}`);
      } else {
        this.logger.warn('An unknown error occurred during signature validation.');
      }
      throw new UnauthorizedException('Invalid Paystack signature format or comparison failed.');
    }

    return true;
  }
}