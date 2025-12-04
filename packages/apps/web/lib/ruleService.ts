import api from './api'; // Our configured, authenticated axios instance
import { SplitRule } from '../types/index';
import { SplitType } from './enums';

// --- DATA TRANSFER INTERFACES ---

/**
 * Defines the complete shape of data for CREATING a new split rule.
 * This interface is used by our frontend forms to ensure type safety.
 */
export interface CreateRuleData {
  name: string;
  type: SplitType; // Now uses the SplitType enum for flexibility
  value: number;   // This value can be a percentage or a kobo amount
  destinationWalletId: string;
  priority: number;
}

/**
 * Defines the shape of data for UPDATING an existing split rule.
 * All fields are optional to allow for partial updates (e.g., just toggling `isActive`).
 */
export interface UpdateRuleData {
  name?: string;
  type?: SplitType;
  value?: number;
  destinationWalletId?: string;
  priority?: number;
  isActive?: boolean;
}


// --- API SERVICE FUNCTIONS ---

/**
 * Fetches all split rules for the currently authenticated user.
 * The JWT is automatically attached by the axios interceptor.
 * @returns A promise that resolves to an array of the user's split rules.
 */
export const getRules = async (): Promise<SplitRule[]> => {
  try {
    const response = await api.get<SplitRule[]>(
      'http://localhost:4000/api/rules' //actual service http://localhost:3104
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch split rules:', error);
    throw new Error(error.response?.data?.message || 'Could not load your split rules.');
  }
};

/**
 * Creates a new split rule for the currently authenticated user.
 * @param data - The details for the new split rule, matching the CreateRuleData interface.
 * @returns A promise that resolves to the newly created split rule.
 */
export const createRule = async (data: CreateRuleData): Promise<SplitRule> => {
  try {
    // The payload is already in the correct format from our robust forms.
    // The form logic handles converting Naira to Kobo for FIXED types.
    const response = await api.post<SplitRule>(
      'http://localhost:4000/api/rules', // URL to the rule-service POST endpoint
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to create split rule:', error);
    throw new Error(error.response?.data?.message || 'Could not create your split rule.');
  }
};

/**
 * Updates a specific split rule for the currently authenticated user.
 * @param ruleId - The ID of the rule to update.
 * @param data - The data to update, matching the UpdateRuleData interface.
 * @returns A promise that resolves to the updated split rule.
 */
export const updateRule = async (ruleId: string, data: UpdateRuleData): Promise<SplitRule> => {
  try {
    const response = await api.patch<SplitRule>(
      `http://localhost:4000/api/rules/${ruleId}`, // URL to the rule-service PATCH endpoint
      data
    );
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update split rule ${ruleId}:`, error);
    throw new Error(error.response?.data?.message || 'Could not update your split rule.');
  }
};

/**
 * Deletes a specific split rule for the currently authenticated user.
 * @param ruleId - The ID of the rule to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteRule = async (ruleId: string): Promise<void> => {
    try {
        await api.delete(
            `http://localhost:4000/api/rules/${ruleId}` // URL to the rule-service DELETE endpoint
        );
    } catch (error: any) {
        console.error(`Failed to delete split rule ${ruleId}:`, error);
        throw new Error(error.response?.data?.message || 'Could not delete your split rule.');
    }
};