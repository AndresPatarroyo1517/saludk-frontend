'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { calificacionesService } from '@/lib/api/services/calificacionesService';
import { useEffect, useState } from 'react';
import { citasService } from '@/lib/api/services/citasService';

// Interfaces para las calificaciones basadas en la respuesta real
interface Calificacion {
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

interface CalificacionesResponse {
  calificaciones: Calificacion[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export default function MedicoHome() {
  const { user } = useAuthStore();
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para mostrar lista desplegable de horarios (slots)
  const [proximosSlots, setProximosSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [modalidadSelect, setModalidadSelect] = useState<'ALL' | 'VIRTUAL' | 'PRESENCIAL'>('ALL');

  // Obtener el ID real del médico desde posibles ubicaciones (datos_personales.id, medico_id, user.id)
  const medicoId = user?.datos_personales?.id || (user as any)?.medico_id || user?.id;
  const calificacionPromedioFromAPI = user?.datos_personales?.calificacion_promedio;

  // Normalizar y parsear calificación promedio proveniente de la API (puede ser string o number)
  const parsedCalificacionPromedioFromAPI =
    typeof calificacionPromedioFromAPI === 'number'
      ? calificacionPromedioFromAPI
      : calificacionPromedioFromAPI
      ? parseFloat(String(calificacionPromedioFromAPI))
      : undefined;

  // Calcular calificación promedio (usar la de la API si existe, o calcularla a partir de las calificaciones)
  const calificacionPromedio = (typeof parsedCalificacionPromedioFromAPI === 'number' && !isNaN(parsedCalificacionPromedioFromAPI))
    ? parsedCalificacionPromedioFromAPI
    : calificaciones.length > 0
      ? calificaciones.reduce((acc, curr) => acc + parseInt(curr.puntuacion, 10), 0) / calificaciones.length
      : 0;

  useEffect(() => {
    const fetchCalificaciones = async () => {
      // Verificar que el usuario sea médico y tenga ID de médico
      if (!user || user.rol !== 'medico' || !medicoId) {
        setError('Usuario no autorizado o no es médico');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Obteniendo calificaciones para médico ID:', medicoId);
        
        // Usar el ID real del médico (datos_personales.id)
        const response = await calificacionesService.getCalificacionesMedico(medicoId);
        
        console.log('📊 Respuesta de calificaciones:', response);
        
        // Acceder a las calificaciones según la estructura real
        if (response && response.calificaciones && Array.isArray(response.calificaciones)) {
          setCalificaciones(response.calificaciones);
        } else if (Array.isArray(response)) {
          setCalificaciones(response);
        } else {
          console.warn('Estructura de respuesta inesperada:', response);
          setCalificaciones([]);
        }
      } catch (error: any) {
        console.error('❌ Error al obtener calificaciones:', error);
        setError(error.response?.data?.message || 'Error al cargar calificaciones');
        setCalificaciones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCalificaciones();
  }, [user, medicoId]); // Agregar medicoId como dependencia

  // Función para formatear horarios de disponibilidad
  const formatDisponibilidades = () => {
    if (!user?.disponibilidades || user.disponibilidades.length === 0) {
      return ['Horarios no configurados'];
    }

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    return user.disponibilidades.map(disp => {
      const dia = diasSemana[parseInt(disp.dia_semana, 10) - 1] || `Día ${disp.dia_semana}`;
      return `${disp.hora_inicio.slice(0, 5)}-${disp.hora_fin.slice(0, 5)}`.startsWith('-')
        ? `Día ${disp.dia_semana}`
        : `${dia} ${disp.hora_inicio.slice(0, 5)}-${disp.hora_fin.slice(0, 5)}`;
    });
  };

  // Cargar slots disponibles desde el servicio de citas y normalizar respuesta
  const cargarSlots = async (modalidadFilter?: string, duracionCita: number = 30) => {
    if (!medicoId) return;
    setSlotsLoading(true);
    try {
      const fecha_inicio = new Date().toISOString().split('T')[0];
      const fecha_fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const params: any = {
        fecha_inicio,
        fecha_fin,
        duracion_cita: duracionCita
      };
      if (modalidadFilter && modalidadFilter !== 'ALL') params.modalidad = modalidadFilter;

      const resp = await citasService.getDisponibilidad(String(medicoId), params as any);
      console.log('DEBUG cargarSlots respuesta raw:', resp);

      // Normalizar respuesta: seguir las formas que usa el dashboard
      let slots: any[] = [];
      if (!resp) slots = [];
      else if (Array.isArray(resp)) slots = resp;
      else if (Array.isArray(resp.data?.disponibilidad)) slots = resp.data.disponibilidad;
      else if (Array.isArray(resp.disponibilidad)) slots = resp.disponibilidad;
      else if (Array.isArray(resp.data)) slots = resp.data;
      else if (Array.isArray(resp.proximos)) slots = resp.proximos;
      else if (Array.isArray(resp.proximosSlots)) slots = resp.proximosSlots;
      else if (Array.isArray(resp.slots)) slots = resp.slots;
      else {
        const maybe = Object.values(resp).find(v => Array.isArray(v));
        if (Array.isArray(maybe)) slots = maybe as any[];
      }

      // Filtrar por modalidad si aplica (coincidir ignorando case)
      if (modalidadFilter && modalidadFilter !== 'ALL') {
        const mf = String(modalidadFilter).toLowerCase();
        slots = slots.filter(s => String(s.modalidad || s.tipo || s.mode || '').toLowerCase() === mf);
      }

      setProximosSlots(slots);
    } catch (e) {
      console.error('Error cargando slots:', e);
      setProximosSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Función para formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Parse a date string as Date (best-effort). Return Date or null.
  const parseSlotDate = (s?: any): Date | null => {
    if (!s) return null;
    if (s instanceof Date) return s;
    try {
      const str = String(s);
      const hasTZ = /Z$|[+-]\d{2}:?\d{2}$/.test(str);
      return new Date(hasTZ ? str : str + 'Z');
    } catch (e) {
      try { return new Date(String(s)); } catch { return null; }
    }
  };

  const formatSlotLabel = (slot: any) => {
    const timeVal = slot?.fecha_hora_inicio || slot?.fecha_hora || slot?.start || slot?.datetime || slot?.fecha || slot;
    const d = parseSlotDate(timeVal) ?? new Date(String(timeVal));
    const datePart = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timePart = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const modo = (slot?.modalidad || slot?.tipo || '').toString().toUpperCase() || 'VIRTUAL';
    return `${datePart}, ${timePart} - ${modo}`;
  };

  // Función para obtener nombre completo del paciente
  const getNombrePaciente = (calificacion: Calificacion) => {
    return `${calificacion.paciente.nombres} ${calificacion.paciente.apellidos}`;
  };

  // Mostrar estados de carga y error
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl w-full">
          <div className="text-red-600 text-center">
            <p>Error: {error}</p>
            <p className="text-sm mt-2">Medico ID: {medicoId}</p>
          </div>
        </div>
      </div>
    );
  }

  const horariosDisponibles = formatDisponibilidades();

  return (
    <div className="p-6 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-4xl w-full">
        {/* Header con información del médico */}
        <div className="flex items-center gap-6 mb-8">
          {/* Foto de perfil (placeholder) */}
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-500 text-lg font-semibold">
              {user?.datos_personales?.nombres?.[0] || 'M'}
            </span>
          </div>
          
          {/* Información del médico */}
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-gray-900">
              Dr. {user?.datos_personales?.nombre_completo || 'Médico'}
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {user?.datos_personales?.especialidad || 'Especialidad'}
            </p>
            
            {/* Calificación promedio */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${
                      star <= Math.round(calificacionPromedio)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-lg font-medium text-gray-700">
                {calificacionPromedio.toFixed(1)} ({calificaciones.length} calificaciones)
              </span>
            </div>
          </div>
        </div>

        {/* Horarios disponibles desde la API (desplegable) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Horarios Disponibles</h2>

          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium">Modalidad:</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setModalidadSelect('ALL'); cargarSlots('ALL'); }} className={`px-3 py-1 rounded ${modalidadSelect === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                Todos
              </button>
              <button type="button" onClick={() => { setModalidadSelect('VIRTUAL'); cargarSlots('VIRTUAL'); }} className={`px-3 py-1 rounded ${modalidadSelect === 'VIRTUAL' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                Virtual
              </button>
              <button type="button" onClick={() => { setModalidadSelect('PRESENCIAL'); cargarSlots('PRESENCIAL'); }} className={`px-3 py-1 rounded ${modalidadSelect === 'PRESENCIAL' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                Presencial
              </button>
            </div>
          </div>

          <div>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              onFocus={() => { if (proximosSlots.length === 0 && !slotsLoading) cargarSlots(modalidadSelect); }}
              className="w-full border rounded p-2"
            >
              <option value="">-- Consultar horarios --</option>
              {slotsLoading && <option value="">Cargando horarios...</option>}
              {!slotsLoading && proximosSlots.length === 0 && <option value="">No hay horarios disponibles</option>}
              {!slotsLoading && proximosSlots.map((slot, i) => (
                <option key={i} value={JSON.stringify(slot)}>
                  {formatSlotLabel(slot)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de calificaciones */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Calificaciones Recientes ({calificaciones.length})
          </h2>
          
          {calificaciones.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aún no tienes calificaciones
            </p>
          ) : (
            <div className="space-y-4">
              {calificaciones.map((calificacion) => (
                <div key={calificacion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {getNombrePaciente(calificacion)}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= parseInt(calificacion.puntuacion, 10)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          ({calificacion.puntuacion}/5)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 block">
                        {formatFecha(calificacion.fecha_creacion)}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {calificacion.cita.modalidad?.toLowerCase() ?? ''}
                      </span>
                    </div>
                  </div>
                  
                  {calificacion.comentario && (
                    <p className="text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg">
                      "{calificacion.comentario}"
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Cita: {formatFecha(calificacion.cita.fecha_hora)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}