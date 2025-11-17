import apiClient from "../client";
import { User } from "../../store/authStore";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  usuario?: User;
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

export interface PacienteRegister {
  id: string;
  nombres: string;
  apellidos: string;
  numero_identificacion: string;
}

export interface UsuarioRegister {
  id: string;
  email: string;
  activo: boolean;
}

export interface DireccionRegister {
  id: string;
  ciudad: string;
  departamento: string;
}

export interface SolicitudData {
  solicitud_id: string;
  estado: string;
  paciente: PacienteRegister;
  usuario: UsuarioRegister;
  direccion: DireccionRegister;
  fecha_solicitud: string; // ISO 8601 string
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: SolicitudData;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/registro/paciente', data);
    return response.data;
  },

  uploadDocuments: async (solicitudId: number | string, files: File[]) => {
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
    //console.log('Datos:', JSON.stringify(response.data, null, 2));
    return response.data;
  },

  logout: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/login/logout');
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/login/refresh');
    return response.data;
  },

  me: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('/login/me');
    return response.data;
  },

  validacionAutomatica: async (solicitudId: number | string) => {
    const response = await apiClient.post(`/validacion/solicitudes/${solicitudId}/revisar`);
    console.log('Datos:', JSON.stringify(response.data, null, 2));
    return response.data;
  },
};

export default authService;
