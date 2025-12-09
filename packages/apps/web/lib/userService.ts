import api from './api';
import { User } from '../types/index';
import { API_URLS } from './config';

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Updates the profile of the currently authenticated user.
 * The JWT is automatically attached by the axios interceptor.
 * @param data - The user profile data to update.
 * @returns A promise that resolves to the updated user object.
 */
export const updateUserProfile = async (data: UpdateUserData): Promise<Omit<User, 'password'>> => {
  try {
    const response = await api.patch<Omit<User, 'password'>>(
      `${API_URLS.MONOLITH}/users/me`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    throw new Error(error.response?.data?.message || 'Could not update your profile.');
  }
};