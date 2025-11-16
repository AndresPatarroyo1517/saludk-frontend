import { create } from 'zustand';

type Usuario = {
    id: string;
    email: string;
    rol: string;
    activo: boolean;
};

type Paciente = {
    id: string;
    usuario_id: string;
    numero_identificacion: string;
    tipo_identificacion: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    tipo_sangre: string;
    alergias: string[];
    fecha_nacimiento: string;
    genero: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    usuario: Usuario;
};

export type Solicitud = {
    id: string;
    paciente_id: string;
    estado: 'APROBADA' | 'PENDIENTE' | 'RECHAZADA' | 'DEVUELTA' | string;
    motivo_decision?: string;
    resultados_bd_externas?: any;
    revisado_por?: string | null;
    fecha_creacion?: string;
    fecha_validacion?: string | null;
    fecha_actualizacion?: string;
    paciente: Paciente; // <--- Agregado
    revisador?: any;
};

type SolicitudesStore = {
    aprobadas: Solicitud[];
    pendientes: Solicitud[];
    setAprobadas: (data: Solicitud[]) => void;
    setPendientes: (data: Solicitud[]) => void;
    clearSolicitudes: () => void;
};

export const useSolicitudesStore = create<SolicitudesStore>((set) => ({
    aprobadas: [],
    pendientes: [],
    setAprobadas: (data) => set({ aprobadas: data }),
    setPendientes: (data) => set({ pendientes: data }),
    clearSolicitudes: () => set({ aprobadas: [], pendientes: [] }),
}));
