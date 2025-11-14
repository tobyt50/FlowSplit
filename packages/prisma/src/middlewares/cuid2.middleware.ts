import { Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const MODELS_WITH_CUID2: Prisma.ModelName[] = [
  'User',
  'Wallet',
  'Account',
  'SplitRule',
  'Transaction',
  'Analytics',
  'Notification',
  'WebhookEvent',
];

export function cuid2Middleware(): Prisma.Middleware {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
    if (!params.model || !MODELS_WITH_CUID2.includes(params.model)) {
      return next(params);
    }

    if (params.action === 'create') {
      if (params.args.data && typeof params.args.data === 'object' && !Array.isArray(params.args.data)) {
        const data = params.args.data as Record<string, any>;
        if (!data.id) {
          data.id = createId();
        }
      }
    } else if (params.action === 'createMany') {
      if (Array.isArray(params.args.data)) {
        for (const item of params.args.data) {
          if (typeof item === 'object' && item !== null) {
            const itemData = item as Record<string, any>;
            if (!itemData.id) {
              itemData.id = createId();
            }
          }
        }
      }
    }
    return next(params);
  };
}