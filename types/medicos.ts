export interface BloqueDisponibilidad {
  dia_nombre: any;
  id: string;
  hora_inicio: string;
  hora_fin: string;
  modalidad: 'VIRTUAL' | 'PRESENCIAL';
  disponible: boolean;
}

export interface DisponibilidadDia {
  dia_numero: string;
  dia_nombre: string;
  bloques: BloqueDisponibilidad[];
}

export interface MedicoData {
  medico_id: string;
  nombre_completo: string;
  disponibilidad_por_dia: DisponibilidadDia[];
  total_bloques: number;
}

export interface Calificacion {
  id: string;
  paciente_id: string;
  medico_id: string;
  cita_id: string;
  puntuacion: string;
  comentario: string;
  fecha_creacion: string;
  paciente: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  cita: {
    fecha_hora: string;
    modalidad: string;
  };
}