import { apiRequest } from './client';
import type { Expense, ApiResponse, PaginatedResponse } from '@/types';

export const expenseService = {
  async getExpenses(householdId: string): Promise<ApiResponse<PaginatedResponse<Expense>>> {
    return apiRequest<PaginatedResponse<Expense>>(`/households/${householdId}/expenses`);
  },

  async getExpense(expenseId: string): Promise<ApiResponse<Expense>> {
    return apiRequest<Expense>(`/expenses/${expenseId}`);
  },

  async createExpense(payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Expense>> {
    return apiRequest<Expense>(`/households/${payload.householdId}/expenses`, {
      method: 'POST',
      body: payload,
    });
  },

  async updateExpense(expenseId: string, payload: Partial<Expense>): Promise<ApiResponse<Expense>> {
    return apiRequest<Expense>(`/expenses/${expenseId}`, { method: 'PATCH', body: payload });
  },

  async deleteExpense(expenseId: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/expenses/${expenseId}`, { method: 'DELETE' });
  },

  async settleExpense(expenseId: string): Promise<ApiResponse<Expense>> {
    return apiRequest<Expense>(`/expenses/${expenseId}/settle`, { method: 'POST' });
  },
};
