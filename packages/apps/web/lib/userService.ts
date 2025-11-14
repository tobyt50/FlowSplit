import api from './api'; // Our configured, authenticated axios instance
import { User } from '@flowsplit/prisma';

// Define the shape of the data needed to update a user's profile.
// We make all fields optional to allow for partial updates.
interface UpdateUserData {
  fullName?: string;
  // We could add other fields like avatarUrl here in the future.
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
      'http://localhost:3101/api/users/me', // URL to the user-service PATCH endpoint
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    throw new Error(error.response?.data?.message || 'Could not update your profile.');
  }
};