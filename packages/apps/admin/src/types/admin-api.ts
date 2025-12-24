import { AdminActionType, AuditLogLevel, UserStatus, Role, SplitType } from '@flowsplit/prisma';

export interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  wallets: any[];
  bankAccounts: any[];
  transactions: any[];
  splitRules: any[];
}

export interface UserListItem {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: Role;
    status: UserStatus;
    createdAt: string;
    _count: { wallets: number; transactions: number };
}

export interface UserListResponse {
    data: UserListItem[];
    meta: { total: number; page: number; limit: number; lastPage: number };
}

export interface AdminDashboardMetrics {
    totalUsers: number;
    totalTransactions: number;
    totalAuditLogs: number;
    criticalAlerts: number;
}
  
export interface UserGrowthDataPoint {
    date: string;
    count: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminUserId: string;
  adminUserEmail: string;
  action: AdminActionType;
  level: AuditLogLevel;
  targetUserId: string | null;
  targetEntityId: string | null;
  details: any;
}

export interface AuditLogResponse {
  data: AuditLog[];
  meta: { total: number; page: number; limit: number; lastPage: number };
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  adminUserId?: string;
  targetUserId?: string;
  action?: AdminActionType;
  level?: AuditLogLevel;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isPrimary: boolean;
}

export interface SplitRule {
  id: string;
  name: string;
  type: SplitType;
  value: number;
  priority: number;
  isActive: boolean;
  destinationWalletId: string | null;
}