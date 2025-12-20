import api from './api';
import { useAdminAuthStore, AdminUser } from './authStore';
import { decodeAndValidateAdminJwt } from './jwt';

const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4000/api';

export const loginAdmin = async (data: { email: string, password: string }): Promise<void> => {
  try {
    const response = await api.post<{ accessToken: string }>(
      `${ADMIN_API_BASE_URL}/auth/login`,
      data
    );
    const { accessToken } = response.data;

    // 3. Use the new type-safe function.
    // This will throw an error if the user is not an admin, which our catch block will handle.
    const adminUser = decodeAndValidateAdminJwt(accessToken);

    // 4. The `adminUser` that comes out of the function is GUARANTEED to be of type AdminUser.
    // The TypeScript error is now resolved.
    useAdminAuthStore.getState().login(accessToken, adminUser);

  } catch (error: any) {
    // This catch block will now handle login failures, token validation failures,
    // and role validation failures all in one place.
    throw new Error(error.message || 'Login failed.');
  }
};

export const logoutAdmin = () => {
  useAdminAuthStore.getState().logout();
  window.location.href = '/login';
};