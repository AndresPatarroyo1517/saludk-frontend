import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// INTERFACES COMPLETAS
// ============================================
export interface Direccion {
  id: string;
  direccion_completa: string;
  ciudad: string;
  departamento: string;
  tipo: string;
}

export interface HistorialMedico {
  id: string;
  enfermedades_cronicas: string[];
  cirugias_previas: string[];
  medicamentos_actuales: string[];
  ultima_actualizacion: string;
}

export interface Medico {
  id: string;
  nombre_completo: string;
  especialidad: string;
}

export interface Cita {
  id: string;
  fecha_hora: string;
  modalidad: string;
  estado: string;
  motivo_consulta: string | null;
  enlace_virtual: string | null;
  costo_pagado: number | null;
  medico: Medico | null;
}

export interface Plan {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  precio_mensual: number;
  duracion_meses: number;
  beneficios: Record<string, any>;
  descuento_productos: number;
}

export interface ConsultasInfo {
  usadas: number;
  incluidas: number;
  disponibles: number;
}

export interface PlanActivo {
  suscripcion_id: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: string;
  auto_renovable: boolean;
  consultas_virtuales: ConsultasInfo;
  consultas_presenciales: ConsultasInfo;
  plan: Plan | null;
}

export interface OrdenPago {
  id: string;
  tipo_orden: string;
  monto: number;
  metodo_pago: string;
  estado: string;
  fecha_creacion: string;
  fecha_pago: string | null;
  referencia_transaccion: string | null;
  comprobante_url: string | null;
}

export interface DatosPersonales {
  id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  genero: string | null;
  tipo_identificacion: string;
  numero_identificacion: string;
  tipo_sangre: string | null;
  alergias: string[];
  direcciones: Direccion[];
}

export interface User {
  id: string;
  email: string;
  rol: 'paciente' | 'medico' | 'admin';
  activo: boolean;
  ultimo_acceso: string | null;
  datos_personales: DatosPersonales | null;
  historial_medico: HistorialMedico | null;
  proximas_citas: Cita[];
  plan_activo: PlanActivo | null;
  ordenes_pago: OrdenPago[];
}

// ============================================
// ESTADO DEL STORE
// ============================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setAuth: (user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setInitialized: (initialized: boolean) => void;
  fetchUserData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// ============================================
// STORE DE ZUSTAND
// ============================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      error: null,

      setAuth: (user) => {
        set({
          user,
          isAuthenticated: true,
          isInitialized: true,
          error: null
        });
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          error: null
        });
      },

      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        }));
      },

      setInitialized: (initialized) => {
        set({ isInitialized: initialized });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      /**
       * Obtener datos del usuario desde el backend
       */
      fetchUserData: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include', // Enviar cookies (si usas httpOnly cookies)
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            if (response.status === 401) {
              // No autenticado - limpiar estado
              get().clearAuth();
              throw new Error('Sesión expirada');
            }
            throw new Error('Error al obtener datos del usuario');
          }

          const data = await response.json();

          if (data.success && data.usuario) {
            set({
              user: data.usuario,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              error: null
            });
          } else {
            throw new Error('Respuesta inválida del servidor');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), // Cambio a localStorage para persistencia real
      partialize: (state) => ({
        // Persistir TODO el estado necesario
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized
      })
    }
  )
);