import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminUser {
        id: string;
        email: string;
        role: 'ADMIN';
    }

interface AdminAuthState {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
}

interface AdminAuthActions {
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState & AdminAuthActions>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      login: (token, admin) => set({ token, admin, isAuthenticated: true }),
      logout: () => set({ token: null, admin: null, isAuthenticated: false }),
    }),
    { name: 'flowsplit-admin-auth' } // A separate key from the main app
  )
);