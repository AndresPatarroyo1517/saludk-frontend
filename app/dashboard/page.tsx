'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, ShoppingBag, FileText, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    proximasCitas: 0,
    historialItems: 0,
    ordenesRecientes: 0,
  });


  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Bienvenido, {user?.datos_personales?.nombres || 'Usuario'}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona tu salud desde un solo lugar
            </p>
          </div>

          {user?.estado === 'pendiente' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <CardTitle className="text-yellow-800">Registro en Revisión</CardTitle>
                    <CardDescription className="text-yellow-700">
                      Tu solicitud de registro está siendo revisada por nuestro equipo médico.
                      Te notificaremos por email cuando sea aprobada.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {user?.estado === 'aprobado' && !user?.plan && (
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
                  {user?.plan || 'Ninguno'}
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
                  {user?.plan ? 'Gestiona tu plan actual o cámbialo' : 'Suscríbete a un plan para acceder a todos los servicios'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/planes">
                  <Button className="w-full" variant="outline">
                    {user?.plan ? 'Gestionar Plan' : 'Ver Planes'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {user?.estado === 'aprobado' && user?.plan && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <CardTitle className="text-green-800">Cuenta Activa</CardTitle>
                    <CardDescription className="text-green-700">
                      Tu cuenta está completamente configurada. Ahora puedes acceder a todos nuestros servicios.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}