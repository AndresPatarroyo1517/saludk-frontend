import apiClient from "../client";

// ==================== INTERFACES BÁSICAS ====================
export interface OrdenPago {
  id: string;
  tipo_orden: 'SUSCRIPCION' | 'COMPRA' | 'CITA';
  paciente_id: string;
  monto: number;
  metodo_pago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION' | null;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO' | 'CANCELADO';
  referencia_transaccion?: string;
  fecha_creacion: string;
}

export interface Plan {
  id: string;
  nombre: string;
  codigo: string;
  precio_mensual: string;
  duracion_meses: string;
}

export interface Suscripcion {
  id: string;
  paciente_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'PAUSADA';
  auto_renovable: boolean;
  consultas_virtuales_usadas: string;
  consultas_presenciales_usadas: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  plan: Plan;
}

// ==================== INTERFACES DE STRIPE ====================
export interface StripePaymentData {
  clientSecret: string;
  paymentIntentId: string;
  status: string;
  amount_usd: number;
  amount_cop: number;
}

// ==================== INTERFACES DE PSE ====================
export interface PSEPaymentData {
  referencia: string;
  mensaje: string;
}

// ==================== INTERFACES DE CONSIGNACIÓN ====================
export interface ConsignacionPaymentData {
  referencia: string;
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  titular: string;
  nit: string;
  monto: number;
  instrucciones: string;
}

// ==================== INTERFACES DE COMPRA ====================
export interface ItemCompra {
  productId: string;
  cantidad: number;
}

export interface Compra {
  id: string;
  paciente_id: string;
  estado: string;
  total: number;
  items: any[];
  fecha_creacion: string;
}

// ==================== REQUEST INTERFACES ====================
export interface CrearSuscripcionRequest {
  planId: string;
  metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
}

export interface ProcesarPagoSuscripcionRequest {
  suscripcionId: string;
  metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
}

export interface ProcesarCompraRequest {
  items: ItemCompra[];
  metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
  direccion_entrega_id: string;
  codigoPromocion?: string;
}

export interface CambiarPlanRequest {
  nuevoPlanId: string;
  metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
}

// ==================== RESPONSE INTERFACES ====================
// ✅ Respuesta crear suscripción
export interface CrearSuscripcionResponse {
  success: boolean;
  message: string;
  data: {
    suscripcion: {
      id: string;
      plan_id: string;
      plan_nombre: string;
      plan_codigo: string;
      estado: string;
      fecha_inicio: string;
      fecha_vencimiento: string;
      monto: number;
    };
    ordenPago: {
      id: string;
      estado: string;
      monto: number;
      metodo_pago: string;
    };
  };
}

// ✅ Respuesta procesar pago suscripción
export interface ProcesarPagoSuscripcionResponse {
  success: boolean;
  message?: string;
  data: {
    ordenPago: {
      id: string;
      estado: string;
      monto: number;
      metodo_pago: string;
    };
    stripe?: StripePaymentData;
    pse?: PSEPaymentData;
    consignacion?: ConsignacionPaymentData;
  };
}

// ✅ Respuesta procesar compra
export interface ProcesarCompraResponse {
  success: boolean;
  message: string;
  data: {
    compra: Compra;
    ordenPago: OrdenPago;
    montoFinal: number;
    descuentoAplicado: number;
    promocion?: any;
    stripe?: StripePaymentData;
    pse?: PSEPaymentData;
    consignacion?: ConsignacionPaymentData;
  };
}

// ✅ Respuesta obtener suscripciones
export interface ObtenerMisSuscripcionesResponse {
  success: boolean;
  data: {
    pacienteId: string;
    total: number;
    suscripciones: Suscripcion[];
  };
}

// ✅ Respuesta cambiar plan
export interface CambiarPlanResponse {
  success: boolean;
  message: string;
  data: {
    suscripcionAnterior: {
      id: string;
      plan: string;
      estado: string;
    };
    nuevaSuscripcion: {
      id: string;
      plan_id: string;
      plan_nombre: string;
      estado: string;
      fecha_inicio: string;
      fecha_vencimiento: string;
    };
    ordenPago: {
      id: string;
      monto: number;
      estado: string;
    };
  };
}

