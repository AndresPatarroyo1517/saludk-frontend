import apiClient from "../client";

export const comprasService = {
  crearOrden: async (items: { producto_id: string; cantidad: number }[]) => {
    const response = await apiClient.post('/compras', { items });
    return response.data;
  },

  getOrdenes: async () => {
    const response = await apiClient.get('/compras');
    return response.data;
  },
};

export default comprasService;
