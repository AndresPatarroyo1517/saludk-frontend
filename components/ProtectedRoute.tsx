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
  const redirected = useRef(false); // ✅ Prevenir múltiples redirecciones

  useEffect(() => {
    // Solo actuar cuando inicialización termine Y no hayamos redirigido antes
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

    const normalizedRole = user.rol.toLowerCase() as UserRole;
    // Usuario sin permisos
    if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
      redirected.current = true;
      const targetRoute = ROLE_REDIRECTS[normalizedRole] || '/dashboard';
      console.log(`❌ Rol protected ${user.rol} no permitido, redirigiendo a ${targetRoute}`);
      router.replace(targetRoute);
      return;
    }

    // Todo OK
    console.log('✅ Acceso permitido:', user.email, '| Rol:', user.rol);
  }, [user, isAuthenticated, isInitialized, allowedRoles, router]);

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

  // Si no autenticado o sin permisos, no mostrar nada
  if (!isAuthenticated || !user || (allowedRoles && !allowedRoles.includes(user.rol.toLowerCase() as UserRole))) {
    return null;
  }

  // Mostrar contenido protegido
  return <>{children}</>;
}