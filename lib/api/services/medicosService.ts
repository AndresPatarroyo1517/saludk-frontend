import apiClient from "../client";

export interface CitaAgendada{
  id: string;
  fecha: string;        // ISO string
  estado: "AGENDADA" | "CONFIRMADA" | "CANCELADA" | string;
  modalidad: "VIRTUAL" | "PRESENCIAL" | string;
  paciente: string;
}

export interface EstadisticasMedicoData {
  medico_id: string;
  total_hoy: {
    AGENDADA: number;
    CONFIRMADA: number;
  };
  total_mes: {
    AGENDADA: number;
    CONFIRMADA: number;
  };
  total_mes_completadas: number;
  hoy: number;
  proximas_citas_hoy: CitaAgendada[];
  citas_mes: CitaAgendada[];
}

export interface EstadisticasMedicoResponse {
  success: boolean;
  data: EstadisticasMedicoData;
}

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

  getEstadisticasMedico: async (medicoId: string | number): Promise<EstadisticasMedicoResponse> => {
    console.log(`ID MEDICO: ${medicoId}`);
    const response = await apiClient.get(`/citas/medico/${medicoId}/estadisticas`);
    console.log('Datos:', JSON.stringify(response.data, null, 2));
    return response.data;
  },
};

export default medicosService;
