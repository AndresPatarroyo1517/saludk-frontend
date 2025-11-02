import apiClient from "../client";

export const historialService = {
  getHistorial: async () => {
    const response = await apiClient.get('/historial');
    return response.data;
  },

  getHistorialDetalle: async (id: string) => {
    const response = await apiClient.get(`/historial/${id}`);
    return response.data;
  },
};

export default historialService;
