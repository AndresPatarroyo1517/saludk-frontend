'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useCart, useDispatchCart } from '@/lib/cartContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  ShoppingCart,
  Trash2,
  Tag,
  MapPin,
  AlertCircle,
  Copy,
  FileText,
  Package,
  PartyPopper
} from 'lucide-react';
import { toast } from 'sonner';
import MetodoPagoSelector from '@/components/checkout/MetodoPagoSelector';
import StripeCheckout from '@/components/checkout/StripeCheckout';
import pagoService from '@/lib/api/services/pagoService';
import { useAuthStore } from '@/lib/store/authStore';

type MetodoPago = 'TARJETA_CREDITO'  | 'PASARELA' | 'CONSIGNACION';
type Step = 'carrito' | 'direccion' | 'pago' | 'confirmacion' | 'exito';

export default function CartPage() {
  const router = useRouter();
  const { items } = useCart();
  const dispatch = useDispatchCart();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState<Step>('carrito');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA_CREDITO');
  const [loading, setLoading] = useState(false);
  const [compraData, setCompraData] = useState<any>(null);
  const [pagoData, setPagoData] = useState<any>(null);
  const [ordenId, setOrdenId] = useState<string>('');
  
  const [codigoPromocion, setCodigoPromocion] = useState('');
  const [aplicandoPromocion, setAplicandoPromocion] = useState(false);
  const [promocionAplicada, setPromocionAplicada] = useState<any>(null);
  
  // Obtener direcciones del usuario
  const direcciones = user?.datos_personales?.direcciones || [];
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<string>('');

  // Seleccionar primera dirección por defecto
  useEffect(() => {
    if (direcciones.length > 0 && !direccionSeleccionada) {
      setDireccionSeleccionada(direcciones[0].id);
    }
  }, [direcciones, direccionSeleccionada]);

  const calcularSubtotal = () => {
    return items.reduce((acc: number, item: any) => acc + Number(item.price) * item.qty, 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const descuento = promocionAplicada ? promocionAplicada.descuentoAplicado : 0;
    return subtotal - descuento;
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const eliminarProducto = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    toast.success('Producto eliminado del carrito');
  };

  const actualizarCantidad = (id: string, qty: number) => {
    if (qty < 1) {
      eliminarProducto(id);
      return;
    }
    dispatch({ type: 'SET_QTY', payload: { id, qty } });
  };

  const aplicarPromocion = async () => {
    if (!codigoPromocion.trim()) {
      toast.error('Ingresa un código de promoción');
      return;
    }

    setAplicandoPromocion(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const descuento = calcularSubtotal() * 0.2;
      setPromocionAplicada({
        codigo: codigoPromocion,
        descuentoAplicado: descuento,
        porcentaje: 20,
      });
      
      toast.success('¡Código aplicado!', {
        description: `Descuento de ${formatPrice(descuento)} COP`,
      });
    } catch (error) {
      toast.error('Código inválido o expirado');
    } finally {
      setAplicandoPromocion(false);
    }
  };

  const confirmarCompraEnBackend = async (compraId: string) => {
    try {
      console.log('🟢 [CONFIRMACIÓN] Confirmando compra:', compraId);
      const response = await pagoService.confirmarCompra(compraId);
      console.log('✅ [CONFIRMACIÓN] Compra confirmada:', response);
      return true;
    } catch (error: any) {
      console.error('❌ [CONFIRMACIÓN] Error:', error);
      toast.error('Error al confirmar la compra', {
        description: error.response?.data?.error || error.message,
      });
      return false;
    }
  };

  const handleCrearCompra = async () => {
    if (!direccionSeleccionada) {
      toast.error('Selecciona una dirección de entrega');
      return;
    }

    console.log('🟢 [PASO 1] Creando compra con método:', metodoPago);
    setLoading(true);

    try {
      const itemsPayload = items.map((item: any) => ({
        productId: item.id,
        cantidad: item.qty,
      }));

      const response = await pagoService.procesarCompra({
        items: itemsPayload,
        metodoPago: metodoPago,
        direccion_entrega_id: direccionSeleccionada,
        codigoPromocion: promocionAplicada?.codigo,
      });

      console.log('✅ [PASO 1] Compra creada:', response);

      const responseData = response.data || response;
      
      if (!responseData.compra?.id) {
        throw new Error('No se pudo crear la compra');
      }

      if (responseData.ordenPago?.id) {
        setOrdenId(responseData.ordenPago.id);
      }

      setCompraData(responseData.compra);
      setPagoData(responseData.ordenPago);
      setStep('confirmacion');
      
      toast.success('Compra creada', {
        description: 'Procede con el pago',
      });

    } catch (error: any) {
      console.error('❌ [PASO 1] Error:', error);
      toast.error('Error al crear la compra', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagoExitoso = async () => {
    console.log('🟢 [PAGO EXITOSO] Orden:', ordenId);
    
    try {
      // Confirmar la compra en el backend para tarjeta
      if (compraData?.compra?.id) {
        const confirmado = await confirmarCompraEnBackend(compraData.compra.id);
        if (!confirmado) {
          console.warn('⚠️ Compra no confirmada en backend, pero continuando...');
        }
      }
      
      setStep('exito');
      
      toast.success('¡Compra completada!', {
        description: 'Tu pedido ha sido procesado',
        icon: <CheckCircle className="w-5 h-5" />,
      });

      // Limpiar carrito
      dispatch({ type: 'CLEAR' });

    } catch (error) {
      console.error('❌ [PAGO EXITOSO] Error:', error);
      toast.error('Error al procesar la compra', {
        description: 'Contacta a soporte si el problema persiste',
      });
    }
  };

  const handlePagoError = (error: string) => {
    toast.error('Error en el pago', {
      description: error,
    });
  };

  const handleConfirmarYRedirigir = async () => {
    if (compraData?.compra?.id) {
      const confirmado = await confirmarCompraEnBackend(compraData.compra.id);
      if (confirmado) {
        toast.success('Compra confirmada');
      }
    }
    router.push('/dashboard/mis-compras');
  };

  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado al portapapeles`);
  };

  if (items.length === 0 && step !== 'exito') {
    return (
      <main className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-2xl mx-auto text-center py-12 px-4">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-slate-600 mb-6">
            Agrega productos para comenzar tu compra
          </p>
          <Button onClick={() => router.push('/dashboard/farmacia')}>
            Ver productos
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 'carrito') router.push('/dashboard/farmacia');
              else if (step === 'direccion') setStep('carrito');
              else if (step === 'pago') setStep('direccion');
              else if (step === 'confirmacion') setStep('pago');
            }}
            className="mb-4"
            disabled={step === 'exito'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-slate-800">
            {step === 'carrito' && 'Carrito de Compras'}
            {step === 'direccion' && 'Dirección de Entrega'}
            {step === 'pago' && 'Método de Pago'}
            {step === 'confirmacion' && 'Confirmar Pago'}
            {step === 'exito' && '¡Compra Exitosa!'}
          </h1>
        </div>

        {/* Indicador de pasos */}
        {step !== 'exito' && (
          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { id: 'carrito', label: 'Carrito' },
              { id: 'direccion', label: 'Dirección' },
              { id: 'pago', label: 'Pago' },
              { id: 'confirmacion', label: 'Confirmación' },
            ].map((paso, idx) => (
              <div key={paso.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                    step === paso.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-slate-700 hidden sm:inline">
                  {paso.label}
                </span>
                {idx < 3 && (
                  <div className="w-8 sm:w-12 h-0.5 bg-slate-200 mx-2 sm:mx-4" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP: Carrito */}
            {step === 'carrito' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Productos ({items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded" />
                        ) : (
                          <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                            Sin imagen
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">
                            {item.title}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {formatPrice(Number(item.price))} COP
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actualizarCantidad(item.id, item.qty - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.qty}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actualizarCantidad(item.id, item.qty + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => eliminarProducto(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Código Promocional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ingresa tu código"
                        value={codigoPromocion}
                        onChange={(e) => setCodigoPromocion(e.target.value)}
                        disabled={!!promocionAplicada}
                      />
                      <Button
                        onClick={aplicarPromocion}
                        disabled={aplicandoPromocion || !!promocionAplicada}
                      >
                        {aplicandoPromocion ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Aplicar'
                        )}
                      </Button>
                    </div>
                    {promocionAplicada && (
                      <Alert className="mt-4 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Código <strong>{promocionAplicada.codigo}</strong> aplicado.
                          Descuento: {promocionAplicada.porcentaje}%
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep('direccion')}
                  className="w-full h-12"
                  size="lg"
                >
                  Continuar a Dirección
                </Button>
              </>
            )}

            {/* STEP: Dirección */}
            {step === 'direccion' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Dirección de Entrega
                    </CardTitle>
                    <CardDescription>
                      Selecciona dónde quieres recibir tu pedido
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {direcciones.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No tienes direcciones registradas. Por favor, agrega una dirección en tu perfil.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      direcciones.map((dir: any) => (
                        <div
                          key={dir.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            direccionSeleccionada === dir.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                          onClick={() => setDireccionSeleccionada(dir.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{dir.direccion_completa}</p>
                              <p className="text-sm text-slate-600 mt-1">
                                {dir.ciudad}, {dir.departamento}
                              </p>
                              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                                {dir.tipo}
                              </span>
                            </div>
                            {direccionSeleccionada === dir.id && (
                              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep('pago')}
                  className="w-full h-12"
                  size="lg"
                  disabled={!direccionSeleccionada}
                >
                  Continuar a Pago
                </Button>
              </>
            )}

            {/* STEP: Método de pago */}
            {step === 'pago' && (
              <>
                <MetodoPagoSelector
                  metodoPago={metodoPago}
                  onSelect={(metodo) => setMetodoPago(metodo as MetodoPago)}
                  disabled={loading}
                />

                <Button
                  onClick={handleCrearCompra}
                  disabled={loading}
                  className="w-full h-12"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Continuar al Pago'
                  )}
                </Button>
              </>
            )}

            {/* STEP: Confirmación */}
            {step === 'confirmacion' && pagoData && (
              <>
                {/* TARJETA: Stripe */}
                {metodoPago === 'TARJETA_CREDITO' && pagoData.stripe && (
                  <StripeCheckout
                    clientSecret={pagoData.stripe.clientSecret}
                    monto={pagoData.stripe.amount_usd}
                    montoCOP={compraData.total}
                    onSuccess={handlePagoExitoso}
                    onError={handlePagoError}
                    descripcion="Compra de productos"
                  />
                )}

                {/* PSE */}
                {metodoPago === 'PASARELA' && pagoData.pse && (
                  <Card className="border-teal-100 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-teal-600" />
                        Pago PSE en Proceso
                      </CardTitle>
                      <CardDescription>{pagoData.pse.mensaje}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <p className="text-sm font-semibold text-teal-900 mb-2">
                          Referencia:
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
                        onClick={handleConfirmarYRedirigir}
                        className="w-full"
                      >
                        Entendido
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* CONSIGNACIÓN */}
                {metodoPago === 'CONSIGNACION' && pagoData.consignacion && (
                  <Card className="border-slate-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-slate-700" />
                        Instrucciones de Consignación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <DatoConsignacion
                        label="Banco"
                        valor={pagoData.consignacion.banco}
                      />
                      <DatoConsignacion
                        label="Tipo de cuenta"
                        valor={pagoData.consignacion.tipoCuenta}
                      />
                      <DatoConsignacion
                        label="Número de cuenta"
                        valor={pagoData.consignacion.numeroCuenta}
                        copiable
                        onCopiar={() => copiarTexto(pagoData.consignacion.numeroCuenta, 'Cuenta')}
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
                          {formatPrice(compraData.total)} COP
                        </p>
                      </div>

                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm text-amber-800">
                          <strong>Nota:</strong> Las consignaciones deben ser verificadas manualmente.
                          Tu pedido será procesado una vez validemos el pago.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleConfirmarYRedirigir}
                        className="w-full"
                      >
                        Entendido
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* STEP: Éxito */}
            {step === 'exito' && (
              <Card className="border-green-100 shadow-2xl">
                <CardContent className="pt-12 pb-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                      <PartyPopper className="w-12 h-12 text-green-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-800">
                      ¡Gracias por tu compra!
                    </h2>
                    <p className="text-lg text-slate-600">
                      Tu pedido ha sido procesado exitosamente.
                    </p>
                  </div>

                  <div className="p-6 bg-green-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Orden ID:</span>
                      <span className="font-mono text-sm text-slate-600">{ordenId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total pagado:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(calcularTotal())} COP
                      </span>
                    </div>
                  </div>

                  <Alert className="text-left">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm">
                      Recibirás una confirmación por correo electrónico con los detalles de tu pedido.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={() => router.push('/dashboard/mis-compras')}
                      className="flex-1"
                    >
                      Ver mis compras
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard/farmacia')}
                      variant="outline"
                      className="flex-1"
                    >
                      Seguir comprando
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna derecha: Resumen */}
          {step !== 'exito' && (
            <div className="space-y-6">
              <Card className="border-blue-100 shadow-lg sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold">
                        {formatPrice(calcularSubtotal())} COP
                      </span>
                    </div>
                    {promocionAplicada && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Descuento ({promocionAplicada.porcentaje}%)</span>
                        <span className="font-semibold">
                          -{formatPrice(promocionAplicada.descuentoAplicado)} COP
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-slate-800">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(calcularTotal())} COP
                        </span>
                      </div>
                    </div>
                  </div>

                  {step === 'direccion' && direccionSeleccionada && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 mb-2">
                        Entregar en:
                      </p>
                      <p className="text-sm text-slate-800">
                        {direcciones.find((d: any) => d.id === direccionSeleccionada)?.direccion_completa}
                      </p>
                    </div>
                  )}

                  {step === 'pago' && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 mb-2">
                        Método de pago:
                      </p>
                      <p className="text-sm text-slate-800">
                        {metodoPago === 'TARJETA_CREDITO' && 'Tarjeta de Crédito'}
                        {metodoPago === 'PASARELA' && 'PASARELA'}
                        {metodoPago === 'CONSIGNACION' && 'Consignación Bancaria'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Componente auxiliar para datos de consignación
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