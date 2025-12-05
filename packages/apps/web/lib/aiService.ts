import { AIInsight } from '../types';
import api from './api';
import { API_URLS } from './config';

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