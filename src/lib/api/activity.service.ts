import { apiRequest } from './client';
import type { ActivityLog, Notification, ApiResponse } from '@/types';

export const activityService = {
  async getLogs(householdId?: string): Promise<ApiResponse<ActivityLog[]>> {
    return apiRequest<ActivityLog[]>(householdId ? `/households/${householdId}/activity` : '/admin/logs');
  },
};

export const notificationService = {
  async getNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    return apiRequest<Notification[]>(`/users/${userId}/notifications`);
  },

  async markRead(notificationId: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
  },

  async markAllRead(userId: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/users/${userId}/notifications/read-all`, { method: 'PATCH' });
  },
};
