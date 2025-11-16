'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  Shield, 
  Calendar,
  AlertCircle,
  Copy,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import MetodoPagoSelector from '@/components/checkout/MetodoPagoSelector';
import StripeCheckout from '@/components/checkout/StripeCheckout';
import pagoService from '@/lib/api/services/pagoService';
import { useAuthStore } from '@/lib/store/authStore';

// Datos de planes (deberías obtenerlos de tu API)
const planesData: Record<string, any> = {
  'basico': {
    id: 'basico',
    nombre: 'Plan Básico',
    precio: 29.99,
    descripcion: 'Ideal para cuidado médico esencial',
    beneficios: [
      '2 consultas médicas al mes',
      'Historial médico digital',
      'Descuentos en farmacia (10%)',
    ],
  },
  'completo': {
    id: 'completo',
    nombre: 'Plan Completo',
    precio: 49.99,
    descripcion: 'Cobertura completa de salud',
    beneficios: [
      'Consultas médicas ilimitadas',
      'Especialistas certificados',
      'Descuentos especiales en farmacia (20%)',
      'Telemedicina incluida',
    ],
  },
};

type MetodoPago = 'TARJETA' | 'PSE' | 'CONSIGNACION';
type Step = 'seleccion' | 'pago';

export default function ConfirmarSuscripcionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const planId = params.planId as string;
  
  const [plan, setPlan] = useState<any>(null);
  const [step, setStep] = useState<Step>('seleccion');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA');
  const [loading, setLoading] = useState(false);
  const [ordenData, setOrdenData] = useState<any>(null);

  useEffect(() => {
    const planEncontrado = planesData[planId];
    if (!planEncontrado) {
      toast.error('Plan no encontrado');
      router.push('/planes');
      return;
    }
    setPlan(planEncontrado);
  }, [planId, router]);

  const handleCrearOrden = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    try {
      const response = await pagoService.crearSuscripcion({
        planId,
        metodoPago,
      });

      setOrdenData(response.data);
      setStep('pago');

      toast.success('Orden creada exitosamente', {
        description: 'Procede con el pago',
      });
    } catch (error: any) {
      console.error('Error creando orden:', error);
      toast.error('Error al crear la orden', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagoExitoso = () => {
    toast.success('¡Pago completado!', {
      description: 'Tu suscripción ha sido activada',
      icon: <CheckCircle className="w-5 h-5" />,
    });
    
    // Redirigir después de 2 segundos
    setTimeout(() => {
      router.push('/dashboard/mis-suscripciones');
    }, 2000);
  };

  const handlePagoError = (error: string) => {
    toast.error('Error en el pago', {
      description: error,
    });
  };

  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado al portapapeles`);
  };

  if (!plan) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Button
              variant="ghost"
              onClick={() => step === 'pago' ? setStep('seleccion') : router.push('/planes')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">
              {step === 'seleccion' ? 'Confirmar Suscripción' : 'Completar Pago'}
            </h1>
            <p className="text-slate-600 mt-2">
              {step === 'seleccion' 
                ? 'Revisa los detalles y selecciona tu método de pago'
                : 'Procede con el pago de tu suscripción'
              }
            </p>
          </div>

          {/* Contenido según el step */}
          {step === 'seleccion' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda: Método de pago */}
              <div className="lg:col-span-2">
                <MetodoPagoSelector
                  metodoPago={metodoPago}
                  onSelect={setMetodoPago}
                  disabled={loading}
                />
              </div>

              {/* Columna derecha: Resumen */}
              <div className="space-y-6">
                <Card className="border-blue-100 shadow-lg sticky top-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Plan seleccionado */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-600">Plan seleccionado</p>
                      <p className="text-lg font-bold text-slate-800">{plan.nombre}</p>
                      <p className="text-sm text-slate-600">{plan.descripcion}</p>
                    </div>

                    {/* Beneficios */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-600">Beneficios incluidos</p>
                      <ul className="space-y-1.5">
                        {plan.beneficios.map((beneficio: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            {beneficio}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Precio */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600">Precio mensual</span>
                        <span className="text-2xl font-bold text-slate-800">
                          ${plan.precio}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>Renovación automática mensual</span>
                      </div>
                    </div>

                    {/* Botón de continuar */}
                    <Button
                      onClick={handleCrearOrden}
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Continuar al pago'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            // Step 2: Pago
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Stripe Checkout */}
              {metodoPago === 'TARJETA' && ordenData?.stripe && (
                <StripeCheckout
                  clientSecret={ordenData.stripe.client_secret}
                  monto={ordenData.stripe.amount_usd}
                  montoCOP={ordenData.stripe.amount_cop}
                  onSuccess={handlePagoExitoso}
                  onError={handlePagoError}
                  descripcion={`Suscripción ${plan.nombre}`}
                />
              )}

              {/* PSE */}
              {metodoPago === 'PSE' && ordenData?.pse && (
                <Card className="border-teal-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-teal-600" />
                      Pago PSE en Proceso
                    </CardTitle>
                    <CardDescription>{ordenData.pse.mensaje}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Tu orden ha sido creada. En una implementación real, serías redirigido
                        al portal PSE para completar el pago.
                      </AlertDescription>
                    </Alert>

                    <div className="p-4 bg-teal-50 rounded-lg">
                      <p className="text-sm font-semibold text-teal-900 mb-2">
                        Referencia de pago:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-lg font-mono text-teal-700">
                          {ordenData.pse.referencia}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copiarTexto(ordenData.pse.referencia, 'Referencia')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={() => router.push('/dashboard/mis-suscripciones')}
                      className="w-full"
                    >
                      Ver mis suscripciones
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Consignación */}
              {metodoPago === 'CONSIGNACION' && ordenData?.consignacion && (
                <Card className="border-slate-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-slate-700" />
                      Instrucciones de Consignación
                    </CardTitle>
                    <CardDescription>
                      Realiza la consignación con los siguientes datos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {ordenData.consignacion.nota}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      {/* Banco */}
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 mb-1">Banco:</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-slate-800">
                            {ordenData.consignacion.banco}
                          </p>
                        </div>
                      </div>

                      {/* Número de cuenta */}
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 mb-1">
                          Número de cuenta:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-lg font-mono text-slate-800">
                            {ordenData.consignacion.numeroCuenta}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => 
                              copiarTexto(ordenData.consignacion.numeroCuenta, 'Número de cuenta')
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Monto */}
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 mb-1">Monto a consignar:</p>
                        <p className="text-2xl font-bold text-slate-800">
                          ${ordenData.consignacion.monto.toLocaleString('es-CO')} COP
                        </p>
                      </div>

                      {/* Código de referencia */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Código de referencia:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-lg font-mono text-blue-700">
                            {ordenData.consignacion.codigoReferencia}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => 
                              copiarTexto(ordenData.consignacion.codigoReferencia, 'Código de referencia')
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          * Incluye este código en tu consignación
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => router.push('/dashboard/mis-suscripciones')}
                      className="w-full"
                    >
                      Entendido
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}