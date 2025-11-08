import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import authService from '@/lib/api/services/loginService';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const router = useRouter();
  const hasCheckedAuth = useRef(false); // ✅ Evita múltiples llamadas

  // ✅ checkAuth sin useCallback (se ejecuta solo una vez)
  useEffect(() => {
    // Si ya se verificó la autenticación, no hacer nada
    if (hasCheckedAuth.current) return;
    
    const checkAuth = async () => {
      try {
        setLoading(true);
        const response = await authService.me();
        
        if (response.success && response.usuario) {
          setAuth(response.usuario);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        clearAuth();
      } finally {
        setLoading(false);
        hasCheckedAuth.current = true; // ✅ Marcar como verificado
      }
    };

    checkAuth();
  }, []); // ✅ Array vacío - se ejecuta solo una vez

  // ✅ Login sin redirección automática
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await authService.login({ email, password, rememberMe });
      
      if (response.success && response.usuario) {
        setAuth(response.usuario);
        
        // ✅ Retornar el rol para que el componente redirija
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

  // ✅ Logout sin redirección automática
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearAuth();
      hasCheckedAuth.current = false; // ✅ Reset para próximo login
    }
  }, [clearAuth]);

  // ✅ Función manual para forzar re-verificación
  const recheckAuth = useCallback(async () => {
    hasCheckedAuth.current = false;
    try {
      setLoading(true);
      const response = await authService.me();
      
      if (response.success && response.usuario) {
        setAuth(response.usuario);
      } else {
        clearAuth();
      }
    } catch (error) {
      clearAuth();
    } finally {
      setLoading(false);
      hasCheckedAuth.current = true;
    }
  }, [setAuth, clearAuth, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    recheckAuth
  };
}