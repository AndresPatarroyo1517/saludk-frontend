'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';

const planes = [
  {
    id: 'basico',
    nombre: 'Plan Básico',
    precio: 29.99,
    descripcion: 'Ideal para cuidado médico esencial',
    beneficios: [
      '2 consultas médicas al mes',
      'Historial médico digital',
      'Descuentos en farmacia (10%)',
      'Acceso a la plataforma 24/7',
      'Soporte por email',
    ],
  },
  {
    id: 'completo',
    nombre: 'Plan Completo',
    precio: 49.99,
    descripcion: 'Cobertura completa de salud',
    beneficios: [
      'Consultas médicas ilimitadas',
      'Especialistas certificados',
      'Historial médico completo',
      'Descuentos especiales en farmacia (20%)',
      'Atención prioritaria 24/7',
      'Telemedicina incluida',
      'Exámenes con descuento',
    ],
    destacado: true,
  },
];

export default function PlanesPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSuscribirse = async (planId: string) => {
    if (user?.estado !== 'aprobado') {
      toast.error('Tu cuenta debe estar aprobada para suscribirte a un plan');
      return;
    }

    setLoading(planId);
    try {
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'plan',
          planId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear sesión de pago');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success('Suscripción procesada exitosamente');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setLoading(null);
    }
  };

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

          {user?.plan && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Plan Actual</CardTitle>
                <CardDescription className="text-blue-700">
                  Actualmente estás suscrito al <span className="font-semibold capitalize">{user.plan}</span>.
                  Puedes cambiar tu plan en cualquier momento.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {planes.map((plan) => (
              <Card
                key={plan.id}
                className={
                  plan.destacado
                    ? 'border-2 border-blue-500 shadow-xl relative'
                    : 'border-2'
                }
              >
                {plan.destacado && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Más Popular
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600 my-4">
                    ${plan.precio}
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
                    disabled={loading === plan.id || user?.plan === plan.id}
                    className="w-full mt-6"
                    variant={user?.plan === plan.id ? 'outline' : 'default'}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : user?.plan === plan.id ? (
                      'Plan Actual'
                    ) : (
                      'Suscribirse Ahora'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                  Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
