// This file centralizes all environment variables.
// It provides a fallback to localhost for development convenience.

export const API_URLS = {
  MONOLITH: process.env.NEXT_PUBLIC_MONOLITH_SERVICE_URL || 'http://localhost:4000/api/v1',
  AI: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:3107/api', 
};

// export const API_URLS = {
//   AUTH: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3100/api/v1',
//   USER: process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3101/api/v1',
//   WALLET: process.env.NEXT_PUBLIC_WALLET_SERVICE_URL || 'http://localhost:3102/api/v1',
//   TRANSACTION: process.env.NEXT_PUBLIC_TRANSACTIONS_SERVICE_URL || 'http://localhost:3103/api/v1',
//   RULE: process.env.NEXT_PUBLIC_RULE_SERVICE_URL || 'http://localhost:3104/api/v1',
//   PAYOUT: process.env.NEXT_PUBLIC_PAYOUT_SERVICE_URL || 'http://localhost:3105/api/v1',
//   DASHBOARD: process.env.NEXT_PUBLIC_DASHBOARD_SERVICE_URL || 'http://localhost:3106/api/v1',
//   AI: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:3107/api/v1',
//   NOTIFICATION: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3108/api/v1',
// };