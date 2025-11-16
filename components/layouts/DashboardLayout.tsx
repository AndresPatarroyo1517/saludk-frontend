'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Home,
  Calendar,
  ShoppingBag,
  FileText,
  Star,
  CreditCard,
  Stethoscope,
  LogOut,
  User,
  ClipboardList,
  BarChart3,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import loginService from "@/lib/api/services/loginService";
import { UserRole } from '@/lib/auth.config';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavLink {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const hideHeaderTitle = pathname?.startsWith('/dashboard/citas');

  // ✅ ELIMINADO - useAuth() ya maneja la verificación inicial
  // No necesitamos verificar user aquí, ProtectedRoute ya lo hace

  const handleLogout = async () => {
    try {
      await loginService.logout();
    } catch (e) {
      console.error('Error en logout:', e);
    }

    clearAuth();
    router.replace('/login');
  };

  // ✅ Si no hay user, ProtectedRoute redirigirá, así que esto nunca se ejecutará
  if (!user) {
    return null;
  }

  const pacienteLinks: NavLink[] = [
    { href: '/dashboard', icon: Home, label: 'Inicio' },
    { href: '/dashboard/planes', icon: CreditCard, label: 'Planes' },
    { href: '/dashboard/medicos', icon: Stethoscope, label: 'Médicos' },
    { href: '/dashboard/citas', icon: Calendar, label: 'Mis Citas' },
    { href: '/dashboard/farmacia', icon: ShoppingBag, label: 'Farmacia' },
    { href: '/dashboard/historial', icon: FileText, label: 'Historial' },
    { href: '/dashboard/calificaciones', icon: Star, label: 'Calificaciones' },
  ];

  const directorLinks: NavLink[] = [
    { href: '/director', icon: Home, label: 'Inicio' },
    { href: '/director/solicitudes', icon: ClipboardList, label: 'Solicitudes' },
    { href: '/director/panel', icon: BarChart3, label: 'Reportes' },
  ];

  const medicoLinks: NavLink[] = [
    { href: '/medico', icon: Home, label: 'Inicio' },
    { href: '/medico/perfil', icon: User, label: 'Mi Perfil' },
    { href: '/medico/citas', icon: CalendarClock, label: 'Citas Medicas' },
  ];

  let links: NavLink[] = [];
  if (user?.rol) {
    const normalizedRole = user.rol.toLowerCase() as UserRole;
    switch (normalizedRole) {
      case 'director_medico':
        links = directorLinks;
        break;
      case 'medico':
        links = medicoLinks;
        break;
      case 'paciente':
        links = pacienteLinks;
        break;
      default:
        links = [];
        break;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">SaludK</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {user?.datos_personales?.nombres} {user?.datos_personales?.apellidos}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:ml-0 ml-4">
              {!hideHeaderTitle && (
                <h1 className="text-xl font-semibold text-slate-800">
                  {links.find((link) => link.href === pathname)?.label || 'Dashboard'}
                </h1>
              )}
            </div>

            {user?.plan && user.rol === 'paciente' && (
              <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-700 capitalize">
                  Plan {user.plan}
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}