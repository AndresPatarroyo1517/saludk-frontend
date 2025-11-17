'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { 
  Calendar, 
  ShoppingBag, 
  FileText, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';

interface DashboardStats {
  proximasCitas: number;
  historialItems: number;
  ordenesRecientes: number;
  tienePlanActivo: boolean;
  planNombre: string | null;
  consultasVirtualesDisponibles: number;
  consultasPresencialesDisponibles: number;
}

export default function DashboardPage() {
  const { user, fetchUserData, isLoading, error } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    proximasCitas: 0,
    historialItems: 0,
    ordenesRecientes: 0,
    tienePlanActivo: false,
    planNombre: null,
    consultasVirtualesDisponibles: 0,
    consultasPresencialesDisponibles: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Solo hacer fetch si no hay usuario cargado
        if (!user) {
          await fetchUserData();
        }
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      }
    };

    loadDashboardData();
  }, []); // Solo ejecutar una vez al montar

  useEffect(() => {
    // Calcular estadísticas cuando el usuario cambie
    if (user) {
      const proximasCitas = user.proximas_citas?.length || 0;
      
      const historialItems = user.historial_medico
        ? (user.historial_medico.enfermedades_cronicas?.length || 0) +
          (user.historial_medico.cirugias_previas?.length || 0) +
          (user.historial_medico.medicamentos_actuales?.length || 0)
        : 0;
      
      const ordenesRecientes = user.ordenes_pago?.length || 0;
      const tienePlanActivo = !!user.plan_activo;
      const planNombre = user.plan_activo?.plan?.nombre || null;
      
      const consultasVirtualesDisponibles = 
        user.plan_activo?.consultas_virtuales?.disponibles || 0;
      const consultasPresencialesDisponibles = 
        user.plan_activo?.consultas_presenciales?.disponibles || 0;

      setStats({
        proximasCitas,
        historialItems,
        ordenesRecientes,
        tienePlanActivo,
        planNombre,
        consultasVirtualesDisponibles,
        consultasPresencialesDisponibles
      });
    }
  }, [user]);

  // Estado de carga
  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold">Cargando dashboard...</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Estado de error
  if (error) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar el dashboard: {error}
            </AlertDescription>
          </Alert>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Encabezado */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Bienvenido, {user?.datos_personales?.nombres || 'Usuario'}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona tu salud desde un solo lugar
            </p>
          </div>

          {/* Alerta si no tiene plan activo */}
          {!stats.tienePlanActivo && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <CardTitle className="text-blue-800">Suscríbete a un Plan</CardTitle>
                      <CardDescription className="text-blue-700">
                        Para acceder a todos nuestros servicios, suscríbete a uno de nuestros planes.
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/dashboard/planes">
                    <Button>Ver Planes</Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Cards de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
                <Calendar className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.proximasCitas}</div>
                <p className="text-xs text-slate-600 mt-1">
                  Citas programadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Historial Médico</CardTitle>
                <FileText className="w-4 h-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.historialItems}</div>
                <p className="text-xs text-slate-600 mt-1">
                  Registros médicos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Activo</CardTitle>
                <CreditCard className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {stats.planNombre || 'Ninguno'}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Tu suscripción actual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compras</CardTitle>
                <ShoppingBag className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ordenesRecientes}</div>
                <p className="text-xs text-slate-600 mt-1">
                  Órdenes realizadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Información del plan activo */}
          {stats.tienePlanActivo && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <CardTitle className="text-green-800">Plan Activo: {stats.planNombre}</CardTitle>
                    <CardDescription className="text-green-700 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Consultas Virtuales:</span>{' '}
                          {stats.consultasVirtualesDisponibles} disponibles
                        </div>
                        <div>
                          <span className="font-medium">Consultas Presenciales:</span>{' '}
                          {stats.consultasPresencialesDisponibles} disponibles
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Agenda una Cita</CardTitle>
                <CardDescription>
                  Encuentra y reserva citas con médicos especialistas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/medicos">
                  <Button className="w-full">Buscar Médicos</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Farmacia Online</CardTitle>
                <CardDescription>
                  Compra medicamentos y productos de salud con envío a domicilio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/farmacia">
                  <Button className="w-full">Ir a Farmacia</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Historial Médico</CardTitle>
                <CardDescription>
                  Accede a tu historial clínico completo y documentos médicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/historial">
                  <Button className="w-full" variant="outline">Ver Historial</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Planes de Suscripción</CardTitle>
                <CardDescription>
                  {stats.tienePlanActivo 
                    ? 'Gestiona tu plan actual o cámbialo' 
                    : 'Suscríbete a un plan para acceder a todos los servicios'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/planes">
                  <Button className="w-full" variant="outline">
                    {stats.tienePlanActivo ? 'Gestionar Plan' : 'Ver Planes'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}