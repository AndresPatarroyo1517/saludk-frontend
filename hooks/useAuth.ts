import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import authService from '@/lib/api/services/loginService';

// ✅ Variables globales para control estricto (fuera de React)
let authCheckStarted = false;
let authCheckCompleted = false;

export function useAuth() {
  const { 
    user, 
    isAuthenticated, 
    isInitialized,
    setAuth, 
    clearAuth, 
    setInitialized 
  } = useAuthStore();

  // ✅ Verificación inicial (SOLO UNA VEZ EN TODA LA APP)
  useEffect(() => {
    // Si ya completamos o ya empezamos, salir inmediatamente
    if (authCheckCompleted || authCheckStarted) {
      return;
    }

    // Marcar que empezamos ANTES de hacer nada async
    authCheckStarted = true;

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
        authCheckCompleted = true;
      }
    };

    checkAuth();
  }, []); // ✅ Array vacío - nunca re-ejecutar

  // ✅ Login
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

  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearAuth();
      // Resetear para permitir nuevo login
      authCheckStarted = false;
      authCheckCompleted = false;
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