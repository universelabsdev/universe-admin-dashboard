import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://universe-server-delta.vercel.app/api/v1',
  timeout: 10000,
});

// Request Interceptor to attach Clerk Token
api.interceptors.request.use(async (config) => {
  // @ts-ignore
  if (window.Clerk && window.Clerk.session) {
    // @ts-ignore
    const token = await window.Clerk.session.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global Error Handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      if (code === 'REGISTRATION_REQUIRED') {
        if (window.location.pathname !== '/onboarding') {
          window.location.href = '/onboarding';
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
