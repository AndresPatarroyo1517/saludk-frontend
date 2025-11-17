'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { UserRole, ROLE_REDIRECTS } from '@/lib/auth.config';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isInitialized, isLoading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isInitialized || redirected.current) {
      return;
    }

    console.log('🔒 [ProtectedRoute] Verificando acceso:', {
      isAuthenticated,
      user: user?.email,
      rol: user?.rol,
      allowedRoles
    });

    if (!isAuthenticated || !user) {
      redirected.current = true;
      console.log('❌ [ProtectedRoute] No autenticado, redirigiendo a /login');
      router.replace('/login');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const normalizedRole = user.rol.toLowerCase() as UserRole;
      
      if (!allowedRoles.includes(normalizedRole)) {
        redirected.current = true;
        const targetRoute = ROLE_REDIRECTS[normalizedRole] || '/dashboard';
        console.log(`❌ [ProtectedRoute] Rol ${user.rol} no permitido, redirigiendo a ${targetRoute}`);
        router.replace(targetRoute);
        return;
      }
    }

    console.log('✅ [ProtectedRoute] Acceso permitido:', user.email, '| Rol:', user.rol);
  }, [isInitialized, isAuthenticated, user, allowedRoles, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedRole = user.rol.toLowerCase() as UserRole;
    if (!allowedRoles.includes(normalizedRole)) {
      return null;
    }
  }

  return <>{children}</>;
}