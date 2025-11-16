'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import MetodoPagoSelector from '@/components/checkout/MetodoPagoSelector';
import StripeCheckout from '@/components/checkout/StripeCheckout';
import pagoService from '@/lib/api/services/pagoService';
import { useAuthStore } from '@/lib/store/authStore';

type MetodoPago = 'TARJETA' | 'PSE' | 'CONSIGNACION';
type Step = 'carrito' | 'direccion' | 'pago' | 'confirmacion';

interface ProductoCarrito {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface Direccion {
  id: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
}

export default function CheckoutProductosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // States
  const [step, setStep] = useState<Step>('carrito');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA');
  const [loading, setLoading] = useState(false);
  const [ordenData, setOrdenData] = useState<any>(null);
  const [codigoPromocion, setCodigoPromocion] = useState('');
  const [aplicandoPromocion, setAplicandoPromocion] = useState(false);
  const [promocionAplicada, setPromocionAplicada] = useState<any>(null);
  
  // Carrito (en producción vendría de un store global como Zustand)
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([
    {
      id: '1',
      nombre: 'Acetaminofén 500mg',
      precio: 15000,
      cantidad: 2,
    },
    {
      id: '2',
      nombre: 'Ibuprofeno 400mg',
      precio: 20000,
      cantidad: 1,
    },
  ]);
  
  // Direcciones (deberían venir de tu API)
  const [direcciones, setDirecciones] = useState<Direccion[]>([
    {
      id: '1',
      direccion: 'Calle 123 #45-67',
      ciudad: 'Bogotá',
      codigo_postal: '110111',
    },
  ]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<string>('1');

  const calcularTotal = () => {
    const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const descuento = promocionAplicada ? promocionAplicada.descuentoAplicado : 0;
    return subtotal - descuento;
  };

  const calcularSubtotal = () => {
    return carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  };

  const eliminarProducto = (id: string) => {
    setCarrito(carrito.filter(item => item.id !== id));
    toast.success('Producto eliminado del carrito');
  };

  const actualizarCantidad = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    setCarrito(carrito.map(item => 
      item.id === id ? { ...item, cantidad } : item
    ));
  };

  const aplicarPromocion = async () => {
    if (!codigoPromocion.trim()) {
      toast.error('Ingresa un código de promoción');
      return;
    }

    setAplicandoPromocion(true);
    try {
      // Simular validación (en producción llamarías a tu API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ejemplo: 20% de descuento
      const descuento = calcularSubtotal() * 0.2;
      setPromocionAplicada({
        codigo: codigoPromocion,
        descuentoAplicado: descuento,
        porcentaje: 20,
      });
      
      toast.success('¡Código aplicado!', {
        description: `Descuento de ${descuento.toLocaleString('es-CO')} COP`,
      });
    } catch (error) {
      toast.error('Código inválido o expirado');
    } finally {
      setAplicandoPromocion(false);
    }
  };

