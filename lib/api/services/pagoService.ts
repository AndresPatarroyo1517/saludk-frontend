import apiClient from "../client";

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

// ✅ Request para CREAR suscripción (sin método de pago aún)
export interface CrearSuscripcionRequest {
    planId: string;
    metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
}

// ✅ Response al crear suscripción (solo info básica)
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

// ✅ Request para PROCESAR pago (con método elegido)
export interface ProcesarPagoSuscripcionRequest {
    suscripcionId: string;
    metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
}

// ✅ Response al procesar pago (con datos según método)
export interface ProcesarPagoSuscripcionResponse {
    success: boolean;
    message?: string;
    data: {
        data: {
            ordenPago: {
                id: string;
                estado: string;
                monto: number;
                metodo_pago: string;
            }; stripe?: { clientSecret: string; paymentIntentId: string; status: string; amount_usd: number; amount_cop: number; } | undefined; pse?: { referencia: string; mensaje: string; } | undefined; consignacion?: { referencia: string; banco: string; tipo_cuenta: string; numero_cuenta: string; titular: string; nit: string; monto: number; instrucciones: string; } | undefined;
        };
        ordenPago: {
            id: string;
            estado: string;
            monto: number;
            metodo_pago: string;
        };
        stripe?: {
            clientSecret: string;
            paymentIntentId: string;
            status: string;
            amount_usd: number;
            amount_cop: number;
        };
        pse?: {
            referencia: string;
            mensaje: string;
        };
        consignacion?: {
            referencia: string;
            banco: string;
            tipo_cuenta: string;
            numero_cuenta: string;
            titular: string;
            nit: string;
            monto: number;
            instrucciones: string;
        };
    };
}

export interface ProcesarCompraRequest {
    items: Array<{ productId: string; cantidad: number }>;
    metodoPago: 'TARJETA_CREDITO' | 'PASARELA' | 'CONSIGNACION';
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
    // ✅ PASO 1: Crear suscripción (sin método de pago)
    crearSuscripcion: async (data: CrearSuscripcionRequest): Promise<CrearSuscripcionResponse> => {
        const response = await apiClient.post('/suscripcion', data);
        return response.data;
    },

    // ✅ PASO 2: Procesar pago de suscripción (con método elegido)
    procesarPagoSuscripcion: async (
        data: ProcesarPagoSuscripcionRequest
    ): Promise<ProcesarPagoSuscripcionResponse> => {
        const response = await apiClient.post('/suscripcion/pago', data);
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
    subirComprobante: async (ordenId: string) => {
        const response = await apiClient.post(`/pagos/subir-comprobante/${ordenId}`);
        return response.data;
    },

    confirmarCompra: async (compraId: string) => {
        const response = await apiClient.post(`/productos/compra/${compraId}/confirmar`);
        return response.data;
    },


    // Simular pago PSE (desarrollo)
    simularPSE: async (ordenId: string) => {
        const response = await apiClient.post(`/pagos/simular-pse/${ordenId}`);
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