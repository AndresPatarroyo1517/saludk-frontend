import apiClient from "../client";

export const citasService = {
  // Obtener disponibilidades del médico
  getDisponibilidad: async (medicoId: string, params: { fecha_inicio: string; fecha_fin: string; modalidad?: string; duracion_cita?: number; }) => {
    const response = await apiClient.get(`/citas/disponibilidad/${medicoId}`, { params });
    return response.data;
  },

  // Validar un slot puntual
  validarSlot: async (medicoId: string, payload: { fecha_hora: string; duracion_minutos?: number; }) => {
    const response = await apiClient.post(`/citas/disponibilidad/${medicoId}/validar`, payload);
    return response.data;
  },

  // Crear una nueva cita (backend espera medico_id, paciente_id, fecha_hora, modalidad, motivo_consulta?, duracion_minutos?)
  crearCita: async (data: {
    medico_id: string;
    paciente_id: string;
    fecha_hora: string;
    modalidad: 'PRESENCIAL' | 'VIRTUAL' | string;
    motivo_consulta?: string;
    duracion_minutos?: number;
    usuario_id?: string; // opcional: enviar usuario_id como respaldo
  }) => {
    const response = await apiClient.post('/citas', data);
    return response.data;
  },

  // Obtener citas de un paciente
  getCitasPaciente: async (pacienteId: string, params?: { estado?: string; fecha_desde?: string; fecha_hasta?: string; modalidad?: string; ordenar_por?: string; }) => {
    const response = await apiClient.get(`/citas/paciente/${pacienteId}`, { params });
    return response.data;
  },

  // Intentar obtener citas por usuario si la ruta por paciente no existe o está vacía
  getCitasPorUsuario: async (usuarioId: string, params?: Record<string, any>) => {
    const tryPaths = [
      (id: string) => `/citas/usuario/${id}`,
      (id: string) => `/citas/paciente/usuario/${id}`,
      (id: string) => `/citas?usuario_id=${id}`,
      (id: string) => `/citas?paciente_id=${id}`,
      (id: string) => `/citas/usuario/${id}/citas`
    ];

    for (const p of tryPaths) {
      try {
        const path = typeof p === 'function' ? p(usuarioId) : p;
        const resp = await apiClient.get(path, { params });
        const data = resp.data;
        if (!data) continue;
        // posibles estructuras
        if (Array.isArray(data)) return data;
        if (data.citas && Array.isArray(data.citas)) return data.citas;
        if (data.data && Array.isArray(data.data)) return data.data;
        if (data.data && Array.isArray(data.data.citas)) return data.data.citas;
        if (data.items && Array.isArray(data.items)) return data.items;
        // si responde con objeto que contiene lista en algún key
        const maybeArray = Object.values(data).find(v => Array.isArray(v));
        if (Array.isArray(maybeArray)) return maybeArray as any[];
      } catch (err) {
        // ignorar y probar siguiente path
      }
    }

    // si ninguno funcionó devolver array vacío para evitar romper la UI
    return [];
  },

  // Cancelar cita (DELETE /citas/:citaId/cancelar) — el endpoint solo necesita el ID
  cancelarCita: async (citaId: string) => {
    try {
      const response = await apiClient.delete(`/citas/${citaId}/cancelar`);
      return response.data;
    } catch (err: any) {
      try {
        console.error('[citasService.cancelarCita] Axios error status: - citasService.ts:77', err?.response?.status);
        console.error('[citasService.cancelarCita] Axios error data: - citasService.ts:78', err?.response?.data);
        console.error('[citasService.cancelarCita] Axios error headers: - citasService.ts:79', err?.response?.headers);
      } catch (e) {
        console.error('[citasService.cancelarCita] Error al loggear respuesta del servidor - citasService.ts:81', e);
      }
      throw err;
    }
  }
,

  // Reprogramar una cita existente
  reprogramarCita: async (citaId: string, data: {
    medico_id: string;
    paciente_id: string;
    fecha_hora: string;
    modalidad: 'PRESENCIAL' | 'VIRTUAL' | string;
    motivo_consulta?: string;
    duracion_minutos?: number;
    usuario_id?: string;
  }) => {
    // Backend: PUT /citas/:citaId (editar una cita existente)
    const response = await apiClient.put(`/citas/${citaId}`, data);
    return response.data;
  }
};

export default citasService;
