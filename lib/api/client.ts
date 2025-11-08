import axios from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    // Las cookies httpOnly se envían automáticamente con withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no hemos intentado refresh todavía
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Si el error es TOKEN_EXPIRED, intentar refresh
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        
        if (isRefreshing) {
          // Si ya estamos refrescando, poner esta request en cola
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Intentar refrescar el token
          await apiClient.post('/login/refresh');
          
          isRefreshing = false;
          processQueue(null);
          
          // Reintentar la request original
          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError, null);
          
          // Si el refresh falla, limpiar auth y redirigir
          useAuthStore.getState().clearAuth();
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // Cualquier otro 401 (token inválido, no autorizado, etc.)
        useAuthStore.getState().clearAuth();
        
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;