'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Sparkles, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';
import { planesService } from '@/lib/api/services/planesService';
import pagoService from '@/lib/api/services/pagoService';

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

interface Suscripcion {
  id: string;
  plan_id: string;
  estado: string;
  plan: Plan;
}

export default function PlanesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  // Detectar si está en modo cambio
  const modoCambio = searchParams.get('cambiar') === 'true';
  
  const [loading, setLoading] = useState<string | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suscripcionActual, setSuscripcionActual] = useState<Suscripcion | null>(null);

  // ✅ REDIRECCIÓN AUTOMÁTICA si tiene plan activo Y NO está cambiando
  useEffect(() => {
    if (!modoCambio && user?.plan_activo?.estado === 'ACTIVA') {
      console.log('🔄 Usuario tiene plan activo, redirigiendo a mis-suscripciones...');
      router.push('/dashboard/mis-suscripciones');
    }
  }, [user, router, modoCambio]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingPlanes(true);
        setError(null);

        // Cargar planes
        const response = await planesService.getPlanes();
        setPlanes(response.data);

        // Si está en modo cambio, cargar suscripción actual
        if (modoCambio) {
          try {
            const suscripcionesResponse = await pagoService.obtenerMisSuscripciones();
            const activa = suscripcionesResponse.data.suscripciones.find(
              (s: Suscripcion) => s.estado === 'ACTIVA'
            );
            
            if (!activa) {
              toast.error('No tienes una suscripción activa para cambiar');
              router.push('/dashboard/planes');
              return;
            }
            
            setSuscripcionActual(activa);
          } catch (err) {
            console.error('Error cargando suscripción:', err);
            toast.error('No se pudo cargar tu suscripción actual');
            router.push('/dashboard/planes');
          }
        }

      } catch (err) {
        setError('Error al cargar los planes');
        console.error('Error loading plans:', err);
        toast.error('No se pudieron cargar los planes');
      } finally {
        setLoadingPlanes(false);
      }
    };

    cargarDatos();
  }, [modoCambio, router]);

  const handleSeleccionarPlan = async (planId: string) => {
    // Si está en modo cambio, ir a cambiar-plan
    if (modoCambio && suscripcionActual) {
      router.push(`/dashboard/planes/cambiar?planId=${planId}`);
    } else {
      // Si es primera vez, ir a confirmar-suscripcion
      router.push(`/dashboard/planes/confirmar/${planId}`);
    }
  };

  // ✅ Si está redirigiendo (solo si NO está en modo cambio)
  if (!modoCambio && user?.plan_activo?.estado === 'ACTIVA') {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-slate-600">Redirigiendo a tu suscripción...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

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
          {/* Header */}
          <div>
            {modoCambio && (
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/mis-suscripciones')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a mis suscripciones
              </Button>
            )}
            
            <h1 className="text-3xl font-bold text-slate-800">
              {modoCambio ? 'Cambiar Plan' : 'Planes de Suscripción'}
            </h1>
            <p className="text-slate-600 mt-2">
              {modoCambio 
                ? 'Selecciona el nuevo plan al que deseas cambiar'
                : 'Elige el plan que mejor se adapte a tus necesidades de salud'
              }
            </p>
          </div>

          {/* Alerta si está cambiando de plan */}
          {modoCambio && suscripcionActual && (
            <Alert className="bg-blue-50 border-blue-200">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <AlertDescription className="ml-2 text-blue-800">
                <strong>Cambio de plan:</strong> Actualmente tienes el plan{' '}
                <strong>{suscripcionActual.plan.nombre}</strong> 
                {' '}(${parseFloat(suscripcionActual.plan.precio_mensual).toLocaleString('es-CO')}/mes).
                <br />
                Selecciona tu nuevo plan para continuar.
              </AlertDescription>
            </Alert>
          )}

          {/* Grid de planes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {planes.map((plan, index) => {
              const isPopular = index === 1; // El segundo plan (Completo) es el más popular
              const precio = parseFloat(plan.precio_mensual);
              const esPlanActual = modoCambio && suscripcionActual?.plan_id === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`
                    border-2 transition-all
                    ${esPlanActual 
                      ? 'border-slate-400 opacity-60 relative' 
                      : isPopular
                        ? 'border-blue-500 shadow-xl relative'
                        : ''
                    }
                  `}
                >
                  {esPlanActual && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-slate-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        PLAN ACTUAL
                      </Badge>
                    </div>
                  )}

                  {isPopular && !esPlanActual && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
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
                      {plan.beneficios.map((beneficio, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{beneficio}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSeleccionarPlan(plan.id)}
                      disabled={loading === plan.id || esPlanActual}
                      className="w-full mt-6"
                    >
                      {loading === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : esPlanActual ? (
                        'Plan Actual'
                      ) : modoCambio ? (
                        'Cambiar a este plan'
                      ) : (
                        'Suscribirse Ahora'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section - Solo mostrar si NO está en modo cambio */}
          {!modoCambio && (
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
                    Sí, puedes cambiar tu plan en cualquier momento. El cambio se aplicará inmediatamente después del pago.
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
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}