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

export interface RegistroMedicoRequest {
  usuario: {
    email: string;
    password: string;
  };
  medico: {
    nombres: string;
    apellidos: string;
    numero_identificacion: string;
    especialidad: string;
    registro_medico: string;
    telefono: string;
    costo_consulta_presencial: number;
    costo_consulta_virtual: number;
    localidad: string;
    disponible: boolean;
  };
}

export interface UserMedicoData {
  usuario: {
    id: string;
    email: string;
    rol: string;
    activo: boolean;
  };
  medico: {
    id: string;
    nombres: string;
    apellidos: string;
    especialidad: string;
    registro_medico: string;
    calificacion_promedio: number;
    disponible: boolean;
  };
}

export interface RegistroResponse {
  success: boolean;
  message: string;
  data: UserMedicoData;
}

export const directorService = {
  getSolicitudesAprovadas: async (estado?: string) => {
    const response = await apiClient.get('/validacion/solicitudes/aprobadas');
    return response.data;
  },

  getSolicitudesPendientes: async () => {
    const response = await apiClient.get('/validacion/solicitudes/pendientes-con-errores');
    return response.data;
  },

  getDocumentosSolicitud: async (id: string) => {
    const response = await apiClient.get(`/registro/solicitudes/${id}/documentos`);
    return response.data;
  },

  aprobarSolicitud: async (id: string) => {
    const response = await apiClient.post(`/validacion/solicitudes/${id}/aprobar`);
    return response.data;
  },

  rechazarSolicitud: async (id: string, motivo_decision: string) => {
    const response = await apiClient.post(`/validacion/solicitudes/${id}/rechazar`, { motivo_decision });
    return response.data;
  },

  devolverSolicitud: async (id: string, motivo_decision: string) => {
    const response = await apiClient.post(`/validacion/solicitudes/${id}/devolver`, { motivo_decision });
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

  register: async (data: RegistroMedicoRequest): Promise<RegistroResponse> => {
    const response = await apiClient.post<RegistroResponse>('/registro/medico', data);
    return response.data;
  },

  actualizarMedico: async (userId: string, data:any) => {
    const response = await apiClient.put(`/medicos/modificar/${userId}`, data);
    return response.data;
  },

  desactivarMedico: async (userId: string) => {
    const response = await apiClient.put(`/medicos/desactivar/${userId}`);
    return response.data;
  },
};

export default directorService;
