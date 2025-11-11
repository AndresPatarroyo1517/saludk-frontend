import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enviar cookies automáticamente
  timeout: 15000, // 15 segundos timeout
});

// Estado del refresh
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// Cola de requests fallidas
interface FailedRequest {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Las cookies httpOnly se envían automáticamente con withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - CORREGIDO
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si no es 401, rechazar directamente
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Si ya reintentamos, no volver a intentar
    if (originalRequest._retry) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Si es el endpoint de refresh el que falló, limpiar auth
    if (originalRequest.url?.includes('/login/refresh')) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Si el error tiene código TOKEN_EXPIRED, intentar refresh
    const errorCode = error.response?.data?.code;
    
    if (errorCode === 'TOKEN_EXPIRED') {
      // Si ya estamos refrescando, esperar a que termine
      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          // Refresh exitoso, reintentar request original
          return apiClient(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Marcar request original como reintentada
      originalRequest._retry = true;
      
      // Iniciar proceso de refresh
      isRefreshing = true;
      
      refreshPromise = apiClient.post('/login/refresh')
        .then(() => {
          processQueue(); // Resolver todos los requests en cola
        })
        .catch((refreshError) => {
          processQueue(refreshError); // Rechazar todos los requests en cola
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
        // Refresh exitoso, reintentar request original
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    } 
    
    // Otros errores 401 (token inválido, permisos, etc.)
    if (errorCode === 'NOT_AUTHENTICATED' || errorCode === 'MISSING_REFRESH_TOKEN') {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;