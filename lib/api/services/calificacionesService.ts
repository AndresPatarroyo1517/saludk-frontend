import apiClient from "../client";

export const calificacionesService = {
  calificarMedico: async (data: {
    medico_id: string;
    calificacion: number;
    comentario?: string;
  }) => {
    const response = await apiClient.post('/calificaciones/medico', data);
    return response.data;
  },

  calificarProducto: async (data: {
    producto_id: string;
    calificacion: number;
    comentario?: string;
  }) => {
    const response = await apiClient.post('/calificaciones/producto', data);
    return response.data;
  },

  getCalificacionesGenerales: async (tipo: string) => {
    const data = {
      tipo: tipo // medicos o productos
    };
    const response = await apiClient.get(`/calificaciones/mis-calificaciones`, { params: data });
    return response.data;
  },

};

export default calificacionesService;
