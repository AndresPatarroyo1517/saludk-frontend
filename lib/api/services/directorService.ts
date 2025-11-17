import apiClient from "../client";

export interface KpisResponse {
  citasAgendadas: number;
  resumenCitas: {
    total: number;
    agendadas: number;
    completadas: number;
    canceladas: number;
  };
  ingresos: number;
  califMedicos: number;
  califProductos: number;
  pacientes: {
    total: number;
    premium: number;
    estandar: number;
  };
  solicitudes: {
    PENDIENTE: number;
    APROBADA: number;
    RECHAZADA: number;
    DEVUELTA: number;
  };
}

export const directorService = {
  getSolicitudesAprovadas: async (estado?: string) => {
    const response = await apiClient.get('/validacion/solicitudes/aprobadas');
    return response.data;
  },

  getSolicitudesPendientes: async () => {
    const response = await apiClient.get('/validacion/solicitudes/pendientes-con-errores');
    return response.data;
  },

  getDocumentosSolicitud: async (id: string) => {
    const response = await apiClient.get(`/registro/solicitudes/${id}/documentos`);
    //console.log('Datos:', JSON.stringify(response.data, null, 2));
    return response.data;
  },

  aprobarSolicitud: async (id: string) => {
    const response = await apiClient.post(`/validacion/solicitudes/${id}/aprobar`);
    return response.data;
  },

  rechazarSolicitud: async (id: string, motivo_decision: string) => {
    const response = await apiClient.post(`/validacion/solicitudes/${id}/rechazar`, { motivo_decision });
    return response.data;
  },

  devolverSolicitud: async (id: string, motivo_decision: string) => {
    const response = await apiClient.post(`/validacion/solicitudes/${id}/devolver`, { motivo_decision });
    return response.data;
  },

  getKPIs: async (rango: string = 'hoy'): Promise<KpisResponse> => {
    const res = await apiClient.get('/metricas/kpi', {
      params: { rango },
      withCredentials: true,
    });
    return res.data.data
  },

  validarRiesgos: async (pacienteId: string) => {
    const response = await apiClient.get(`/director/validar-riesgos/${pacienteId}`);
    return response.data;
  },
};

export default directorService;
