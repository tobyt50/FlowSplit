import { Injectable, BadRequestException, Logger, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { PrismaService, KycTier, TierLimit } from '@flowsplit/prisma';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { endOfDay, endOfMonth } from 'date-fns';
import { ILimitNotifier, LIMIT_NOTIFIER } from './interfaces/limit-notifier.interface';

@Injectable()
export class LimitService implements OnModuleInit {
  private readonly logger = new Logger(LimitService.name);
  private redis: Redis;

  private readonly RULES_CACHE_TTL = 300; // 5 Minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Optional() @Inject(LIMIT_NOTIFIER) private readonly notifier?: ILimitNotifier,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    const env = this.config.get<string>('NODE_ENV');

    if (!redisUrl) {
      if (env === 'production') {
        this.logger.error('FATAL: REDIS_URL is not configured in production environment.');
        throw new Error('REDIS_URL not configured');
      }
      
      this.logger.warn('⚠️ REDIS_URL not found. Using In-Memory Redis Mock. Limits will reset on restart.');
      // FIX: Force cast the mock to the Redis type to satisfy TypeScript
      this.redis = new RedisMock() as unknown as Redis;
    } else {
      this.logger.log('✅ Connecting to Redis instance...');
      this.redis = new Redis(redisUrl);
    }
  }

  async onModuleInit() {
    try {
      // FIX: We can simply call ping() because we cast it to Redis in the constructor.
      // Both real Redis and RedisMock support .ping()
      await this.redis.ping();
      this.logger.log('LimitService Redis connection ready.');
    } catch (e) {
      this.logger.error('LimitService failed to connect to Redis.', e);
    }
  }

  /**
   * THE GATEKEEPER
   * 1. Caches Rules to minimize DB latency.
   * 2. Checks Limits.
   * 3. Reserves Usage.
   * 4. Asynchronously triggers "Threshold Alerts" (80%, 100%).
   */
  async checkAndRecordLimit(userId: string, amount: bigint, category: string = 'GENERAL'): Promise<void> {
    // 1. Get User Tier (Fast DB lookup, indexed)
    const user = await this.prisma.user.findUnique({ 
        where: { id: userId },
        select: { id: true, kycTier: true } 
    });
    if (!user) throw new Error('User not found');

    // 2. Get Rules (Read-Through Cache Pattern)
    const rules = await this.getRulesWithCache(user.kycTier);

    if (!rules) {
       this.logger.error(`No Limit Rules defined for tier ${user.kycTier}. Blocking transaction.`);
       throw new BadRequestException('Transaction limit configuration error. Please contact support.');
    }

    // 3. Check Per-Transaction Limit
    if (rules.maxPerTransaction > -1n && amount > rules.maxPerTransaction) {
      throw new BadRequestException(
        `Transaction exceeds your tier limit of ${this.format(rules.maxPerTransaction)}. Upgrade your tier.`
      );
    }

    // 4. Fetch Current Aggregates (Redis)
    const todayKey = `limits:${userId}:daily:${new Date().toISOString().split('T')[0]}`;
    const monthKey = `limits:${userId}:monthly:${new Date().toISOString().slice(0, 7)}`;
    
    const [currentDailyStr, currentMonthlyStr] = await this.redis.mget(todayKey, monthKey);
    const currentDaily = BigInt(currentDailyStr || '0');
    const currentMonthly = BigInt(currentMonthlyStr || '0');

    // 5. Check Aggregates (Pre-flight)
    if (rules.maxDaily > -1n && (currentDaily + amount) > rules.maxDaily) {
       const remaining = rules.maxDaily - currentDaily;
       throw new BadRequestException(
           `Daily limit exceeded. You have ${this.format(remaining > 0n ? remaining : 0n)} remaining today.`
       );
    }

    if (rules.maxMonthly > -1n && (currentMonthly + amount) > rules.maxMonthly) {
       throw new BadRequestException(`Monthly transaction limit exceeded.`);
    }

    // 6. Commit Usage (Reservation)
    const amountStr = amount.toString();
    const pipeline = this.redis.pipeline();

    pipeline.incrby(todayKey, amountStr);
    pipeline.expireat(todayKey, Math.floor(endOfDay(new Date()).getTime() / 1000));
    
    pipeline.incrby(monthKey, amountStr);
    pipeline.expireat(monthKey, Math.floor(endOfMonth(new Date()).getTime() / 1000));
    
    await pipeline.exec();
    
    this.logger.debug(`Limits reserved for ${userId}. Amount: ${amount}`);

    // 7. SMART ANALYSIS: Check Thresholds & Alert (Fire and Forget)
    // We pass the new total (current + amount) to the analyzer
    this.analyzeThresholds(user.id, currentDaily + amount, rules.maxDaily, 'DAILY');
    this.analyzeThresholds(user.id, currentMonthly + amount, rules.maxMonthly, 'MONTHLY');
  }

  /**
   * COMPENSATION LOGIC
   */
  async rollbackUsage(userId: string, amount: bigint) {
    const todayKey = `limits:${userId}:daily:${new Date().toISOString().split('T')[0]}`;
    const monthKey = `limits:${userId}:monthly:${new Date().toISOString().slice(0, 7)}`;
    const amountStr = amount.toString();

    const pipeline = this.redis.pipeline();
    pipeline.incrby(todayKey, `-${amountStr}`);
    pipeline.incrby(monthKey, `-${amountStr}`);
    await pipeline.exec();
    
    this.logger.warn(`Limit usage rolled back for user ${userId}. Amount: ${amount}`);
  }

  /**
   * STATUS REPORTING (Read-Only)
   */
  async getLimitStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ 
        where: { id: userId },
        select: { kycTier: true } 
    });
    if (!user) throw new Error('User not found');

    const rules = await this.getRulesWithCache(user.kycTier);
    if (!rules) return null; 

    const todayKey = `limits:${userId}:daily:${new Date().toISOString().split('T')[0]}`;
    const monthKey = `limits:${userId}:monthly:${new Date().toISOString().slice(0, 7)}`;

    const [dailyUsedStr, monthlyUsedStr] = await this.redis.mget(todayKey, monthKey);
    const dailyUsed = BigInt(dailyUsedStr || '0');
    const monthlyUsed = BigInt(monthlyUsedStr || '0');

    const dailyRemaining = rules.maxDaily === -1n ? -1n : rules.maxDaily - dailyUsed;
    const monthlyRemaining = rules.maxMonthly === -1n ? -1n : rules.maxMonthly - monthlyUsed;

    return {
      tier: user.kycTier,
      currency: 'NGN',
      daily: {
        limit: rules.maxDaily.toString(),
        used: dailyUsed.toString(),
        remaining: dailyRemaining.toString(),
      },
      monthly: {
        limit: rules.maxMonthly.toString(),
        used: monthlyUsed.toString(),
        remaining: monthlyRemaining.toString(),
      }
    };
  }

  // --- PRIVATE HELPERS ---

  private async getRulesWithCache(tier: KycTier): Promise<TierLimit | null> {
    const cacheKey = `rules:tier:${tier}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
        const parsed = JSON.parse(cached);
        return {
            ...parsed,
            maxPerTransaction: BigInt(parsed.maxPerTransaction),
            maxDaily: BigInt(parsed.maxDaily),
            maxMonthly: BigInt(parsed.maxMonthly),
            createdAt: new Date(parsed.createdAt),
            updatedAt: new Date(parsed.updatedAt),
        };
    }

    const rules = await this.prisma.tierLimit.findUnique({ where: { tier } });
    
    if (rules) {
        const serialized = JSON.stringify(rules, (_, v) => typeof v === 'bigint' ? v.toString() : v);
        await this.redis.set(cacheKey, serialized, 'EX', this.RULES_CACHE_TTL);
    }
    
    return rules;
  }

  /**
   * Checks if usage has crossed 80% or 100% and calls the notifier.
   * Debounced via Redis keys to prevent spamming notifications.
   */
  private async analyzeThresholds(userId: string, current: bigint, limit: bigint, type: 'DAILY' | 'MONTHLY') {
    // Only proceed if notifier is injected and limit is not infinite
    if (!this.notifier || limit === -1n) return;

    const percentage = Number((current * 100n) / limit);
    let threshold: '80' | '100' | null = null;

    if (percentage >= 100) threshold = '100';
    else if (percentage >= 80) threshold = '80';

    if (threshold) {
        const debounceKey = `limits:alert:${userId}:${type}:${threshold}:${new Date().toISOString().split('T')[0]}`;
        
        const alreadySent = await this.redis.set(debounceKey, '1', 'EX', 86400, 'NX');

        if (alreadySent === 'OK') {
            await this.notifier.sendLimitAlert({
                userId,
                type,
                percentUsed: percentage,
                threshold
            });
            this.logger.log(`Triggered ${threshold}% ${type} limit alert for user ${userId}`);
        }
    }
  }

  private format(amount: bigint) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(amount) / 100);
  }
}