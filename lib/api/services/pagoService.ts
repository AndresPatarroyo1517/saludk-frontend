import apiClient from "../client";

export interface OrdenPago {
  id: string;
  tipo_orden: 'SUSCRIPCION' | 'COMPRA' | 'CITA';
  paciente_id: string;
  monto: number;
  metodo_pago: 'TARJETA' | 'PASARELA' | 'CONSIGNACION';
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO' | 'CANCELADO';
  referencia_transaccion?: string;
  fecha_creacion: string;
}

export interface CrearSuscripcionRequest {
  planId: string;
  metodoPago: 'TARJETA' | 'PSE' | 'CONSIGNACION';
}

export interface CrearSuscripcionResponse {
  success: boolean;
  message: string;
  data: {
    suscripcion: any;
    ordenPago: OrdenPago;
    stripe?: {
      id: string;
      client_secret: string;
      status: string;
      amount_usd: number;
      amount_cop: number;
    };
    pse?: {
      referencia: string;
      mensaje: string;
    };
    consignacion?: {
      mensaje: string;
      banco: string;
      numeroCuenta: string;
      monto: number;
      codigoReferencia: string;
      nota: string;
    };
  };
}

export interface ProcesarCompraRequest {
  items: Array<{ productId: string; cantidad: number }>;
  metodoPago: 'TARJETA' | 'PSE' | 'CONSIGNACION';
  direccion_entrega_id: string;
  codigoPromocion?: string;
}

export interface ProcesarCompraResponse {
  success: boolean;
  message: string;
  data: {
    compra: any;
    ordenPago: OrdenPago;
    montoFinal: number;
    descuentoAplicado: number;
    promocion?: any;
    stripe?: {
      id: string;
      client_secret: string;
      status: string;
      amount_usd: number;
      amount_cop: number;
    };
    pse?: {
      referencia: string;
      mensaje: string;
    };
    consignacion?: {
      mensaje: string;
      banco: string;
      numeroCuenta: string;
      monto: number;
      codigoReferencia: string;
      nota: string;
    };
  };
}

export const pagoService = {
  // Crear suscripción con orden de pago
  crearSuscripcion: async (data: CrearSuscripcionRequest): Promise<CrearSuscripcionResponse> => {
    const response = await apiClient.post('/suscripcion', data);
    return response.data;
  },

  // Procesar compra de productos
  procesarCompra: async (data: ProcesarCompraRequest): Promise<ProcesarCompraResponse> => {
    const response = await apiClient.post('/productos/compra', data);
    return response.data;
  },

  // Obtener orden de pago por ID
  obtenerOrden: async (ordenId: string): Promise<{ success: boolean; orden: OrdenPago }> => {
    const response = await apiClient.get(`/pagos/orden/${ordenId}`);
    return response.data;
  },

  // Confirmar pago manual (PSE/Consignación)
  confirmarPagoManual: async (ordenId: string, datos: any) => {
    const response = await apiClient.post(`/pagos/confirmar/${ordenId}`, datos);
    return response.data;
  },

  // Subir comprobante de consignación
  subirComprobante: async (ordenId: string, comprobanteUrl: string) => {
    const response = await apiClient.post(`/pagos/subir-comprobante/${ordenId}`, {
      comprobanteUrl
    });
    return response.data;
  },

  // Simular pago PSE (desarrollo)
  simularPSE: async (ordenId: string, exito: boolean = true) => {
    const response = await apiClient.post(`/pagos/simular-pse/${ordenId}`, { exito });
    return response.data;
  },

  // Simular pago exitoso (desarrollo)
  simularPagoExitoso: async (ordenId: string) => {
    const response = await apiClient.post(`/pagos/simular-exito/${ordenId}`);
    return response.data;
  },

  // Obtener mis órdenes
  obtenerMisOrdenes: async (estado?: string) => {
    const params = estado ? { estado } : {};
    const response = await apiClient.get('/pagos/mis-ordenes', { params });
    return response.data;
  },

  // Obtener mis suscripciones
  obtenerMisSuscripciones: async () => {
    const response = await apiClient.get('/suscripcion/mis-suscripciones');
    return response.data;
  },

  // Obtener mis compras
  obtenerMisCompras: async (params?: { estado?: string; limit?: number; offset?: number }) => {
    const response = await apiClient.get('/productos/mis-compras', { params });
    return response.data;
  },
};

export default pagoService;