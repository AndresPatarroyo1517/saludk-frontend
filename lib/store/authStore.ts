import { create } from 'zustand';

export interface User {
  id: number;
  userId: number;
  email: string;
  rol: 'paciente' | 'medico' | 'director_medico';
  activo: boolean;
  nombre?: string;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
  plan?: 'basico' | 'completo' | null;
  ultimo_acceso?: string;
  datos_personales?: {
    nombres: string;
    apellidos?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
    telefono?: string;
    tipo_sangre?: string;
    fecha_nacimiento?: string;
    genero?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setAuth: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },
  
  clearAuth: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  
  updateUser: (updatedUser) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : null
    })),
  
  setLoading: (loading) => set({ isLoading: loading })
}));