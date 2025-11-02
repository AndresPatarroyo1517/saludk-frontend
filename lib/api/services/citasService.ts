import apiClient from "../client";

export const citasService = {
  getCitas: async () => {
    const response = await apiClient.get('/citas');
    return response.data;
  },

  agendarCita: async (data: {
    medico_id: string;
    fecha: string;
    hora: string;
    modalidad: 'virtual' | 'presencial';
    motivo?: string;
  }) => {
    const response = await apiClient.post('/citas', data);
    return response.data;
  },

  cancelarCita: async (id: string) => {
    const response = await apiClient.delete(`/citas/${id}`);
    return response.data;
  },
};

export default citasService;
