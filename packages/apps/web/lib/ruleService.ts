import api from './api'; // Our configured, authenticated axios instance
import { SplitRule } from '@flowsplit/prisma';

// Define the shape of the data needed to create a new split rule
interface CreateRuleData {
  name: string;
  type: 'PERCENTAGE'; // For now, we only support percentage type
  value: number;
  destinationWalletId: string;
  priority?: number;
}

/**
 * Fetches all split rules for the currently authenticated user.
 * The JWT is automatically attached by the axios interceptor.
 * @returns A promise that resolves to an array of the user's split rules.
 */
export const getRules = async (): Promise<SplitRule[]> => {
  try {
    const response = await api.get<SplitRule[]>(
      'http://localhost:3104/api/rules' // URL to the rule-service
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch split rules:', error);
    throw new Error(error.response?.data?.message || 'Could not load your split rules.');
  }
};

/**
 * Creates a new split rule for the currently authenticated user.
 * @param data - The details for the new split rule.
 * @returns A promise that resolves to the newly created split rule.
 */
export const createRule = async (data: CreateRuleData): Promise<SplitRule> => {
  try {
    // Ensure the 'value' is sent as a number, not a string
    const payload = {
      ...data,
      value: Number(data.value),
    };
    const response = await api.post<SplitRule>(
      'http://localhost:3104/api/rules', // URL to the rule-service POST endpoint
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to create split rule:', error);
    throw new Error(error.response?.data?.message || 'Could not create your split rule.');
  }
};