  const handleCrearOrden = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!direccionSeleccionada) {
      toast.error('Selecciona una dirección de entrega');
      return;
    }

    setLoading(true);
    try {
      const items = carrito.map(item => ({
        productId: item.id,
        cantidad: item.cantidad,
      }));

      const response = await pagoService.procesarCompra({
        items,
        metodoPago,
        direccion_entrega_id: direccionSeleccionada,
        codigoPromocion: promocionAplicada?.codigo,
      });

      setOrdenData(response.data);
      setStep('confirmacion');

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
    toast.success('¡Compra completada!', {
      description: 'Tu pedido ha sido procesado',
      icon: <CheckCircle className="w-5 h-5" />,
    });
    
    setTimeout(() => {
      router.push('/dashboard/mis-compras');
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

  if (carrito.length === 0 && step === 'carrito') {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto text-center py-12">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Tu carrito está vacío
            </h2>
            <p className="text-slate-600 mb-6">
              Agrega productos para comenzar tu compra
            </p>
            <Button onClick={() => router.push('/productos')}>
              Ver productos
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                if (step === 'carrito') router.push('/productos');
                else if (step === 'direccion') setStep('carrito');
                else if (step === 'pago') setStep('direccion');
                else if (step === 'confirmacion') setStep('pago');
              }}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">
              {step === 'carrito' && 'Carrito de Compras'}
              {step === 'direccion' && 'Dirección de Entrega'}
              {step === 'pago' && 'Método de Pago'}
              {step === 'confirmacion' && 'Confirmar Pago'}
            </h1>
            <p className="text-slate-600 mt-2">
              {step === 'carrito' && 'Revisa los productos en tu carrito'}
              {step === 'direccion' && 'Selecciona dónde quieres recibir tu pedido'}
              {step === 'pago' && 'Elige cómo deseas pagar'}
              {step === 'confirmacion' && 'Completa tu compra'}
            </p>
          </div>

          {/* Pasos */}
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
                <span className="ml-2 text-sm font-medium text-slate-700">
                  {paso.label}
                </span>
                {idx < 3 && (
                  <div className="w-12 h-0.5 bg-slate-200 mx-4" />
                )}
              </div>
            ))}
          </div>

          {/* Contenido según el step */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* STEP 1: Carrito */}
              {step === 'carrito' && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Productos ({carrito.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {carrito.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">
                              {item.nombre}
                            </h4>
                            <p className="text-sm text-slate-600">
                              ${item.precio.toLocaleString('es-CO')} COP
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.cantidad}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
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

                  {/* Código promocional */}
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
                    Continuar
                  </Button>
                </>
              )}

              {/* STEP 2: Dirección */}
              {step === 'direccion' && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Dirección de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {direcciones.map((dir) => (
                        <div
                          key={dir.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            direccionSeleccionada === dir.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                          onClick={() => setDireccionSeleccionada(dir.id)}
                        >
                          <p className="font-semibold text-slate-800">{dir.direccion}</p>
                          <p className="text-sm text-slate-600">
                            {dir.ciudad} - {dir.codigo_postal}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Button
                    onClick={() => setStep('pago')}
                    className="w-full h-12"
                    size="lg"
                    disabled={!direccionSeleccionada}
                  >
                    Continuar
                  </Button>
                </>
              )}

              {/* STEP 3: Método de pago */}
              {step === 'pago' && (
                <>
                  <MetodoPagoSelector
                    metodoPago={metodoPago}
                    onSelect={setMetodoPago}
                    disabled={loading}
                  />

                  <Button
                    onClick={handleCrearOrden}
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
                      'Continuar al pago'
                    )}
                  </Button>
                </>
              )}

              {/* STEP 4: Confirmación */}
              {step === 'confirmacion' && (
                <>
                  {metodoPago === 'TARJETA' && ordenData?.stripe && (
                    <StripeCheckout
                      clientSecret={ordenData.stripe.client_secret}
                      monto={ordenData.stripe.amount_usd}
                      montoCOP={ordenData.montoFinal}
                      onSuccess={handlePagoExitoso}
                      onError={handlePagoError}
                      descripcion="Compra de productos"
                    />
                  )}

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
                        <div className="p-4 bg-teal-50 rounded-lg">
                          <p className="text-sm font-semibold text-teal-900 mb-2">
                            Referencia:
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
                      </CardContent>
                    </Card>
                  )}

                  {metodoPago === 'CONSIGNACION' && ordenData?.consignacion && (
                    <Card className="border-slate-200 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-6 h-6 text-slate-700" />
                          Instrucciones de Consignación
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Instrucciones similares al componente de suscripción */}
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-semibold mb-2">Banco:</p>
                          <p className="text-lg font-bold">{ordenData.consignacion.banco}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-semibold mb-2">Cuenta:</p>
                          <code className="text-lg font-mono">
                            {ordenData.consignacion.numeroCuenta}
                          </code>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-semibold mb-2">Monto:</p>
                          <p className="text-2xl font-bold">
                            ${ordenData.montoFinal.toLocaleString('es-CO')} COP
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Columna derecha: Resumen */}
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
                        ${calcularSubtotal().toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    {promocionAplicada && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Descuento ({promocionAplicada.porcentaje}%)</span>
                        <span className="font-semibold">
                          -${promocionAplicada.descuentoAplicado.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-slate-800">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${calcularTotal().toLocaleString('es-CO')} COP
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
                        {direcciones.find(d => d.id === direccionSeleccionada)?.direccion}
                      </p>
                    </div>
                  )}

                  {step === 'pago' && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 mb-2">
                        Método de pago:
                      </p>
                      <p className="text-sm text-slate-800">
                        {metodoPago === 'TARJETA' && 'Tarjeta de Crédito/Débito'}
                        {metodoPago === 'PSE' && 'PSE'}
                        {metodoPago === 'CONSIGNACION' && 'Consignación Bancaria'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}