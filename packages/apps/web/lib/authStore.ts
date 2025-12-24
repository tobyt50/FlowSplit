import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types/index'; 
import Cookies from 'js-cookie';

// Define the shape of the store's state
interface AuthState {
  token: string | null;
  user: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
}

// Define the actions that can be performed on the state
interface AuthActions {
  setToken: (_token: string) => void;
  setUser: (_user: Omit<User, 'password'>) => void;
  logout: () => void;
}

const customStorage = {
  getItem: (name: string) => {
    // Try to get from localStorage first
    const str = localStorage.getItem(name);
    // Also ensure the cookie is set if the item exists
    if (str) {
      try {
        const parsed = JSON.parse(str);
        if (parsed.state && parsed.state.token) {
           Cookies.set('flowsplit_token', parsed.state.token, { expires: 1 });
        }
      } catch (e) {
        // Ignore parsing errors on read
      }
    }
    return str;
  },
  setItem: (name: string, value: string) => {
    // Set both localStorage and the cookie
    localStorage.setItem(name, value);
    try {
      const token = JSON.parse(value).state.token;
      if (token) {
        Cookies.set('flowsplit_token', token, { expires: 1 }); // expires in 1 day
      } else {
        Cookies.remove('flowsplit_token');
      }
    } catch (e) {
      // Ignore JSON parse errors during storage sync
      // This prevents the build from failing due to the no-empty rule
    }
  },
  removeItem: (name: string) => {
    // Remove from both
    localStorage.removeItem(name);
    Cookies.remove('flowsplit_token');
  },
};

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
        Cookies.remove('flowsplit_token');
      },
    }),
    {
      name: 'flowsplit-auth-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);