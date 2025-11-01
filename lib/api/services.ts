import apiClient from './client';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'paciente' | 'director_medico' | 'admin';
  telefono?: string;
  direccion?: string;
  plan?: 'basico' | 'completo' | null;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  medicamentos_actuales?: string;
  documentos?: File[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Plan {
  id: string;
  nombre: 'basico' | 'completo';
  precio: number;
  descripcion: string;
  beneficios: string[];
}

export interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  localidad: string;
  costo_consulta: number;
  disponibilidad: string[];
  calificacion: number;
  foto?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  stock: number;
  imagen?: string;
  calificacion?: number;
}

export interface Cita {
  id: string;
  medico_id: string;
  paciente_id: string;
  fecha: string;
  hora: string;
  modalidad: 'virtual' | 'presencial';
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  motivo?: string;
}

export interface HistorialMedico {
  id: string;
  paciente_id: string;
  fecha: string;
  medico: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos: string[];
  examenes?: string[];
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: FormData) => {
    const response = await apiClient.post('/auth/register', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

export const planesService = {
  getPlanes: async () => {
    const response = await apiClient.get('/planes');
    return response.data;
  },

  suscribirPlan: async (planId: string) => {
    const response = await apiClient.post('/planes/suscribir', { planId });
    return response.data;
  },
};

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
};

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
    const response = await apiClient.post(`/director/solicitudes/${id}/rechazar`, {
      motivo,
    });
    return response.data;
  },

  devolverSolicitud: async (id: string, motivo: string) => {
    const response = await apiClient.post(`/director/solicitudes/${id}/devolver`, {
      motivo,
    });
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

export const stripeService = {
  createCheckoutSession: async (items: {
    type: 'plan' | 'productos';
    planId?: string;
    productos?: { id: string; cantidad: number }[];
  }) => {
    const response = await apiClient.post('/stripe/create-checkout-session', items);
    return response.data;
  },
};
