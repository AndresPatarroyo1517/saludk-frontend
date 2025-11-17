import apiClient from '@/lib/api/client';

export interface EnfermedadCronica {
  nombre: string;
  desde: string;
  tratamiento: string;
  estado: string;
}

export interface CirugiaPrevia {
  nombre: string;
  fecha: string;
  hospital: string;
  complicaciones: string;
}

export interface MedicamentoActual {
  nombre: string;
  dosis: string;
  frecuencia: string;
  desde: string;
  prescrito_por: string;
}

export interface HistorialMedico {
  id: string;
  paciente_id: string;
  enfermedades_cronicas: EnfermedadCronica[];
  cirugias_previas: CirugiaPrevia[];
  medicamentos_actuales: MedicamentoActual[];
  paciente: {
    id: string;
    nombres: string;
    apellidos: string;
    numero_identificacion: string;
    tipo_sangre: string;
  };
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Paciente {
  id: string;
  nombres: string;
  apellidos: string;
  numero_identificacion: string;
  tipo_sangre: string;
  fecha_nacimiento: string;
  historial_medico?: {
    id: string;
    enfermedades_cronicas: EnfermedadCronica[];
  };
}

export interface PacientesResponse {
  success: boolean;
  data: Paciente[];
  total: number;
}

export interface HistorialMedicoResponse {
  success: boolean;
  data: HistorialMedico;
}

export interface UpsertHistorialRequest {
  enfermedades_cronicas: EnfermedadCronica[];
  cirugias_previas: CirugiaPrevia[];
  medicamentos_actuales: MedicamentoActual[];
}

class HistorialMedicoService {
  // Obtener todos los pacientes del médico autenticado
  async obtenerPacientes(): Promise<PacientesResponse> {
    const response = await apiClient.get<PacientesResponse>('/historialMedico/pacientes');
    return response.data;
  }

  // Obtener historial médico completo de un paciente
  async obtenerHistorialPaciente(pacienteId: string): Promise<HistorialMedicoResponse> {
    const response = await apiClient.get<HistorialMedicoResponse>(
      `/historialMedico/pacientes/${pacienteId}/historial`
    );
    return response.data;
  }

  // Crear o actualizar historial médico completo (UPSERT)
  async upsertHistorialCompleto(
    pacienteId: string, 
    historial: UpsertHistorialRequest
  ): Promise<HistorialMedicoResponse> {
    const response = await apiClient.post<HistorialMedicoResponse>(
      `/historialMedico/pacientes/${pacienteId}/historial`,
      historial
    );
    return response.data;
  }

  // Actualizar parcialmente el historial médico
  async actualizarHistorialParcial(
    pacienteId: string,
    updates: Partial<UpsertHistorialRequest>
  ): Promise<HistorialMedicoResponse> {
    const response = await apiClient.patch<HistorialMedicoResponse>(
      `/historialMedico/pacientes/${pacienteId}/historial`,
      updates
    );
    return response.data;
  }
}

export const historialMedicoService = new HistorialMedicoService();