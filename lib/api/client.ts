import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://saludk-backend.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

// ✅ SIMPLIFICADO - Sin colas ni complejidad innecesaria
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ✅ No es 401, rechazar directamente
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // ✅ Ya reintentamos, limpiar auth y redirigir
    if (originalRequest._retry) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // ✅ Si el refresh falló, limpiar auth
    if (originalRequest.url?.includes('/login/refresh')) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const errorCode = error.response?.data?.code;
    
    // ✅ Solo intentar refresh si es TOKEN_EXPIRED
    if (errorCode === 'TOKEN_EXPIRED') {
      originalRequest._retry = true;

      // ✅ Si ya estamos refrescando, esperar
      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          return apiClient(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // ✅ Iniciar refresh
      isRefreshing = true;
      refreshPromise = apiClient.post('/login/refresh')
        .then(() => {
          console.log('✅ Token refrescado exitosamente');
        })
        .catch((refreshError) => {
          console.error('❌ Error al refrescar token:', refreshError);
          useAuthStore.getState().clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw refreshError;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });

      try {
        await refreshPromise;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // ✅ Otros errores 401
    useAuthStore.getState().clearAuth();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;