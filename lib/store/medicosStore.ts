import { create } from "zustand";

export interface Medico {
    id: string;
    nombres: string;
    apellidos: string;
    nombre_completo: string;
    especialidad: string;
    registro_medico: string;
    calificacion_promedio: number;
    costo_consulta_presencial: number;
    costo_consulta_virtual: number;
    localidad: string;
    telefono: string;
    tiene_disponibilidad: boolean;
    modalidades_disponibles: string[];
}

export interface Paginacion {
    total: number;
    limite: number;
    offset: number;
    pagina_actual: number;
    total_paginas: number;
    tiene_siguiente: boolean;
    tiene_anterior: boolean;
}

type MedicosStore = {
    medicos: Medico[];
    paginacion: Paginacion | null;

    search: string;
    especialidad: string;
    localidad: string;
    calificacion: string;

    page: number;

    // Setters
    setMedicos: (data: Medico[]) => void;
    setPaginacion: (data: Paginacion) => void;

    setSearch: (v: string) => void;
    setEspecialidad: (v: string) => void;
    setLocalidad: (v: string) => void;
    setCalificacion: (v: string) => void;

    setPage: (p: number) => void;

    // Cargar todo de la API
    setDataResponse: (data: {
        medicos: Medico[];
        paginacion: Paginacion;
        filtros_aplicados?: any;
    }) => void;

    resetFilters: () => void;
};

export const useMedicosStore = create<MedicosStore>((set) => ({
    medicos: [],
    paginacion: null,

    search: "",
    especialidad: "",
    localidad: "",
    calificacion: "",

    page: 1,

    // -------------------------
    // SETTERS
    // -------------------------
    setMedicos: (data) => set({ medicos: data }),
    setPaginacion: (data) => set({ paginacion: data }),

    setSearch: (v) => set({ search: v }),
    setEspecialidad: (v) => set({ especialidad: v }),
    setLocalidad: (v) => set({ localidad: v }),
    setCalificacion: (v) => set({ calificacion: v }),

    setPage: (p) => set({ page: p }),

    // -------------------------
    // Cargar todo desde la API
    // -------------------------
    setDataResponse: (data) =>
        set({
            medicos: data.medicos,
            paginacion: data.paginacion,
        }),

    // -------------------------
    // Reset filtros
    // -------------------------
    resetFilters: () =>
        set({
            search: "",
            especialidad: "",
            localidad: "",
            calificacion: "",
            page: 1,
        }),
}));
