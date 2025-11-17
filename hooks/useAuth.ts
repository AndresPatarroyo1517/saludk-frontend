import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import authService from '@/lib/api/services/loginService';

export function useAuth() {
  const { 
    user, 
    isAuthenticated, 
    isInitialized,
    setAuth, 
    clearAuth, 
    fetchUserData,
    isLoading
  } = useAuthStore();

  // ✅ Usar ref para evitar llamadas duplicadas
  const isChecking = useRef(false);

  useEffect(() => {
    // ✅ No verificar si ya inicializó o está verificando
    if (isInitialized || isChecking.current) {
      return;
    }

    const checkAuth = async () => {
      isChecking.current = true;
      console.log('🔄 [useAuth] Iniciando verificación de sesión...');
      
      try {
        await fetchUserData();
      } catch (error) {
        console.error('❌ [useAuth] Error al verificar autenticación:', error);
        // ✅ Si falla, marcar como inicializado de todas formas
        useAuthStore.getState().setInitialized(true);
      } finally {
        isChecking.current = false;
      }
    };

    checkAuth();
  }, [isInitialized, fetchUserData]); // ✅ Solo depender de isInitialized

  const login = useCallback(async (
    email: string, 
    password: string, 
    rememberMe = false
  ) => {
    try {
      console.log('🔑 [useAuth] Intentando login...');
      const response = await authService.login({ email, password, rememberMe });
      
      if (response.success && response.usuario) {
        console.log('✅ [useAuth] Login exitoso:', response.usuario.email);
        setAuth(response.usuario);
        
        return {
          success: true,
          rol: response.usuario.rol,
          usuario: response.usuario
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [useAuth] Error en login:', error);
      throw error;
    }
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 [useAuth] Cerrando sesión...');
      await authService.logout();
      console.log('✅ [useAuth] Logout exitoso');
    } catch (error) {
      console.error('❌ [useAuth] Error en logout:', error);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    login,
    logout,
  };
}