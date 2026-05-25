import { apiRequest } from './client';
import type { MaintenanceRequest, MaintenanceStatus, ApiResponse, PaginatedResponse } from '@/types';

export const maintenanceService = {
  async getRequests(householdId: string): Promise<ApiResponse<PaginatedResponse<MaintenanceRequest>>> {
    return apiRequest<PaginatedResponse<MaintenanceRequest>>(`/households/${householdId}/maintenance`);
  },

  async getRequest(requestId: string): Promise<ApiResponse<MaintenanceRequest>> {
    return apiRequest<MaintenanceRequest>(`/maintenance/${requestId}`);
  },

  async createRequest(payload: Omit<MaintenanceRequest, 'id' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MaintenanceRequest>> {
    return apiRequest<MaintenanceRequest>(`/households/${payload.householdId}/maintenance`, {
      method: 'POST',
      body: payload,
    });
  },

  async updateStatus(requestId: string, status: MaintenanceStatus, note: string, updatedBy: string, updatedByName: string): Promise<ApiResponse<MaintenanceRequest>> {
    return apiRequest<MaintenanceRequest>(`/maintenance/${requestId}/status`, {
      method: 'PATCH',
      body: { status, note, updatedBy, updatedByName },
    });
  },
};
