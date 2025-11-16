import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import authService from '@/lib/api/services/loginService';

export function useAuth() {
  const { 
    user, 
    isAuthenticated, 
    isInitialized,
    setAuth, 
    clearAuth, 
    setInitialized 
  } = useAuthStore();

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await authService.me();
        
        if (response.success && response.usuario) {
          setAuth(response.usuario);
        } else {
          clearAuth();
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          clearAuth();
        } else {
          console.error('Error al verificar autenticación:', error);
          clearAuth();
        }
      } finally {
        setInitialized(true);
      }
    };

    checkAuth();
  }, [isInitialized, setAuth, clearAuth, setInitialized]);

  const login = useCallback(async (
    email: string, 
    password: string, 
    rememberMe = false
  ) => {
    try {
      const response = await authService.login({ email, password, rememberMe });
      
      if (response.success && response.usuario) {
        setAuth(response.usuario);
        
        return {
          success: true,
          rol: response.usuario.rol,
          usuario: response.usuario
        };
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return {
    user,
    isAuthenticated,
    isInitialized,
    login,
    logout,
  };
}