import api from './api';
import { UserStatus, User } from '@flowsplit/prisma';
import { AdminDashboardMetrics, UserGrowthDataPoint, UserListResponse, AuditLogFilters, AuditLogResponse, UserDetail } from '../types/admin-api';

// The single, authoritative base URL for the admin service
const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:3109/api';

/**
 * Fetches the high-level metrics for the admin overview dashboard.
 */
export const getDashboardMetrics = async (): Promise<AdminDashboardMetrics> => {
  const response = await api.get<AdminDashboardMetrics>(`${ADMIN_API_BASE_URL}/admin/metrics`);
  return response.data;
};

/**
 * Fetches the time-series data for user growth.
 */
export const getUserGrowth = async (days: number = 30): Promise<UserGrowthDataPoint[]> => {
  const response = await api.get<UserGrowthDataPoint[]>(`${ADMIN_API_BASE_URL}/admin/metrics/user-growth`, {
    params: { days },
  });
  return response.data;
};

/**
 * Fetches a paginated list of all users.
 */
export const getUsers = async (page: number = 1, limit: number = 20): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>(`${ADMIN_API_BASE_URL}/admin/users`, {
        params: { page, limit }
    });
    return response.data;
};

/**
 * Fetches a paginated and filterable list of admin audit logs.
 */
export const getAuditLogs = async (filters: AuditLogFilters): Promise<AuditLogResponse> => {
  try {
    const response = await api.get<AuditLogResponse>(`${ADMIN_API_BASE_URL}/admin/logs`, {
      params: filters,
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch audit logs:', error);
    throw new Error(error.response?.data?.message || 'Could not load audit logs.');
  }
};

/**
 * Fetches the full, detailed profile of a single user.
 */
export const getAdminUserById = async (userId: string): Promise<UserDetail> => {
    const response = await api.get<UserDetail>(`${ADMIN_API_BASE_URL}/admin/users/${userId}`);
    return response.data;
};

/**
 * Updates the status of a user.
 */
export const updateUserStatus = async (
  { userId, status, reason }: { userId: string, status: UserStatus, reason: string }
): Promise<User> => {
    const response = await api.patch<User>(`${ADMIN_API_BASE_URL}/admin/users/${userId}/status`, {
        status,
        reason,
    });
    return response.data;
};