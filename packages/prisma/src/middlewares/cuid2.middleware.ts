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
  return async (params, next) => {
    if (!params.model) {
      return next(params);
    }

    if (MODELS_WITH_CUID2.includes(params.model)) {
      if (params.action === 'create') {
        if (!params.args.data.id) {
          params.args.data.id = createId();
        }
      } else if (params.action === 'createMany') {
        for (const item of params.args.data) {
          if (!item.id) {
            item.id = createId();
          }
        }
      }
    }
    return next(params);
  };
}