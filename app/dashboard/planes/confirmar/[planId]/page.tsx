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
  FileText,
  PartyPopper
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
}

type MetodoPago = 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';

export default function ConfirmarSuscripcionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const planId = params.planId as string;
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  
  // paso 1 → 2 → 3 → 4 (éxito)
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA_CREDITO');
  const [loading, setLoading] = useState(false);
  
  const [suscripcionData, setSuscripcionData] = useState<any>(null);
  const [pagoData, setPagoData] = useState<any>(null);
  const [ordenId, setOrdenId] = useState<string>('');

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

  const handleCrearSuscripcion = async () => {
    if (!plan) return;

    console.log('🟢 [PASO 1] Creando suscripción para plan:', plan.id);
    setLoading(true);

    try {
      const response = await pagoService.crearSuscripcion({
        planId: plan.id,
        metodoPago
      });

      console.log('✅ [PASO 1] Suscripción creada:', response);

      if (!response.data?.suscripcion?.id) {
        throw new Error('No se pudo crear la suscripción');
      }

      if (response.data?.ordenPago?.id) {
        setOrdenId(response.data.ordenPago.id);
      }

      setSuscripcionData(response.data);
      setPaso(2);
      
      toast.success('Suscripción creada', {
        description: 'Ahora selecciona tu método de pago',
      });

    } catch (error: any) {
      console.error('❌ [PASO 1] Error:', error);
      toast.error('Error al crear suscripción', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarPago = async () => {
    if (!suscripcionData?.suscripcion?.id) {
      toast.error('No hay suscripción creada');
      return;
    }

    console.log('🟢 [PASO 2] Procesando pago con método:', metodoPago);
    setLoading(true);

    try {
      const response = await pagoService.procesarPagoSuscripcion({
        suscripcionId: suscripcionData.suscripcion.id,
        metodoPago
      });

      console.log('✅ [PASO 2] Respuesta completa:', response);
      
      const responseData = response.data.data || response.data;
      
      console.log('📦 [PASO 2] Data extraída:', responseData);

      if (responseData.ordenPago?.id) {
        setOrdenId(responseData.ordenPago.id);
      }

      if (metodoPago === 'TARJETA_CREDITO') {
        if (!responseData.stripe?.clientSecret) {
          console.error('❌ No hay clientSecret en responseData:', responseData);
          throw new Error('No se pudo inicializar el pago con tarjeta');
        }
      }

      if (metodoPago === 'PASARELA') {
        if (!responseData.pse?.referencia) {
          throw new Error('No se pudo generar la referencia PSE');
        }
      }

      if (metodoPago === 'CONSIGNACION') {
        if (!responseData.consignacion) {
          throw new Error('No se pudieron generar las instrucciones');
        }
      }

      setPagoData(responseData);
      setPaso(3);
      
      toast.success('Orden lista', {
        description: 'Completa el pago',
      });

    } catch (error: any) {
      console.error('❌ [PASO 2] Error:', error);
      toast.error('Error al procesar pago', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Simular pago exitoso según método
  const handlePagoExitoso = async () => {
    if (!ordenId) {
      toast.error('No hay orden de pago');
      return;
    }

    console.log('🟢 [PASO 3] Simulando pago exitoso para orden:', ordenId);
    setLoading(true);

    try {
      // Simular según método de pago
      if (metodoPago === 'TARJETA_CREDITO') {
        await pagoService.simularPagoExitoso(ordenId);
        console.log('✅ Pago con tarjeta simulado');
      } else if (metodoPago === 'PASARELA') {
        await pagoService.simularPSE(ordenId);
        console.log('✅ Pago PSE simulado');
      }
      // Para consignación NO simulamos nada (debe ser manual)

      setPaso(4);
      
      toast.success('¡Pago completado!', {
        description: 'Tu suscripción ha sido activada',
      });

    } catch (error: any) {
      console.error('❌ Error al simular pago:', error);
      toast.error('Error al confirmar pago', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header con indicador de pasos */}
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                if (paso === 1) {
                  router.push('/dashboard/planes');
                } else if (paso === 2) {
                  setPaso(1);
                } else if (paso === 3) {
                  setPaso(2);
                }
              }}
              className="mb-4"
              disabled={paso === 4}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            <h1 className="text-3xl font-bold text-slate-800">
              {paso === 1 && 'Confirmar Suscripción'}
              {paso === 2 && 'Seleccionar Método de Pago'}
              {paso === 3 && 'Completar Pago'}
              {paso === 4 && '¡Suscripción Activada!'}
            </h1>
            
            {/* Indicador de pasos */}
            <div className="flex items-center gap-2 mt-4">
              <PasoIndicador numero={1} activo={paso === 1} completado={paso > 1} />
              <div className="h-px flex-1 bg-slate-300" />
              <PasoIndicador numero={2} activo={paso === 2} completado={paso > 2} />
              <div className="h-px flex-1 bg-slate-300" />
              <PasoIndicador numero={3} activo={paso === 3} completado={paso > 3} />
              <div className="h-px flex-1 bg-slate-300" />
              <PasoIndicador numero={4} activo={paso === 4} completado={false} />
            </div>
          </div>

          {/* PASO 1: Confirmar plan y crear suscripción */}
          {paso === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Plan Seleccionado</CardTitle>
                    <CardDescription>
                      Revisa los detalles antes de continuar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{plan.nombre}</h3>
                      <p className="text-slate-600 mt-2">{plan.descripcion}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">Beneficios incluidos:</p>
                      <ul className="space-y-2">
                        {plan.beneficios.map((beneficio: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="border-blue-100 shadow-lg sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-slate-600">Precio mensual</p>
                      <p className="text-3xl font-bold text-blue-600">
                        ${precio.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">COP/mes</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>Renovación automática mensual</span>
                    </div>

                    <Button
                      onClick={handleCrearSuscripcion}
                      disabled={loading}
                      className="w-full h-12"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear Suscripción'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* PASO 2: Seleccionar método de pago */}
          {paso === 2 && suscripcionData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Alert className="bg-green-50 border-green-200 mb-6">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="ml-2 text-green-800">
                    <strong>Suscripción creada exitosamente.</strong><br />
                    ID: {suscripcionData.suscripcion.id}
                  </AlertDescription>
                </Alert>

                <MetodoPagoSelector
                  metodoPago={metodoPago}
                  onSelect={setMetodoPago}
                  disabled={loading}
                />
              </div>

              <div>
                <Card className="border-blue-100 shadow-lg sticky top-6">
                  <CardHeader>
                    <CardTitle>Detalles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600">Plan</p>
                      <p className="font-semibold text-slate-800">
                        {suscripcionData.suscripcion.plan_nombre}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600">Monto</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${suscripcionData.suscripcion.monto.toLocaleString('es-CO')} COP
                      </p>
                    </div>

                    <Button
                      onClick={handleProcesarPago}
                      disabled={loading}
                      className="w-full h-12"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Preparando...
                        </>
                      ) : (
                        'Continuar al Pago'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* PASO 3: Completar pago según método */}
          {paso === 3 && pagoData && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* TARJETA: Stripe Checkout */}
              {metodoPago === 'TARJETA_CREDITO' && pagoData.stripe && (
                <StripeCheckout
                  clientSecret={pagoData.stripe.clientSecret}
                  monto={pagoData.stripe.amount_usd}
                  montoCOP={pagoData.stripe.amount_cop}
                  onSuccess={handlePagoExitoso}
                  onError={handlePagoError}
                  descripcion={`Suscripción ${plan.nombre}`}
                />
              )}

              {/* PASARELA: PSE */}
              {metodoPago === 'PASARELA' && pagoData.pse && (
                <Card className="border-teal-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-teal-600" />
                      Pago PSE
                    </CardTitle>
                    <CardDescription>
                      {pagoData.pse.mensaje}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        En producción, serías redirigido al portal PSE de tu banco.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handlePagoExitoso}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Simular Pago Exitoso'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* CONSIGNACION */}
              {metodoPago === 'CONSIGNACION' && pagoData.consignacion && (
                <Card className="border-slate-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-slate-700" />
                      Datos de Consignación
                    </CardTitle>
                    <CardDescription>
                      Realiza la transferencia con estos datos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <DatoConsignacion
                        label="Banco"
                        valor={pagoData.consignacion.banco}
                      />
                      <DatoConsignacion
                        label="Tipo de cuenta"
                        valor={pagoData.consignacion.tipo_cuenta}
                      />
                      <DatoConsignacion
                        label="Número de cuenta"
                        valor={pagoData.consignacion.numero_cuenta}
                        copiable
                        onCopiar={() => copiarTexto(pagoData.consignacion.numero_cuenta, 'Cuenta')}
                      />
                      <DatoConsignacion
                        label="Titular"
                        valor={pagoData.consignacion.titular}
                      />
                      <DatoConsignacion
                        label="NIT"
                        valor={pagoData.consignacion.nit}
                      />
                      <DatoConsignacion
                        label="Referencia"
                        valor={pagoData.consignacion.referencia}
                        copiable
                        destacado
                        onCopiar={() => copiarTexto(pagoData.consignacion.referencia, 'Referencia')}
                      />
                      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Monto:</p>
                        <p className="text-3xl font-bold text-blue-700">
                          ${pagoData.consignacion.monto.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                    </div>

                    <Alert>
                      <AlertDescription className="text-sm">
                        {pagoData.consignacion.instrucciones}
                      </AlertDescription>
                    </Alert>

                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-800">
                        <strong>Nota:</strong> Las consignaciones deben ser verificadas manualmente.
                        Tu suscripción se activará una vez validemos el pago.
                      </AlertDescription>
                    </Alert>

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

          {/* PASO 4: Pantalla de éxito */}
          {paso === 4 && (
            <div className="max-w-2xl mx-auto">
              <Card className="border-green-100 shadow-2xl">
                <CardContent className="pt-12 pb-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                      <PartyPopper className="w-12 h-12 text-green-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-800">
                      ¡Gracias por tu suscripción!
                    </h2>
                    <p className="text-lg text-slate-600">
                      Tu suscripción al plan <strong>{plan.nombre}</strong> ha sido activada exitosamente.
                    </p>
                  </div>

                  <div className="p-6 bg-green-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Plan:</span>
                      <span className="font-semibold text-slate-800">{plan.nombre}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Monto:</span>
                      <span className="font-semibold text-green-600">
                        ${precio.toLocaleString('es-CO')} COP/mes
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Orden ID:</span>
                      <span className="font-mono text-sm text-slate-600">{ordenId}</span>
                    </div>
                  </div>

                  <Alert className="text-left">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm">
                      Tu suscripción está activa y puedes comenzar a disfrutar de todos los beneficios inmediatamente.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={() => router.push('/dashboard/mis-suscripciones')}
                      className="flex-1"
                    >
                      Ver mis suscripciones
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      variant="outline"
                      className="flex-1"
                    >
                      Ir al inicio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Componentes auxiliares
function PasoIndicador({ numero, activo, completado }: { numero: number; activo: boolean; completado: boolean }) {
  return (
    <div
      className={`
        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
        transition-all duration-300
        ${activo ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-100' : ''}
        ${completado ? 'bg-green-500 text-white' : ''}
        ${!activo && !completado ? 'bg-slate-200 text-slate-500' : ''}
      `}
    >
      {completado ? <CheckCircle className="w-5 h-5" /> : numero}
    </div>
  );
}

function DatoConsignacion({ 
  label, 
  valor, 
  copiable, 
  destacado, 
  onCopiar 
}: { 
  label: string; 
  valor: string; 
  copiable?: boolean; 
  destacado?: boolean; 
  onCopiar?: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg ${destacado ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-slate-50'}`}>
      <p className="text-sm font-semibold text-slate-600 mb-1">{label}:</p>
      <div className="flex items-center gap-2">
        <p className={`flex-1 ${destacado ? 'font-mono text-lg font-bold' : 'font-medium'} text-slate-800`}>
          {valor}
        </p>
        {copiable && onCopiar && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCopiar}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}