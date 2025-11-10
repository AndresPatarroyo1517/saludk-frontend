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
  getSolicitudes: async (estado?: string) => {
    const response = await apiClient.get('/director/solicitudes', {
      params: { estado },
    });
    return response.data;
  },

  getSolicitud: async (id: string) => {
    const response = await apiClient.get(`/director/solicitudes/${id}`);
    return response.data;
  },

  aprobarSolicitud: async (id: string) => {
    const response = await apiClient.post(`/director/solicitudes/${id}/aprobar`);
    return response.data;
  },

  rechazarSolicitud: async (id: string, motivo: string) => {
    const response = await apiClient.post(`/director/solicitudes/${id}/rechazar`, { motivo });
    return response.data;
  },

  devolverSolicitud: async (id: string, motivo: string) => {
    const response = await apiClient.post(`/director/solicitudes/${id}/devolver`, { motivo });
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
