import apiClient from "../client";

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

  getKPIs: async () => {
    const response = await apiClient.get('/director/kpis');
    return response.data;
  },

  validarRiesgos: async (pacienteId: string) => {
    const response = await apiClient.get(`/director/validar-riesgos/${pacienteId}`);
    return response.data;
  },
};

export default directorService;
