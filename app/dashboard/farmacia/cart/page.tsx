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
  PartyPopper,
  CreditCard,
  Building,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import MetodoPagoSelector from '@/components/checkout/MetodoPagoSelector';
import StripeCheckout from '@/components/checkout/StripeCheckout';
import pagoService from '@/lib/api/services/pagoService';
import { useAuthStore } from '@/lib/store/authStore';

type MetodoPago = 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
type Step = 'carrito' | 'direccion' | 'pago' | 'confirmacion' | 'exito';

// Función para convertir COP a USD (tasa de cambio aproximada)
const convertirCopAUsd = (montoCOP: number): number => {
  // Tasa de cambio aproximada - puedes obtenerla de una API en producción
  const tasaCambio = 0.00024; // 1 COP ≈ 0.00024 USD
  return montoCOP * tasaCambio;
};

// Función para formatear precio en USD
const formatPriceUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

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
  const [montoUSD, setMontoUSD] = useState<number>(0);
  
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
    return Math.max(subtotal - descuento, 0);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Actualizar monto USD cuando cambien los datos de pago
  useEffect(() => {
    if (pagoData && compraData) {
      const totalCOP = compraData.total || calcularTotal();
      const montoUSD = convertirCopAUsd(totalCOP);
      setMontoUSD(montoUSD);
    }
  }, [pagoData, compraData]);

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
        description: `Descuento de ${formatPrice(descuento)} aplicado`,
      });
    } catch (error) {
      toast.error('Código inválido o expirado');
    } finally {
      setAplicandoPromocion(false);
    }
  };

  const confirmarCompraEnBackend = async (compraId: string) => {
    try {
      console.log('🟢 Confirmando compra:', compraId);
      const response = await pagoService.confirmarCompra(compraId);
      console.log('✅ Compra confirmada:', response);
      return true;
    } catch (error: any) {
      console.error('❌ Error confirmando compra:', error);
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

    console.log('🟢 Creando compra con método:', metodoPago);
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

      console.log('✅ Compra creada:', response);

      const responseData = response.data || response;
      
      if (!responseData.compra?.id) {
        throw new Error('No se pudo crear la compra');
      }

      if (responseData.ordenPago?.id) {
        setOrdenId(responseData.ordenPago.id);
      }

      // Calcular monto USD antes de guardar los datos
      const totalCOP = responseData.compra.total || calcularTotal();
      const montoUSDCalculado = convertirCopAUsd(totalCOP);
      setMontoUSD(montoUSDCalculado);

      setCompraData(responseData.compra);
      setPagoData(responseData);
      
      setStep('confirmacion');
      
      toast.success('Compra creada exitosamente', {
        description: 'Procede con el pago para completar tu pedido',
      });

    } catch (error: any) {
      console.error('❌ Error creando compra:', error);
      toast.error('Error al crear la compra', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagoExitoso = async () => {
    console.log('🟢 Pago exitoso para orden:', ordenId);
    
    try {
      // Confirmar la compra en el backend para tarjeta
      if (compraData?.id) {
        const confirmado = await confirmarCompraEnBackend(compraData.id);
        if (!confirmado) {
          console.warn('⚠️ Compra no confirmada en backend, pero continuando...');
        }
      }
      
      setStep('exito');
      
      toast.success('¡Compra completada!', {
        description: 'Tu pedido ha sido procesado exitosamente',
        icon: <CheckCircle className="w-5 h-5" />,
      });

      // Limpiar carrito
      dispatch({ type: 'CLEAR' });

    } catch (error) {
      console.error('❌ Error en pago exitoso:', error);
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
    if (compraData?.id) {
      const confirmado = await confirmarCompraEnBackend(compraData.id);
      if (confirmado) {
        toast.success('Compra confirmada exitosamente');
      }
    }
    router.push('/dashboard/mis-compras');
  };

  // Función para renderizar el formulario de Stripe - MEJORADA
  const renderStripeForm = () => {
    if (!pagoData?.stripe?.clientSecret) {
      console.error('❌ No hay clientSecret disponible:', pagoData);
      return (
        <Alert variant="destructive" className="animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar el formulario de pago. No se encontró clientSecret.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <StripeCheckout
        clientSecret={pagoData.stripe.clientSecret}
        monto={montoUSD} // Usar el monto en USD calculado
        montoCOP={compraData?.total || calcularTotal()}
        onSuccess={handlePagoExitoso}
        onError={handlePagoError}
        descripcion={`Compra #${compraData?.numero_orden || ''}`}
      />
    );
  };

  // Función para copiar texto
  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado al portapapeles`);
  };

  if (items.length === 0 && step !== 'exito') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="max-w-2xl mx-auto text-center py-16 px-4">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3">
            Tu carrito está vacío
          </h2>
          <p className="text-slate-600 mb-8 text-lg">
            Descubre nuestros productos y comienza tu compra
          </p>
          <Button 
            onClick={() => router.push('/dashboard/farmacia')}
            size="lg"
            className="px-8 py-3 text-base"
          >
            Explorar Productos
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header con navegación */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  if (step === 'carrito') router.push('/dashboard/farmacia');
                  else if (step === 'direccion') setStep('carrito');
                  else if (step === 'pago') setStep('direccion');
                  else if (step === 'confirmacion') setStep('pago');
                }}
                className="hover:bg-slate-100 transition-colors"
                disabled={step === 'exito'}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {step === 'carrito' && 'Carrito de Compras'}
                  {step === 'direccion' && 'Dirección de Entrega'}
                  {step === 'pago' && 'Método de Pago'}
                  {step === 'confirmacion' && 'Confirmar Pago'}
                  {step === 'exito' && '¡Compra Exitosa!'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {step === 'carrito' && 'Revisa y gestiona tus productos'}
                  {step === 'direccion' && 'Selecciona donde recibirás tu pedido'}
                  {step === 'pago' && 'Elige cómo quieres pagar'}
                  {step === 'confirmacion' && 'Completa tu compra'}
                  {step === 'exito' && 'Tu pedido está en proceso'}
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
              <Package className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                {items.length} producto{items.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador de pasos mejorado */}
        {step !== 'exito' && (
          <div className="flex items-center justify-center gap-8 mb-8">
            {[
              { id: 'carrito', label: 'Carrito', icon: ShoppingCart },
              { id: 'direccion', label: 'Dirección', icon: MapPin },
              { id: 'pago', label: 'Pago', icon: CreditCard },
              { id: 'confirmacion', label: 'Confirmar', icon: CheckCircle },
            ].map((paso, idx) => {
              const Icon = paso.icon;
              const isActive = step === paso.id;
              const isCompleted = ['direccion', 'pago', 'confirmacion', 'exito'].indexOf(step) > ['carrito', 'direccion', 'pago', 'confirmacion'].indexOf(paso.id);
              
              return (
                <div key={paso.id} className="flex items-center">
                  <div className={`flex flex-col items-center transition-all duration-300 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}>
                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl font-semibold border-2 transition-all ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                        : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium transition-colors ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {paso.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`w-16 h-1 mx-4 rounded-full transition-colors ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="xl:col-span-2 space-y-6">
            {/* STEP: Carrito */}
            {step === 'carrito' && (
              <>
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-slate-50 rounded-t-lg border-b">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xl">Tu Carrito</div>
                        <div className="text-sm font-normal text-slate-500">
                          {items.length} producto{items.length !== 1 ? 's' : ''} agregado{items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors group"
                      >
                        <div className="flex-shrink-0">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-20 h-20 object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 truncate">
                            {item.title}
                          </h4>
                          <p className="text-lg font-bold text-blue-600 mt-1">
                            {formatPrice(Number(item.price))}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-slate-200"
                              onClick={() => actualizarCantidad(item.id, item.qty - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-semibold text-slate-800">
                              {item.qty}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-slate-200"
                              onClick={() => actualizarCantidad(item.id, item.qty + 1)}
                            >
                              +
                            </Button>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => eliminarProducto(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Tag className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-slate-800">Código Promocional</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Ingresa tu código de descuento"
                        value={codigoPromocion}
                        onChange={(e) => setCodigoPromocion(e.target.value)}
                        disabled={!!promocionAplicada}
                        className="flex-1"
                      />
                      <Button
                        onClick={aplicarPromocion}
                        disabled={aplicandoPromocion || !!promocionAplicada}
                        variant={promocionAplicada ? "outline" : "default"}
                        className="whitespace-nowrap"
                      >
                        {aplicandoPromocion ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {promocionAplicada ? 'Aplicado' : 'Aplicar'}
                      </Button>
                    </div>
                    {promocionAplicada && (
                      <Alert className="mt-4 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          ¡Descuento del {promocionAplicada.porcentaje}% aplicado! 
                          Ahorras {formatPrice(promocionAplicada.descuentoAplicado)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep('direccion')}
                  className="w-full h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Continuar con la Dirección
                </Button>
              </>
            )}

            {/* STEP: Dirección */}
            {step === 'direccion' && (
              <>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 rounded-t-lg border-b">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xl">Dirección de Entrega</div>
                        <div className="text-sm font-normal text-slate-500">
                          Selecciona dónde quieres recibir tu pedido
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {direcciones.length === 0 ? (
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          No tienes direcciones registradas. Por favor, agrega una dirección en tu perfil.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      direcciones.map((dir: any) => (
                        <div
                          key={dir.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            direccionSeleccionada === dir.id
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-slate-200 hover:border-blue-300 bg-white'
                          }`}
                          onClick={() => setDireccionSeleccionada(dir.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="w-4 h-4 text-slate-400" />
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                                  {dir.tipo}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-800">{dir.direccion_completa}</p>
                              <p className="text-sm text-slate-600 mt-1">
                                {dir.ciudad}, {dir.departamento}
                              </p>
                            </div>
                            {direccionSeleccionada === dir.id && (
                              <div className="flex-shrink-0 ml-4">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep('pago')}
                  className="w-full h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  disabled={!direccionSeleccionada}
                >
                  {!direccionSeleccionada ? 'Selecciona una dirección' : 'Continuar al Pago'}
                </Button>
              </>
            )}

            {/* STEP: Método de pago */}
            {step === 'pago' && (
              <>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 rounded-t-lg border-b">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xl">Método de Pago</div>
                        <div className="text-sm font-normal text-slate-500">
                          Elige cómo quieres pagar tu pedido
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <MetodoPagoSelector
                      metodoPago={metodoPago}
                      onSelect={(metodo) => setMetodoPago(metodo as MetodoPago)}
                      disabled={loading}
                    />
                  </CardContent>
                </Card>

                <Button
                  onClick={handleCrearCompra}
                  disabled={loading}
                  className="w-full h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Procesando tu compra...
                    </>
                  ) : (
                    `Pagar ${formatPrice(calcularTotal())}`
                  )}
                </Button>
              </>
            )}

            {/* STEP: Confirmación - MEJORADO CON PRECIO EN USD */}
            {step === 'confirmacion' && pagoData && (
              <div className="space-y-6">
                {/* TARJETA: Stripe - MEJORADO */}
                {metodoPago === 'TARJETA_CREDITO' && (
                  <div className="animate-in fade-in duration-500">
                    {pagoData.stripe?.clientSecret ? (
                      <Card className="border-blue-200 shadow-lg">
                        <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
                          <CardTitle className="flex items-center gap-3 text-blue-900">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xl">Pago con Tarjeta</div>
                              <div className="text-sm font-normal text-blue-700">
                                Completa los datos de tu tarjeta de crédito/débito
                              </div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                         
                          
                          {renderStripeForm()}
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert variant="destructive" className="animate-pulse">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Error: No se pudo cargar el formulario de pago. ClientSecret no disponible.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Resto de métodos de pago... */}
                {metodoPago === 'PASARELA' && pagoData.pse && (
                  <Card className="border-teal-200 shadow-lg">
                    <CardHeader className="bg-teal-50 rounded-t-lg border-b border-teal-100">
                      <CardTitle className="flex items-center gap-3 text-teal-900">
                        <CheckCircle className="w-6 h-6 text-teal-600" />
                        Pago PSE en Proceso
                      </CardTitle>
                      <CardDescription className="text-teal-700">
                        {pagoData.pse.mensaje}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <p className="text-sm font-semibold text-teal-900 mb-2">
                          Referencia de pago:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-lg font-mono font-bold text-teal-700 bg-teal-100 px-3 py-2 rounded">
                            {pagoData.pse.referencia}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copiarTexto(pagoData.pse.referencia, 'Referencia')}
                            className="border-teal-300 text-teal-700 hover:bg-teal-50"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          En un entorno de producción, serías redirigido automáticamente al portal PSE de tu banco.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleConfirmarYRedirigir}
                        className="w-full h-12 bg-teal-600 hover:bg-teal-700"
                      >
                        Entendido, continuar
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {metodoPago === 'CONSIGNACION' && pagoData.consignacion && (
                  <Card className="border-slate-200 shadow-lg">
                    <CardHeader className="bg-slate-50 rounded-t-lg border-b">
                      <CardTitle className="flex items-center gap-3 text-slate-800">
                        <FileText className="w-6 h-6 text-slate-700" />
                        Instrucciones de Consignación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <DatoConsignacion
                        label="Banco"
                        valor={pagoData.consignacion.banco}
                        icon={<Building className="w-4 h-4" />}
                      />
                      <DatoConsignacion
                        label="Tipo de cuenta"
                        valor={pagoData.consignacion.tipoCuenta}
                      />
                      <DatoConsignacion
                        label="Número de cuenta"
                        valor={pagoData.consignacion.numeroCuenta}
                        copiable
                        onCopiar={() => copiarTexto(pagoData.consignacion.numeroCuenta, 'Número de cuenta')}
                      />
                      <DatoConsignacion
                        label="Referencia única"
                        valor={pagoData.consignacion.referencia}
                        copiable
                        destacado
                        onCopiar={() => copiarTexto(pagoData.consignacion.referencia, 'Referencia')}
                      />
                      
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Monto a consignar:</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {formatPrice(compraData?.total || calcularTotal())}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                          <DollarSign className="w-4 h-4" />
                          {formatPriceUSD(montoUSD)} USD
                        </div>
                      </div>

                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <strong>Importante:</strong> Las consignaciones son validadas manualmente. 
                          Tu pedido será procesado una vez confirmemos el pago, lo que puede tomar hasta 24 horas.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleConfirmarYRedirigir}
                        className="w-full h-12"
                      >
                        Entendido, he realizado la consignación
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* STEP: Éxito */}
            {step === 'exito' && (
              <Card className="border-green-200 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardContent className="pt-16 pb-12 px-8 text-center space-y-8">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-lg">
                        <PartyPopper className="w-16 h-16 text-green-600" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ¡Compra Exitosa!
                    </h2>
                    <p className="text-xl text-slate-600 max-w-md mx-auto leading-relaxed">
                      Tu pedido ha sido confirmado y está siendo procesado. Recibirás una confirmación por email.
                    </p>
                  </div>

                  <div className="p-6 bg-green-50 rounded-2xl border border-green-200 space-y-4 max-w-md mx-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Número de orden:</span>
                      <span className="font-mono font-semibold text-slate-800">{ordenId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total pagado:</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-green-600 block">
                          {formatPrice(compraData?.total)}
                        </span>
                        <span className="text-sm text-green-700 flex items-center gap-1 mt-1">
                          <DollarSign className="w-4 h-4" />
                          {formatPriceUSD(montoUSD)} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  <Alert className="max-w-md mx-auto text-left bg-blue-50 border-blue-200">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Estado:</strong> Tu pedido está siendo preparado. Te notificaremos cuando sea enviado.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 max-w-md mx-auto">
                    <Button
                      onClick={() => router.push('/dashboard/mis-compras')}
                      className="flex-1 h-12 bg-slate-800 hover:bg-slate-900"
                    >
                      Ver Mis Compras
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard/farmacia')}
                      variant="outline"
                      className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Seguir Comprando
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna derecha: Resumen - MEJORADO CON USD */}
          {step !== 'exito' && (
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-lg sticky top-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    Resumen del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Lista de productos */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-600">Productos</p>
                    {items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="max-w-[120px]">
                            <p className="font-medium text-slate-800 truncate">{item.title}</p>
                            <p className="text-slate-500">x{item.qty}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {formatPrice(Number(item.price) * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-800">
                        {formatPrice(calcularSubtotal())}
                      </span>
                    </div>
                    
                    {promocionAplicada && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Descuento ({promocionAplicada.porcentaje}%)</span>
                        <span className="font-semibold text-green-600">
                          -{formatPrice(promocionAplicada.descuentoAplicado)}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-slate-800">Total</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600 block">
                            {formatPrice(calcularTotal())}
                          </span>
                          <span className="text-sm text-blue-700 flex items-center gap-1 mt-1">
                            <DollarSign className="w-3 h-3" />
                            {formatPriceUSD(convertirCopAUsd(calcularTotal()))} USD
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 text-right">
                        IVA incluido
                      </p>
                    </div>
                  </div>

                  {/* Información contextual según el paso */}
                  {step === 'direccion' && direccionSeleccionada && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 mb-2">
                        📍 Dirección seleccionada:
                      </p>
                      <p className="text-sm text-slate-800 leading-relaxed">
                        {direcciones.find((d: any) => d.id === direccionSeleccionada)?.direccion_completa}
                      </p>
                    </div>
                  )}

                  {step === 'pago' && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 mb-2">
                        💳 Método de pago:
                      </p>
                      <p className="text-sm text-slate-800 font-medium">
                        {metodoPago === 'TARJETA_CREDITO' && 'Tarjeta de Crédito/Débito'}
                        {metodoPago === 'PASARELA' && 'PSE - Pago en Línea'}
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

// Componente auxiliar mejorado para datos de consignación
function DatoConsignacion({ 
  label, 
  valor, 
  copiable, 
  destacado, 
  onCopiar,
  icon
}: { 
  label: string; 
  valor: string; 
  copiable?: boolean; 
  destacado?: boolean; 
  onCopiar?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      destacado 
        ? 'bg-yellow-50 border-2 border-yellow-300 shadow-sm' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-semibold text-slate-600">{label}:</p>
      </div>
      <div className="flex items-center gap-2">
        <p className={`flex-1 ${
          destacado ? 'font-mono text-lg font-bold text-yellow-800' : 'font-medium text-slate-800'
        }`}>
          {valor}
        </p>
        {copiable && onCopiar && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCopiar}
            className={`${
              destacado 
                ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}