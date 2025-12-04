import api from './api'; // Our authenticated axios instance
import { API_URLS } from './config';

// Matches the Pydantic 'InsightPayload' model
export interface InsightPayload {
  amount?: string;
  currentRate?: number;
  name?: string;
  walletName?: string;
}

// Matches the Pydantic 'AIInsight' model
export interface AIInsight {
  insightCode: string;
  title: string;
  description: string;
  actionText: string | null;
  payload: InsightPayload;
}

/**
 * Fetches the single, highest-priority insight for the current user.
 * Calls the Python AI microservice.
 */
export const getAIInsight = async (): Promise<AIInsight> => {
  try {
    const response = await api.get<AIInsight>(
      `${API_URLS.AI}/insight`
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch AI insight:', error);
    // Return a safe fallback if the AI service is down or errors out
    return {
      insightCode: 'DEFAULT_ERROR',
      title: 'Insights Unavailable',
      description: 'We could not generate your financial insights at this moment.',
      actionText: null,
      payload: {},
    };
  }
};