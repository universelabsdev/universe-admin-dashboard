/// <reference types="vite/client" />
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

// 1. Define the API response structure matching your backend
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  code?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 2. Create the Base Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://universe-server-delta.vercel.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Custom Hook to use the API Client
 * This ensures the Clerk Token is always fresh and injected into every request.
 */
export const useApiClient = () => {
  const { getToken, signOut } = useAuth();

  const client = useMemo(() => {
    // Clear existing interceptors to prevent duplicates on re-renders
    api.interceptors.request.clear();
    api.interceptors.response.clear();

    // Request Interceptor: Attach Clerk JWT
    api.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('[API] Failed to get Clerk token', error);
      }
      return config;
    });

    // Response Interceptor: Global Error Handling
    api.interceptors.response.use(
      (response) => response.data, // Return only the data (matching our ApiResponse type)
      async (error: AxiosError<ApiResponse>) => {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message;

        // Auto-logout if token is expired/invalid (401)
        if (status === 401) {
          const code = error.response?.data?.code;
          if (code === 'REGISTRATION_REQUIRED') {
            if (window.location.pathname !== '/onboarding') {
              window.location.href = '/onboarding';
            }
          } else if (code === 'INVALID_TOKEN' || code === 'AUTH_REQUIRED' || !code) {
            console.warn('[API] Unauthorized - Logging out...');
            await signOut();
            window.location.href = '/login';
          }
        }

        // Return a rejected promise with a clean error object
        return Promise.reject({
          message: errorMessage,
          status: status,
          data: error.response?.data
        });
      }
    );

    return api as unknown as {
      get: <T>(url: string, config?: any) => Promise<ApiResponse<T>>;
      post: <T>(url: string, data?: any, config?: any) => Promise<ApiResponse<T>>;
      patch: <T>(url: string, data?: any, config?: any) => Promise<ApiResponse<T>>;
      put: <T>(url: string, data?: any, config?: any) => Promise<ApiResponse<T>>;
      delete: <T>(url: string, config?: any) => Promise<ApiResponse<T>>;
    };
  }, [getToken, signOut]);

  return client;
};
