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
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    // ✅ Solo depender de isInitialized e isAuthenticated
    if (!isInitialized || redirected.current) {
      return;
    }

    // Usuario no autenticado
    if (!isAuthenticated || !user) {
      redirected.current = true;
      console.log('❌ No autenticado, redirigiendo a /login');
      router.replace('/login');
      return;
    }

    // ✅ Verificar roles solo si allowedRoles está definido
    if (allowedRoles && allowedRoles.length > 0) {
      const normalizedRole = user.rol.toLowerCase() as UserRole;
      
      if (!allowedRoles.includes(normalizedRole)) {
        redirected.current = true;
        const targetRoute = ROLE_REDIRECTS[normalizedRole] || '/dashboard';
        console.log(`❌ Rol ${user.rol} no permitido, redirigiendo a ${targetRoute}`);
        router.replace(targetRoute);
        return;
      }
    }

    console.log('✅ Acceso permitido:', user.email, '| Rol:', user.rol);
  }, [isInitialized, isAuthenticated]); 
  // ✅ user, allowedRoles y router son estables, no causan re-renders

  // Mostrar loader mientras inicializa
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no autenticado o sin permisos, no mostrar nada (ya se redirigió)
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