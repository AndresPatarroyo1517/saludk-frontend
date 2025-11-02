import apiClient from "../client";

export const medicosService = {
  getMedicos: async (filtros?: {
    especialidad?: string;
    localidad?: string;
    disponibilidad?: string;
  }) => {
    const response = await apiClient.get('/medicos', { params: filtros });
    return response.data;
  },

  getMedico: async (id: string) => {
    const response = await apiClient.get(`/medicos/${id}`);
    return response.data;
  },

  getEspecialidades: async () => {
    const response = await apiClient.get('/medicos/especialidades');
    return response.data;
  },
};

export default medicosService;
