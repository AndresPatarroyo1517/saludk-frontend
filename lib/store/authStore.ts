import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string | number; // Puede ser UUID (string) o número
  email: string;
  rol: 'paciente' | 'medico' | 'director_medico' | 'PACIENTE' | 'MEDICO' | 'DIRECTOR_MEDICO';
  activo: boolean;
  paciente_id?: string; // UUID del paciente para operaciones médicas
  datos_personales?: {
    id?: number;
    nombres: string;
    apellidos?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
    telefono?: string;
    fecha_nacimiento?: string;
    genero?: string;
    direcciones?: Array<{
      id?: number;
      direccion_completa: string;
      ciudad: string;
      departamento: string;
      tipo: string;
    }>;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // Nuevo: saber si ya verificamos autenticación
  setAuth: (user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      
      setAuth: (user) => {
        set({ 
          user, 
          isAuthenticated: true,
          isInitialized: true 
        });
      },
      
      clearAuth: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          isInitialized: true // Mantener initialized en true
        });
      },
      
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        })),
      
      setInitialized: (initialized) => {
        set({ isInitialized: initialized });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage = se limpia al cerrar pestaña
      partialize: (state) => ({ 
        // Solo persistir isAuthenticated, no el user completo (seguridad)
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized
      }),
    }
  )
);