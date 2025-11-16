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
import { planesService } from '@/lib/api/services/planesService';
import { useAuthStore } from '@/lib/store/authStore';

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

// ✅ CORREGIDO: Usar 'PASARELA' en lugar de 'PSE'
type MetodoPago = 'TARJETA' | 'PASARELA' | 'CONSIGNACION';

export default function ConfirmarSuscripcionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const planId = params.planId as string;
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA');
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [pagoData, setPagoData] = useState<any>(null);
  const [suscripcionId, setSuscripcionId] = useState<string | null>(null);

  useEffect(() => {
    const cargarPlan = async () => {
      try {
        setLoadingPlan(true);
        const response = await planesService.getPlanes();
        const planEncontrado = response.data.find((p: Plan) => p.id === planId);
        
        if (!planEncontrado) {
          toast.error('Plan no encontrado');
          router.push('/dashboard/planes');
          return;
        }
        
        setPlan(planEncontrado);
      } catch (error) {
        console.error('Error cargando plan:', error);
        toast.error('Error al cargar el plan');
        router.push('/dashboard/planes');
      } finally {
        setLoadingPlan(false);
      }
    };

    cargarPlan();
  }, [planId, router]);

  const procesarPagoCompleto = async () => {
    if (!user || !plan) {
      toast.error('Datos incompletos');
      return;
    }

    console.log('🟢 [PAGO] Iniciando proceso completo de pago...');
    console.log('🟢 [PAGO] Plan ID:', plan.id);
    console.log('🟢 [PAGO] Método de pago:', metodoPago);

    setLoading(true);

    try {
      // PASO 1: Crear suscripción
      console.log('🟢 [PAGO] Paso 1: Creando suscripción...');
      const suscripcionResponse = await pagoService.crearSuscripcion({
        planId: plan.id,
        metodoPago: metodoPago === 'PASARELA' ? 'PSE' : metodoPago,
      });

      console.log('🟢 [PAGO] Suscripción creada:', suscripcionResponse);

      if (!suscripcionResponse.data?.suscripcion?.id) {
        throw new Error('No se pudo crear la suscripción');
      }

      const nuevaSuscripcionId = suscripcionResponse.data.suscripcion.id;
      setSuscripcionId(nuevaSuscripcionId);

      // ✅ CORREGIDO: Usar directamente los datos de la respuesta de crearSuscripcion
      // El backend ya devuelve stripe, pse, o consignacion según el método
      console.log('🟢 [PAGO] Datos de pago en respuesta:', {
        stripe: suscripcionResponse.data.stripe,
        pse: suscripcionResponse.data.pse,
        consignacion: suscripcionResponse.data.consignacion
      });

      setPagoData(suscripcionResponse.data);

      // Verificar que tenemos los datos necesarios según el método
      if (metodoPago === 'TARJETA' && !suscripcionResponse.data.stripe?.client_secret) {
        console.error('🔴 [ERROR] No hay clientSecret para Stripe');
        throw new Error('No se pudo inicializar el pago con tarjeta');
      }

      if (metodoPago === 'PASARELA' && !suscripcionResponse.data.pse?.referencia) {
        console.error('🔴 [ERROR] No hay referencia para PSE');
        throw new Error('No se pudo generar la referencia PSE');
      }

      if (metodoPago === 'CONSIGNACION' && !suscripcionResponse.data.consignacion) {
        console.error('🔴 [ERROR] No hay datos de consignación');
        throw new Error('No se pudieron generar las instrucciones de consignación');
      }

      toast.success('Proceso completado', {
        description: 'Ahora puedes proceder con el pago',
      });

    } catch (error: any) {
      console.error('🔴 [ERROR] Error en el proceso:', error);
      toast.error('Error en el proceso de pago', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagoExitoso = () => {
    toast.success('¡Pago completado!', {
      description: 'Tu suscripción ha sido activada',
    });
    
    setTimeout(() => {
      router.push('/dashboard/mis-suscripciones');
    }, 2000);
  };

  const handlePagoError = (error: string) => {
    toast.error('Error en el pago', { description: error });
  };

  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado`);
  };

  if (loadingPlan) {
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

  if (!plan) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-slate-600">Plan no encontrado</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const precio = parseFloat(plan.precio_mensual);
  const mostrarFormularioPago = pagoData && suscripcionId;

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/planes')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a planes
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">
              {mostrarFormularioPago ? 'Completar Pago' : 'Confirmar Suscripción'}
            </h1>
            <p className="text-slate-600 mt-2">
              {mostrarFormularioPago 
                ? 'Procede con el pago de tu suscripción'
                : 'Revisa los detalles y selecciona tu método de pago'
              }
            </p>
          </div>

          {!mostrarFormularioPago ? (
            // PASO 1: Selección de método de pago
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MetodoPagoSelector
                  metodoPago={metodoPago}
                  onSelect={setMetodoPago}
                  disabled={loading}
                />
              </div>

              <div className="space-y-6">
                <Card className="border-blue-100 shadow-lg sticky top-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-600">Plan seleccionado</p>
                      <p className="text-lg font-bold text-slate-800">{plan.nombre}</p>
                      <p className="text-sm text-slate-600">{plan.descripcion}</p>
                    </div>

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

                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600">Precio mensual</span>
                        <span className="text-2xl font-bold text-slate-800">
                          ${precio.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>Renovación automática mensual</span>
                      </div>
                    </div>

                    <Button
                      onClick={procesarPagoCompleto}
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
            // PASO 2: Formulario de pago
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Stripe Checkout - CORREGIDO: usar clientSecret (no client_secret) */}
              {metodoPago === 'TARJETA' && pagoData?.stripe && (
                <StripeCheckout
                  clientSecret={pagoData.stripe.clientSecret} // ✅ clientSecret, no client_secret
                  monto={pagoData.stripe.amount_usd || precio / 4000} // Conversión aproximada si no viene
                  montoCOP={precio}
                  onSuccess={handlePagoExitoso}
                  onError={handlePagoError}
                  descripcion={`Suscripción ${plan.nombre}`}
                />
              )}

              {/* PASARELA (PSE) - CORREGIDO: usar pse en lugar de pse */}
              {metodoPago === 'PASARELA' && pagoData?.pse && (
                <Card className="border-teal-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-teal-600" />
                      Pago PSE en Proceso
                    </CardTitle>
                    <CardDescription>
                      {pagoData.pse.mensaje || 'Procede con el pago PSE usando la referencia proporcionada'}
                    </CardDescription>
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
                          {pagoData.pse.referencia}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copiarTexto(pagoData.pse.referencia, 'Referencia')}
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
              {metodoPago === 'CONSIGNACION' && pagoData?.consignacion && (
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
                        {pagoData.consignacion.nota || 'Una vez realizada la consignación, tu suscripción se activará.'}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      {/* Banco */}
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 mb-1">Banco:</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-slate-800">
                            {pagoData.consignacion.banco}
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
                            {pagoData.consignacion.numeroCuenta}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => 
                              copiarTexto(pagoData.consignacion.numeroCuenta, 'Número de cuenta')
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
                          ${pagoData.consignacion.monto?.toLocaleString('es-CO') || precio.toLocaleString('es-CO')} COP
                        </p>
                      </div>

                      {/* Código de referencia */}
                      {pagoData.consignacion.codigoReferencia && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            Código de referencia:
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-lg font-mono text-blue-700">
                              {pagoData.consignacion.codigoReferencia}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => 
                                copiarTexto(pagoData.consignacion.codigoReferencia, 'Código de referencia')
                              }
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-blue-700 mt-2">
                            * Incluye este código en tu consignación
                          </p>
                        </div>
                      )}
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