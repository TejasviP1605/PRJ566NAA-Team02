import { apiRequest } from './client';
import { useAuthStore } from '@/store/auth.store';
import type { User, LoginCredentials, RegisterData, ApiResponse } from '@/types';

const AUTH_KEY = 'rentright_user';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuth: true,
    });
    localStorage.setItem(AUTH_KEY, JSON.stringify(response.data));
    return response;
  },

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: data,
      skipAuth: true,
    });
    localStorage.setItem(AUTH_KEY, JSON.stringify(response.data));
    return response;
  },

  async logout(): Promise<void> {
    await apiRequest<null>('/auth/logout', { method: 'POST' }).catch(() => undefined);
    localStorage.removeItem(AUTH_KEY);
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    return apiRequest<null>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      skipAuth: true,
    });
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<null>> {
    return apiRequest<null>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      skipAuth: true,
    });
  },

  getCurrentUser(): { user: User; token: string } | null {
    const state = useAuthStore.getState();
    if (state.user && state.token) return { user: state.user, token: state.token };

    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
};
