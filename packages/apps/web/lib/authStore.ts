import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@flowsplit/prisma';

// Define the shape of the store's state
interface AuthState {
  token: string | null;
  user: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
}

// Define the actions that can be performed on the state
interface AuthActions {
  setToken: (token: string) => void;
  setUser: (user: Omit<User, 'password'>) => void;
  logout: () => void;
}

// Create the store using Zustand
export const useAuthStore = create<AuthState & AuthActions>()(
  // Use the 'persist' middleware to automatically save the auth state
  // to localStorage. This keeps the user logged in across page reloads.
  persist(
    (set) => ({
      // Initial state
      token: null,
      user: null,
      isAuthenticated: false,

      // Action to set the token and update authentication status
      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
      },

      // Action to set the user's profile data
      setUser: (user) => {
        set({ user });
      },

      // Action to clear all authentication data, effectively logging the user out
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'flowsplit-auth-storage', // The key to use in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);