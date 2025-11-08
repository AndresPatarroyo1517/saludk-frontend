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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    // ✅ Solo verificar UNA VEZ cuando termine de cargar
    if (isLoading || hasChecked.current) return;

    // Marcar como verificado ANTES de cualquier lógica
    hasChecked.current = true;

    // ❌ Usuario no autenticado
    if (!user) {
      console.log('❌ No autenticado, redirigiendo a /login');
      router.replace('/login');
      return;
    }

    // ❌ Usuario sin permisos para esta ruta
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      console.log(`❌ Rol ${user.rol} no permitido, redirigiendo a ${ROLE_REDIRECTS[user.rol]}`);
      router.replace(ROLE_REDIRECTS[user.rol] || '/dashboard');
      return;
    }

    // ✅ Todo OK
    console.log('✅ Acceso permitido a usuario:', user.email, 'rol:', user.rol);
  }, [user, isLoading, allowedRoles, router]);

  // ✅ Mostrar loader mientras carga o verifica
  if (isLoading || !hasChecked.current) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // ✅ Si no hay usuario o no tiene permisos, no mostrar nada (se redirigió)
  if (!user || (allowedRoles && !allowedRoles.includes(user.rol))) {
    return null;
  }

  // ✅ Mostrar contenido protegido
  return <>{children}</>;
}