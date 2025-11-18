'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Lock } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeCheckoutProps {
  clientSecret: string;
  monto: number;
  montoCOP: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  descripcion?: string;
}

function CheckoutForm({ 
  monto, 
  montoCOP, 
  onSuccess, 
  onError,
  descripcion 
}: Omit<StripeCheckoutProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); // ✅ Nuevo estado

  // ✅ Detectar cuando el PaymentElement está listo
  useEffect(() => {
    if (!elements) return;

    // Esperar a que el elemento esté completamente montado
    const checkReady = async () => {
      const paymentElement = elements.getElement('payment');
      if (paymentElement) {
        setIsReady(true);
      }
    };

    // Intentar después de un pequeño delay
    const timer = setTimeout(checkReady, 500);
    return () => clearTimeout(timer);
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validaciones antes de procesar
    if (!stripe || !elements) {
      return;
    }

    if (!isReady) {
      setErrorMessage('Por favor espera a que se cargue el formulario de pago');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/mis-suscripciones`,
        },
        redirect: 'if_required', // ✅ No redirigir si no es necesario
      });

      if (error) {
        const message = error.message || 'Error al procesar el pago';
        setErrorMessage(message);
        onError(message);
        } else if (paymentIntent) {
        
        if (paymentIntent.status === 'succeeded') {
          onSuccess();
        } else if (paymentIntent.status === 'processing') {
          setErrorMessage('Tu pago está siendo procesado. Te notificaremos cuando esté completo.');
        } else if (paymentIntent.status === 'requires_payment_method') {
          setErrorMessage('El pago fue rechazado. Por favor intenta con otro método de pago.');
        } else {
          setErrorMessage(`Estado del pago: ${paymentIntent.status}`);
        }
      }
    } catch (err: any) {
      const message = err.message || 'Error inesperado al procesar el pago';
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-blue-100 shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Información de Pago
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="font-semibold">Pago seguro</span>
            </div>
          </div>
          {descripcion && (
            <CardDescription className="text-base">{descripcion}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen del monto */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">Monto en COP:</span>
              <span className="text-2xl font-bold text-slate-800">
                ${montoCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
              <span className="text-slate-600 text-sm">Monto a cobrar (USD):</span>
              <span className="text-lg font-semibold text-blue-600">
                ${monto.toFixed(2)} USD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              La conversión se realiza automáticamente usando la tasa actual
            </p>
          </div>

          {/* Stripe Payment Element */}
          <div className="space-y-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
              }}
              onReady={() => {
                setIsReady(true);
              }}
              onLoadError={(error) => {
                setErrorMessage('Error al cargar el formulario de pago. Verifica la consola.');
              }}
            />
          </div>

          {/* ✅ Indicador de carga */}
          {!isReady && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando formulario de pago...</span>
            </div>
          )}

          {errorMessage && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="ml-2">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Botón de pago */}
          <Button
            type="submit"
            disabled={!stripe || !isReady || isProcessing} // ✅ Deshabilitar hasta que esté listo
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-[1.02]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Procesando pago...
              </>
            ) : !isReady ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Preparando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Pagar ${monto.toFixed(2)} USD
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Lock className="w-3 h-3 text-green-600" />
            <span>Pago procesado de forma segura por Stripe</span>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  const [elementsOptions, setElementsOptions] = useState<StripeElementsOptions | null>(null);

  if (!props.clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error: No se pudo inicializar el pago. El clientSecret no está disponible.
        </AlertDescription>
      </Alert>
    );
  }

  // Validar formato del clientSecret
  if (!props.clientSecret.startsWith('pi_') && !props.clientSecret.startsWith('seti_')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error: El clientSecret tiene un formato inválido. Por favor contacta soporte.
        </AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    if (props.clientSecret) {
      setElementsOptions({
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1e293b',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
        locale: 'es',
      });
    }
  }, [props.clientSecret]);

  if (!elementsOptions) {
    return (
      <Card className="border-slate-200">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-slate-600">Cargando plataforma de pagos...</span>
          <div className="text-xs text-slate-400 text-center">
            <p>clientSecret: {props.clientSecret ? '✅' : '❌'}</p>
            <p>API Key: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅' : '❌'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <CheckoutForm {...props} />
    </Elements>
  );
}