export interface LimitAlertPayload {
  userId: string;
  type: 'DAILY' | 'MONTHLY';
  percentUsed: number;
  threshold: '80' | '100';
}

export const LIMIT_NOTIFIER = 'LIMIT_NOTIFIER_TOKEN';

export interface ILimitNotifier {
  sendLimitAlert(payload: LimitAlertPayload): Promise<void>;
}