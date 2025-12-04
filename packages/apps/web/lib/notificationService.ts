import api from './api';
import { API_URLS } from './config';

export interface AppNotification {
  id: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl: string | null;
}

export const getUserNotifications = async (): Promise<AppNotification[]> => {
  try {
    const response = await api.get<AppNotification[]>(`${API_URLS.MONOLITH}/notifications`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications', error);
    return [];
  }
};

export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    await api.patch(`${API_URLS.MONOLITH}/notifications/${id}/read`);
  } catch (error) {
    console.error('Failed to mark notification as read', error);
  }
};