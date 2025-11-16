import { useState } from 'react';
import pagoService, { CrearSuscripcionRequest, ProcesarCompraRequest } from '@/lib/api/services/pagoService';
import { toast } from 'sonner';

export function usePago() {
  const [loading, setLoading] = useState(false);
  const [ordenData, setOrdenData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const crearSuscripcion = async (data: CrearSuscripcionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pagoService.crearSuscripcion(data);
      setOrdenData(response.data);
      toast.success('Orden creada exitosamente');
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      toast.error('Error al crear orden', { description: errorMsg });
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
      setOrdenData(response.data);
      
      // Si hay descuento, mostrar notificación especial
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
    setOrdenData(null);
    setError(null);
    setLoading(false);
  };

  return {
    loading,
    ordenData,
    error,
    crearSuscripcion,
    procesarCompra,
    simularPago,
    reset,
  };
}