// ✅ Respuesta obtener compras
export interface ObtenerMisComprasResponse {
  success: boolean;
  data: {
    compras: Compra[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ✅ Respuesta obtener orden
export interface ObtenerOrdenResponse {
  success: boolean;
  orden: OrdenPago;
}

// ✅ Respuesta confirmar pago manual
export interface ConfirmarPagoManualResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ==================== SERVICIO ====================
export const pagoService = {
  // ==================== SUSCRIPCIONES ====================
  
  /**
   * ✅ PASO 1: Crear suscripción (sin procesar pago aún)
   */
  crearSuscripcion: async (data: CrearSuscripcionRequest): Promise<CrearSuscripcionResponse> => {
    const response = await apiClient.post('/suscripcion', data);
    return response.data;
  },

  /**
   * ✅ PASO 2: Procesar pago de suscripción (con método elegido)
   */
  procesarPagoSuscripcion: async (
    data: ProcesarPagoSuscripcionRequest
  ): Promise<ProcesarPagoSuscripcionResponse> => {
    const response = await apiClient.post('/suscripcion/pago', data);
    return response.data;
  },

  /**
   * ✅ Obtener suscripciones del usuario
   */
  obtenerMisSuscripciones: async (): Promise<ObtenerMisSuscripcionesResponse> => {
    const response = await apiClient.get('/suscripcion/mis-suscripciones');
    return response.data;
  },

  /**
   * ✅ Cambiar plan de suscripción
   */
  cambiarPlan: async (data: CambiarPlanRequest): Promise<CambiarPlanResponse> => {
    const response = await apiClient.post('/suscripcion/cambiar-plan', data);
    return response.data;
  },

  // ==================== COMPRAS ====================
  
  /**
   * ✅ Procesar compra de productos
   */
  procesarCompra: async (data: ProcesarCompraRequest): Promise<ProcesarCompraResponse> => {
    const response = await apiClient.post('/productos/compra', data);
    return response.data;
  },

  /**
   * ✅ Obtener compras del usuario
   */
  obtenerMisCompras: async (params?: {
    estado?: string;
    limit?: number;
    offset?: number;
  }): Promise<ObtenerMisComprasResponse> => {
    const response = await apiClient.get('/productos/mis-compras', { params });
    return response.data;
  },

  /**
   * ✅ Confirmar compra
   */
  confirmarCompra: async (compraId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/productos/compra/${compraId}/confirmar`);
    return response.data;
  },

  // ==================== PAGOS ====================
  
  /**
   * ✅ Obtener orden de pago por ID
   */
  obtenerOrden: async (ordenId: string): Promise<ObtenerOrdenResponse> => {
    const response = await apiClient.get(`/pagos/orden/${ordenId}`);
    return response.data;
  },

  /**
   * ✅ Obtener órdenes del usuario
   */
  obtenerMisOrdenes: async (estado?: string): Promise<{ success: boolean; data: OrdenPago[] }> => {
    const params = estado ? { estado } : {};
    const response = await apiClient.get('/pagos/mis-ordenes', { params });
    return response.data;
  },

  /**
   * ✅ Confirmar pago manual (PSE/Consignación)
   */
  confirmarPagoManual: async (ordenId: string, datos: any): Promise<ConfirmarPagoManualResponse> => {
    const response = await apiClient.post(`/pagos/confirmar/${ordenId}`, datos);
    return response.data;
  },

  /**
   * ✅ Subir comprobante de consignación
   */
  subirComprobante: async (ordenId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/pagos/subir-comprobante/${ordenId}`);
    return response.data;
  },

  // ==================== SIMULACIONES (SOLO DESARROLLO) ====================
  
  /**
   * 🚧 Simular pago PSE (solo desarrollo)
   */
  simularPSE: async (ordenId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/pagos/simular-pse/${ordenId}`);
    return response.data;
  },

  /**
   * 🚧 Simular pago exitoso (solo desarrollo)
   */
  simularPagoExitoso: async (ordenId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/pagos/simular-exito/${ordenId}`);
    return response.data;
  },
};

export default pagoService;