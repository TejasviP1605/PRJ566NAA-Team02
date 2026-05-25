import { useAuthStore } from '@/store/auth.store';
import type { ApiResponse, User } from '@/types';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockFetch<T>(data: T, delay = 400, shouldFail = false): Promise<T> {
  await mockDelay(delay);
  if (shouldFail) {
    throw new ApiError('Something went wrong. Please try again.', 500);
  }
  return data;
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

function authHeader(skipAuth?: boolean): Record<string, string> {
  if (skipAuth || typeof window === 'undefined') return {};
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response.json().catch(() => null)) as
    | (ApiResponse<T> & { error?: string })
    | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.error ?? payload?.message ?? 'Request failed.', response.status);
  }

  return payload;
}

async function refreshAccessToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  const payload = await parseResponse<{ user: User; token: string }>(response);
  const { user, token } = payload.data;
  useAuthStore.getState().setAuth(user, token);
  return token;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  retryOnUnauthorized = true
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  Object.entries(authHeader(options.skipAuth)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
    ...options,
    credentials: 'include',
    headers,
    body:
      options.body == null || options.body instanceof FormData
        ? (options.body as BodyInit | null | undefined)
        : JSON.stringify(options.body),
  });

  if (response.status === 401 && retryOnUnauthorized && !options.skipAuth) {
    try {
      await refreshAccessToken();
      return apiRequest<T>(path, options, false);
    } catch {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
  }

  return parseResponse<T>(response);
}
