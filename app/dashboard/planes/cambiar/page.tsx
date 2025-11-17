'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  PartyPopper,
  ArrowRight,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import MetodoPagoSelector from '@/components/checkout/MetodoPagoSelector';
import StripeCheckout from '@/components/checkout/StripeCheckout';
import pagoService from '@/lib/api/services/pagoService';
import { planesService } from '@/lib/api/services/planesService';

// ✅ CORREGIDO: Añadir beneficios a la interfaz Plan
interface Plan {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  precio_mensual: string;
  duracion_meses: string;
  beneficios: string[]; // ✅ AÑADIDO
}

interface Suscripcion {
  id: string;
  plan_id: string;
  estado: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  plan: Plan;
}

type MetodoPago = 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';

export default function CambiarPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nuevoPlanId = searchParams.get('planId');
  
  const [planActual, setPlanActual] = useState<Plan | null>(null);
  const [nuevoPlan, setNuevoPlan] = useState<Plan | null>(null);
  const [suscripcionActual, setSuscripcionActual] = useState<Suscripcion | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  const [paso, setPaso] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA_CREDITO');
  const [loading, setLoading] = useState(false);
  
  const [cambioData, setCambioData] = useState<any>(null);
  const [pagoData, setPagoData] = useState<any>(null);
  const [ordenId, setOrdenId] = useState<string>('');

  useEffect(() => {
    const cargarDatos = async () => {
      if (!nuevoPlanId) {
        toast.error('No se especificó el plan');
        router.push('/dashboard/planes');
        return;
      }

      try {
        setLoadingData(true);

        // Cargar suscripción actual
        const suscripcionesResponse = await pagoService.obtenerMisSuscripciones();
        const suscripcionActiva = suscripcionesResponse.data.suscripciones.find(
          (s: Suscripcion) => s.estado === 'ACTIVA'
        );

        if (!suscripcionActiva) {
          toast.error('No tienes una suscripción activa');
          router.push('/dashboard/planes');
          return;
        }

        setSuscripcionActual(suscripcionActiva);

        // ✅ CORREGIDO: Cargar el plan actual completo desde la lista de planes
        const planesResponse = await planesService.getPlanes();
        
        // Buscar plan actual en la lista completa de planes
        const planActualCompleto = planesResponse.data.find((p: Plan) => p.id === suscripcionActiva.plan_id);
        const planEncontrado = planesResponse.data.find((p: Plan) => p.id === nuevoPlanId);

        if (!planActualCompleto || !planEncontrado) {
          toast.error('Plan no encontrado');
          router.push('/dashboard/planes');
          return;
        }

        // ✅ CORREGIDO: Validar que no sea el mismo plan
        if (suscripcionActiva.plan_id === nuevoPlanId) {
          toast.error('Ya tienes este plan activo');
          router.push('/dashboard/planes');
          return;
        }

        setPlanActual(planActualCompleto);
        setNuevoPlan(planEncontrado);

      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar la información');
        router.push('/dashboard/planes');
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [nuevoPlanId, router]);

  // ✅ CORREGIDO: Añadir protección contra undefined en beneficios
  const handleConfirmarCambio = () => {
    if (!planActual?.beneficios || !nuevoPlan?.beneficios) {
      toast.error('Información del plan incompleta');
      return;
    }
    setPaso(2);
  };

  const handleCambiarPlan = async () => {
    if (!nuevoPlan) return;

    console.log('🟢 [PASO 2] Cambiando plan a:', nuevoPlan.id);
    setLoading(true);

    try {
      const response = await pagoService.cambiarPlan({
        nuevoPlanId: nuevoPlan.id,
        metodoPago
      });

      console.log('✅ [PASO 2] Plan cambiado:', response);

      if (!response.data?.nuevaSuscripcion?.id) {
        throw new Error('No se pudo cambiar el plan');
      }

      if (response.data?.ordenPago?.id) {
        setOrdenId(response.data.ordenPago.id);
      }

      setCambioData(response.data);
      setPaso(3);
      
      toast.success('Plan cambiado', {
        description: 'Ahora procesa el pago para activar tu nuevo plan',
      });

    } catch (error: any) {
      console.error('❌ [PASO 2] Error:', error);
      toast.error('Error al cambiar plan', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarPago = async () => {
    if (!cambioData?.nuevaSuscripcion?.id) {
      toast.error('No hay suscripción creada');
      return;
    }

    console.log('🟢 [PASO 3] Procesando pago con método:', metodoPago);
    setLoading(true);

    try {
      const response = await pagoService.procesarPagoSuscripcion({
        suscripcionId: cambioData.nuevaSuscripcion.id,
        metodoPago
      });

      console.log('✅ [PASO 3] Respuesta completa:', response);
      
      const responseData = response.data.data || response.data;
      
      console.log('📦 [PASO 3] Data extraída:', responseData);

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
      setPaso(4);
      
      toast.success('Orden lista', {
        description: 'Completa el pago para activar tu nuevo plan',
      });

    } catch (error: any) {
      console.error('❌ [PASO 3] Error:', error);
      toast.error('Error al procesar pago', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagoExitoso = async () => {
    if (!ordenId) {
      toast.error('No hay orden de pago');
      return;
    }

    console.log('🟢 [PASO 4] Simulando pago exitoso para orden:', ordenId);
    setLoading(true);

    try {
      if (metodoPago === 'TARJETA_CREDITO') {
        await pagoService.simularPagoExitoso(ordenId);
        console.log('✅ Pago con tarjeta simulado');
      } else if (metodoPago === 'PASARELA') {
        await pagoService.simularPSE(ordenId);
        console.log('✅ Pago PSE simulado');
      }

      setPaso(5);
      
      toast.success('¡Pago completado!', {
        description: 'Tu nuevo plan ha sido activado',
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

  if (loadingData) {
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

  if (!planActual || !nuevoPlan || !suscripcionActual) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-slate-600">No se pudo cargar la información</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ✅ CORREGIDO: Añadir protección contra undefined
  const precioActual = parseFloat(planActual.precio_mensual);
  const precioNuevo = parseFloat(nuevoPlan.precio_mensual);
  const diferencia = precioNuevo - precioActual;

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
                } else if (paso === 4) {
                  setPaso(3);
                }
              }}
              className="mb-4"
              disabled={paso === 5 || loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            <h1 className="text-3xl font-bold text-slate-800">
              {paso === 1 && 'Cambiar Plan'}
              {paso === 2 && 'Seleccionar Método de Pago'}
              {paso === 3 && 'Procesar Pago'}
              {paso === 4 && 'Completar Pago'}
              {paso === 5 && '¡Plan Actualizado!'}
            </h1>
            
            {/* Indicador de pasos */}
            <div className="flex items-center gap-2 mt-4">
              <PasoIndicador numero={1} activo={paso === 1} completado={paso > 1} />
              <div className="h-px flex-1 bg-slate-300" />
              <PasoIndicador numero={2} activo={paso === 2} completado={paso > 2} />
              <div className="h-px flex-1 bg-slate-300" />
              <PasoIndicador numero={3} activo={paso === 3} completado={paso > 3} />
              <div className="h-px flex-1 bg-slate-300" />
              <PasoIndicador numero={4} activo={paso === 4} completado={paso > 4} />
              <div className="h-px flex-1 bg-slate-300" />
              <PasoIndicador numero={5} activo={paso === 5} completado={false} />
            </div>
          </div>

          {/* PASO 1: Mostrar comparación de planes */}
          {paso === 1 && (
            <div className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <Zap className="h-5 w-5 text-blue-600" />
                <AlertDescription className="ml-2 text-blue-800">
                  <strong>Importante:</strong> Al cambiar de plan, tu suscripción actual será cancelada 
                  y se creará una nueva. El cambio será efectivo inmediatamente después del pago.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plan Actual */}
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Plan Actual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{planActual.nombre}</h3>
                      <p className="text-slate-600 mt-2">{planActual.descripcion}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Precio mensual</p>
                      <p className="text-2xl font-bold text-slate-700">
                        ${precioActual.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">COP/mes</p>
                    </div>

                    {/* ✅ CORREGIDO: Añadir protección contra undefined */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">Beneficios:</p>
                      <ul className="space-y-2">
                        {(planActual.beneficios || []).slice(0, 3).map((beneficio: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-600">{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Nuevo Plan */}
                <Card className="border-blue-200 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
                    NUEVO
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      Nuevo Plan
                      <ArrowRight className="w-5 h-5" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{nuevoPlan.nombre}</h3>
                      <p className="text-slate-600 mt-2">{nuevoPlan.descripcion}</p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-slate-600">Precio mensual</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${precioNuevo.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">COP/mes</p>
                      {diferencia !== 0 && (
                        <p className={`text-sm font-semibold mt-2 ${diferencia > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {diferencia > 0 ? '+' : ''}{diferencia.toLocaleString('es-CO')} COP/mes
                        </p>
                      )}
                    </div>

                    {/* ✅ CORREGIDO: Añadir protección contra undefined */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">Beneficios:</p>
                      <ul className="space-y-2">
                        {(nuevoPlan.beneficios || []).slice(0, 3).map((beneficio: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-blue-100 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-800">
                        ¿Confirmas el cambio de plan?
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Se cancelará tu plan actual y se creará uno nuevo
                      </p>
                    </div>
                    <Button
                      onClick={handleConfirmarCambio}
                      size="lg"
                      className="px-8"
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

 {/* PASO 2: Seleccionar método de pago y cambiar plan */}
          {paso === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Alert className="bg-blue-50 border-blue-200 mb-6">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="ml-2 text-blue-800">
                    Selecciona tu método de pago para continuar con el cambio de plan.
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
                    <CardTitle>Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600">Cambio de plan</p>
                      <p className="font-semibold text-slate-800">
                        {planActual.nombre} → {nuevoPlan.nombre}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600">Nuevo monto mensual</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${precioNuevo.toLocaleString('es-CO')} COP
                      </p>
                    </div>

                    {diferencia !== 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-600">Diferencia</p>
                        <p className={`text-lg font-bold ${diferencia > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {diferencia > 0 ? '+' : ''}{diferencia.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleCambiarPlan}
                      disabled={loading}
                      className="w-full h-12"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Cambiando plan...
                        </>
                      ) : (
                        'Cambiar Plan'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* PASO 3: Plan cambiado, preparar pago */}
          {paso === 3 && cambioData && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="ml-2 text-green-800">
                  <strong>Plan cambiado exitosamente.</strong><br />
                  Tu plan anterior ha sido cancelado. Completa el pago para activar tu nuevo plan.
                </AlertDescription>
              </Alert>

              <Card className="border-blue-100 shadow-lg">
                <CardHeader>
                  <CardTitle>Detalles del cambio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 mb-1">Plan anterior</p>
                      <p className="font-semibold text-slate-700">
                        {cambioData.suscripcionAnterior.plan}
                      </p>
                      <p className="text-xs text-red-600 mt-1">CANCELADO</p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs text-slate-600 mb-1">Nuevo plan</p>
                      <p className="font-semibold text-blue-700">
                        {cambioData.nuevaSuscripcion.plan_nombre}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">PENDIENTE DE PAGO</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Monto a pagar</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ${cambioData.ordenPago.monto.toLocaleString('es-CO')} COP
                    </p>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Método seleccionado:</strong> {
                        metodoPago === 'TARJETA_CREDITO' ? 'Tarjeta de Crédito' :
                        metodoPago === 'PASARELA' ? 'PSE' :
                        'Consignación'
                      }
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleProcesarPago}
                    disabled={loading}
                    className="w-full h-12"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Preparando pago...
                      </>
                    ) : (
                      'Procesar Pago'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PASO 4: Completar pago según método */}
          {paso === 4 && pagoData && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* TARJETA: Stripe Checkout */}
              {metodoPago === 'TARJETA_CREDITO' && pagoData.stripe && (
                <StripeCheckout
                  clientSecret={pagoData.stripe.clientSecret}
                  monto={pagoData.stripe.amount_usd}
                  montoCOP={pagoData.stripe.amount_cop}
                  onSuccess={handlePagoExitoso}
                  onError={handlePagoError}
                  descripcion={`Cambio a plan ${nuevoPlan.nombre}`}
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
                        Tu nuevo plan se activará una vez validemos el pago.
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

          {/* PASO 5: Pantalla de éxito */}
          {paso === 5 && (
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
                      ¡Plan actualizado con éxito!
                    </h2>
                    <p className="text-lg text-slate-600">
                      Tu cambio al plan <strong>{nuevoPlan.nombre}</strong> ha sido completado.
                    </p>
                  </div>

                  <div className="p-6 bg-green-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Plan anterior:</span>
                      <span className="font-semibold text-slate-500 line-through">
                        {planActual.nombre}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Plan nuevo:</span>
                      <span className="font-semibold text-green-600">
                        {nuevoPlan.nombre}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Nuevo monto:</span>
                      <span className="font-semibold text-green-600">
                        ${precioNuevo.toLocaleString('es-CO')} COP/mes
                      </span>
                    </div>
                    {ordenId && (
                      <div className="flex items-center justify-between pt-2 border-t border-green-200">
                        <span className="text-slate-600">Orden ID:</span>
                        <span className="font-mono text-sm text-slate-600">{ordenId}</span>
                      </div>
                    )}
                  </div>

                  <Alert className="text-left">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm">
                      Tu nuevo plan está activo y puedes comenzar a disfrutar de todos sus beneficios inmediatamente.
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

// Componentes auxiliares (sin cambios)
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