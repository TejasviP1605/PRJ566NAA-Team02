import { apiRequest } from './client';
import type { Household, HouseholdMember, ApiResponse } from '@/types';

export const householdService = {
  async getHousehold(householdId: string): Promise<ApiResponse<Household>> {
    return apiRequest<Household>(`/households/${householdId}`);
  },

  async createHousehold(payload: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Household>> {
    return apiRequest<Household>('/households', { method: 'POST', body: payload });
  },

  async updateHousehold(householdId: string, payload: Partial<Household>): Promise<ApiResponse<Household>> {
    return apiRequest<Household>(`/households/${householdId}`, { method: 'PATCH', body: payload });
  },

  async getMembers(householdId: string): Promise<ApiResponse<HouseholdMember[]>> {
    return apiRequest<HouseholdMember[]>(`/households/${householdId}/members`);
  },

  async inviteMember(householdId: string, email: string, role: string): Promise<ApiResponse<HouseholdMember>> {
    return apiRequest<HouseholdMember>(`/households/${householdId}/members/invite`, {
      method: 'POST',
      body: { email, role },
    });
  },

  async updateMemberRole(memberId: string, role: HouseholdMember['role']): Promise<ApiResponse<HouseholdMember>> {
    return apiRequest<HouseholdMember>(`/members/${memberId}/role`, {
      method: 'PATCH',
      body: { role },
    });
  },

  async removeMember(memberId: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/members/${memberId}`, { method: 'DELETE' });
  },
};
