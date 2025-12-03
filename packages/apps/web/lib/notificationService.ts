import api from './api';

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
    const response = await api.get<AppNotification[]>('http://localhost:4000/api/notifications'); //actually http://localhost:3108
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications', error);
    return []; // Return empty array on failure to not break the UI
  }
};

export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    await api.patch(`http://localhost:4000/api/notifications/${id}/read`);
  } catch (error) {
    console.error('Failed to mark notification as read', error);
  }
};