import { useState } from 'react';
import pagoService, { 
  CrearSuscripcionRequest, 
  ProcesarPagoSuscripcionRequest,
  ProcesarCompraRequest 
} from '@/lib/api/services/pagoService';
import { toast } from 'sonner';

export function usePago() {
  const [loading, setLoading] = useState(false);
  const [suscripcionData, setSuscripcionData] = useState<any>(null);
  const [pagoData, setPagoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ PASO 1: Crear suscripción (sin método de pago)
  const crearSuscripcion = async (planId: string, metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pagoService.crearSuscripcion({ planId, metodoPago });
      setSuscripcionData(response.data);
      toast.success('Suscripción creada exitosamente');
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      toast.error('Error al crear suscripción', { description: errorMsg });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ PASO 2: Procesar pago de suscripción (con método elegido)
  const procesarPagoSuscripcion = async (data: ProcesarPagoSuscripcionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pagoService.procesarPagoSuscripcion(data);
      setPagoData(response.data);
      
      // Mensajes según método de pago
      if (data.metodoPago === 'TARJETA_CREDITO') {
        toast.success('Orden de pago lista', { 
          description: 'Completa el pago con tu tarjeta' 
        });
      } else if (data.metodoPago === 'PASARELA') {
        toast.success('Referencia PSE generada', { 
          description: 'Procede con el pago en tu banco' 
        });
      } else if (data.metodoPago === 'CONSIGNACION') {
        toast.success('Instrucciones de consignación listas', { 
          description: 'Revisa los datos bancarios' 
        });
      }
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      toast.error('Error al procesar pago', { description: errorMsg });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const procesarCompra = async (data: ProcesarCompraRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pagoService.procesarCompra(data);
      setPagoData(response.data);
      
      if (response.data.descuentoAplicado > 0) {
        toast.success('¡Descuento aplicado!', {
          description: `Ahorras $${response.data.descuentoAplicado.toLocaleString('es-CO')} COP`,
        });
      } else {
        toast.success('Orden creada exitosamente');
      }
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      toast.error('Error al procesar compra', { description: errorMsg });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const simularPago = async (ordenId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pagoService.simularPagoExitoso(ordenId);
      toast.success('Pago simulado exitosamente');
      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      toast.error('Error al simular pago', { description: errorMsg });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuscripcionData(null);
    setPagoData(null);
    setError(null);
    setLoading(false);
  };

  return {
    loading,
    suscripcionData,
    pagoData,
    error,
    crearSuscripcion,
    procesarPagoSuscripcion,
    procesarCompra,
    simularPago,
    reset,
  };
}