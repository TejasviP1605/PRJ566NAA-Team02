import { apiRequest } from './client';
import type { Payment, ApiResponse, PaginatedResponse } from '@/types';

export const paymentService = {
  async getPayments(householdId: string): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    return apiRequest<PaginatedResponse<Payment>>(`/households/${householdId}/payments`);
  },

  async getMyPayments(userId: string): Promise<ApiResponse<Payment[]>> {
    return apiRequest<Payment[]>(`/users/${userId}/payments`);
  },

  async markPaid(paymentId: string, method: Payment['method'], notes?: string): Promise<ApiResponse<Payment>> {
    return apiRequest<Payment>(`/payments/${paymentId}/mark-paid`, {
      method: 'PATCH',
      body: { method, notes },
    });
  },

  async markUnpaid(paymentId: string): Promise<ApiResponse<Payment>> {
    return apiRequest<Payment>(`/payments/${paymentId}/mark-unpaid`, { method: 'PATCH' });
  },

  async sendReminder(paymentId: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/payments/${paymentId}/remind`, { method: 'POST' });
  },
};
