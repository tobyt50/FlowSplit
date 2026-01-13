import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * STRICT GUARD: For Authentication endpoints (Login, Register, 2FA).
 * Prevents brute-force attacks.
 * Limit: 5 requests per minute.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track by IP address
    return req.ips.length ? req.ips[0] : req.ip; 
  }
  protected errorMessage = 'Too many login attempts. Please try again in a minute.';
}

/**
 * HIGH-RISK GUARD: For Financial Write operations (Payouts, Transfers).
 * Prevents spamming money movement APIs.
 * Limit: 10 requests per minute.
 */
@Injectable()
export class FinancialThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip;
  }
  protected errorMessage = 'Transaction rate limit exceeded.';
}

/**
 * PUBLIC GUARD: For unauthenticated endpoints (Landing page data, Health checks).
 * Limit: 50 requests per minute.
 */
@Injectable()
export class PublicThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip;
  }
}