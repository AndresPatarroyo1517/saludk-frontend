'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';
import { planesService } from '@/lib/api/services/planesService';

interface Plan {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  precio_mensual: string;
  duracion_meses: string;
  beneficios: string[];
  consultas_virtuales_incluidas: string;
  consultas_presenciales_incluidas: string;
}

export default function PlanesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        setLoadingPlanes(true);
        setError(null);
        const response = await planesService.getPlanes();
        setPlanes(response.data);
      } catch (err) {
        setError('Error al cargar los planes');
        console.error('Error loading plans:', err);
        toast.error('No se pudieron cargar los planes');
      } finally {
        setLoadingPlanes(false);
      }
    };

    cargarPlanes();
  }, []);

  const handleSuscribirse = async (planId: string) => {
    router.push(`/dashboard/planes/confirmar/${planId}`);
  };

  // Función para mapear el código del plan con el plan del usuario
  const getCurrentPlanCode = () => {
    if (!user?.plan) return null;
    
    // Mapeo de códigos de plan - ajusta según tu estructura real
    const planMap: { [key: string]: string } = {
      'basico': 'PLAN_BASIC',
      'completo': 'PLAN_FULL',
      'PLAN_BASIC': 'PLAN_BASIC',
      'PLAN_FULL': 'PLAN_FULL'
    };
    
    return planMap[user.plan] || null;
  };

  const currentPlanCode = getCurrentPlanCode();

  if (loadingPlanes) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-slate-600">Cargando planes...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-64">
            <div className="flex flex-col items-center gap-4 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <p>{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Planes de Suscripción</h1>
            <p className="text-slate-600 mt-2">
              Elige el plan que mejor se adapte a tus necesidades de salud
            </p>
          </div>

          {currentPlanCode && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Plan Actual</CardTitle>
                <CardDescription className="text-blue-700">
                  Actualmente estás suscrito al{' '}
                  <span className="font-semibold">
                    {planes.find(p => p.codigo === currentPlanCode)?.nombre || user.plan}
                  </span>.
                  Puedes cambiar tu plan en cualquier momento.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {planes.map((plan, index) => {
              const isCurrentPlan = plan.codigo === currentPlanCode;
              const isPopular = index === 1; // El segundo plan (Completo) es el más popular
              const precio = parseFloat(plan.precio_mensual);

              return (
                <Card
                  key={plan.id}
                  className={
                    isPopular
                      ? 'border-2 border-blue-500 shadow-xl relative'
                      : 'border-2'
                  }
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        Más Popular
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
                    <div className="text-4xl font-bold text-blue-600 my-4">
                      ${precio.toLocaleString('es-CO')}
                      <span className="text-lg text-slate-600 font-normal">/mes</span>
                    </div>
                    <CardDescription>{plan.descripcion}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.beneficios.map((beneficio, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{beneficio}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSuscribirse(plan.id)}
                      disabled={loading === plan.id || isCurrentPlan}
                      className="w-full mt-6"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                    >
                      {loading === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : isCurrentPlan ? (
                        'Plan Actual'
                      ) : (
                        'Suscribirse Ahora'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">
                  ¿Puedo cancelar mi suscripción en cualquier momento?
                </h4>
                <p className="text-slate-600 text-sm">
                  Sí, puedes cancelar tu suscripción cuando quieras. No hay penalizaciones ni cargos adicionales.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">
                  ¿Puedo cambiar de plan?
                </h4>
                <p className="text-slate-600 text-sm">
                  Sí, puedes cambiar tu plan en cualquier momento. El cambio se aplicará en tu próximo ciclo de facturación.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">
                  ¿Qué métodos de pago aceptan?
                </h4>
                <p className="text-slate-600 text-sm">
                  Aceptamos tarjetas de crédito/débito (Stripe), PSE y consignación bancaria.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}