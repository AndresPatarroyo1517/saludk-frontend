import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/lib/api/client';

// ============================================
// INTERFACES (sin cambios)
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
  // Campos opcionales que pueden venir desde la API
  especialidad?: string | null;
  calificacion_promedio?: string | number | null;
}

export interface User {
  id: string;
  email: string;
  rol: 'paciente' | 'medico' | 'admin';
  paciente_id?: string;
  activo: boolean;
  ultimo_acceso: string | null;
  datos_personales: DatosPersonales | null;
  historial_medico: HistorialMedico | null;
  proximas_citas: Cita[];
  // Disponibilidades del usuario (usadas en la UI del médico)
  disponibilidades?: { dia_semana: string; hora_inicio: string; hora_fin: string }[];
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
// STORE DE ZUSTAND (CORREGIDO)
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
          isLoading: false,
          error: null
        });
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
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
       * ✅ CORREGIDO: Usar apiClient y verificar si hay usuario persistido
       */
      fetchUserData: async () => {
        const state = get();
        
        // ✅ Prevenir llamadas duplicadas
        if (state.isLoading) {
          console.warn('⚠️ [authStore] fetchUserData ya en progreso, ignorando...');
          return;
        }

        // ✅ Si no hay usuario persistido, no hacer petición
        if (!state.user && !state.isAuthenticated) {
          set({ isInitialized: true, isLoading: false });
          return;
        }

        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get('/login/me');

          if (response.data.success && response.data.usuario) {
            set({
              user: response.data.usuario,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              error: null
            });
          } else {
            console.warn('⚠️ [authStore] Respuesta sin usuario');
            get().clearAuth();
          }
        } catch (error: any) {
          console.error('❌ [authStore] Error al verificar sesión:', error);
          
          // ✅ Solo limpiar si es error 401 (no autenticado)
          if (error.response?.status === 401) {
            get().clearAuth();
          } else {
            // ✅ Otros errores no limpian el estado
            set({
              error: error.message || 'Error al verificar sesión',
              isLoading: false,
              isInitialized: true
            });
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // ❌ NO persistir isInitialized para forzar verificación en cada carga
      })
    }
  )
);