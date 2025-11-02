import apiClient from "../client";

export const productosService = {
  getProductos: async (filtros?: { categoria?: string; busqueda?: string }) => {
    const response = await apiClient.get('/productos', { params: filtros });
    return response.data;
  },

  getProducto: async (id: string) => {
    const response = await apiClient.get(`/productos/${id}`);
    return response.data;
  },

  getCategorias: async () => {
    const response = await apiClient.get('/productos/categorias');
    return response.data;
  },
};

export default productosService;
