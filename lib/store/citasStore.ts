import { create } from 'zustand';

export interface CitaAgendada {
    id: string;
    fecha: string;        // ISO string
    estado: "AGENDADA" | "CONFIRMADA" | "CANCELADA" | string;
    modalidad: "VIRTUAL" | "PRESENCIAL" | string;
    paciente: string;
    id_paciente: string;
}

export interface EstadisticasMedicoData {
    medico_id: string;
    total_hoy: { AGENDADA: number; CONFIRMADA: number };
    total_mes: { AGENDADA: number; CONFIRMADA: number };
    total_mes_completadas: number;
    hoy: number;
    proximas_citas_hoy: CitaAgendada[];
    citas_mes: CitaAgendada[];
}

type CitasStore = {
    stats: EstadisticasMedicoData | null;
    setStats: (data: EstadisticasMedicoData) => void;
    clearStats: () => void;
};

export const useCitasStore = create<CitasStore>((set) => ({
    stats: null,
    setStats: (data) => set({ stats: data }),
    clearStats: () => set({ stats: null }),
}));
