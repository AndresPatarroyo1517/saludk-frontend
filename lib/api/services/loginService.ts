import apiClient from "../client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  usuario: {
    email: string;
    password: string;
  };
  paciente: {
    nombres: string;
    apellidos: string;
    tipo_identificacion: string;
    numero_identificacion: string;
    telefono: string;
    tipo_sangre: string;
    alergias: string[];
    fecha_nacimiento: string;
    genero: string;
  };
  direccion: {
    tipo: string;
    direccion_completa: string;
    ciudad: string;
    departamento: string;
    es_principal: boolean;
  };
}

export interface RegisterResponse {
  message: string;
  solicitud_id: number;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post<RegisterResponse>('/registro/paciente', data, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  uploadDocuments: async (solicitudId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('documento', file);
    });

    const response = await apiClient.post(
      `/registro/solicitudes/${solicitudId}/documentos`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/login/logout');
    localStorage.removeItem('user');
  },

  refreshToken: async () => {
    const response = await apiClient.post('/login/refresh');
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get('/login/me');
    return response.data;
  },
};

export default authService;