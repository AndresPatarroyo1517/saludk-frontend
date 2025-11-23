'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { calificacionesService } from '@/lib/api/services/calificacionesService';
import { useEffect, useState } from 'react';
import { citasService } from '@/lib/api/services/citasService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Calendar, 
  Clock, 
  Users, 
  MessageCircle,
  MapPin,
  Video,
  Filter,
  ChevronDown
  , Trash
} from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { medicosService } from '@/lib/api/services/medicosService';
import { toast } from 'sonner';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 4;
  const [modalidadSelect, setModalidadSelect] = useState<'ALL' | 'VIRTUAL' | 'PRESENCIAL'>('ALL');
  const [isVisible, setIsVisible] = useState(false);

  // Estados para el modal de disponibilidad (declarados al inicio para respetar el orden de Hooks)
  const [openDisponibilidad, setOpenDisponibilidad] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [diaSemana, setDiaSemana] = useState<number>(0);
  const [horaInicio, setHoraInicio] = useState<string>('08:00');
  const [horaFin, setHoraFin] = useState<string>('09:00');
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL');
  const [nuevasDisponibilidades, setNuevasDisponibilidades] = useState<Array<any>>([]);
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchUserData = useAuthStore(state => state.fetchUserData);

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
    setIsVisible(true);
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
        
        const response = await calificacionesService.getCalificacionesMedico(medicoId);
        
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
  }, [user, medicoId]);

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
  const cargarSlots = async (modalidadFilter?: string, duracionCita: number = 30, fecha_inicio_arg?: string, fecha_fin_arg?: string) => {
    if (!medicoId) return;
    setSlotsLoading(true);
    try {
      const fecha_inicio = fecha_inicio_arg ?? new Date().toISOString().split('T')[0];
      const fecha_fin = fecha_fin_arg ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const params: any = {
        fecha_inicio,
        fecha_fin,
        duracion_cita: duracionCita
      };
      if (modalidadFilter && modalidadFilter !== 'ALL') params.modalidad = modalidadFilter;

      const resp = await citasService.getDisponibilidad(String(medicoId), params as any);

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

      // Log some samples for debugging which fields the backend returns
      try {
        console.debug('[perfil] cargarSlots - sample slots:', slots.slice(0, 3));
      } catch (e) {
        // ignore logging errors in older browsers
      }

      // Normalizar e intentar añadir `disponibilidad_id` cuando falte
      const normalized = (slots || []).map((slot: any) => {
        let dispId = getDisponibilidadIdFromSlot(slot);

        // Si no lo encontramos directamente, intentar emparejar con las disponibilidades
        // configuradas del usuario (por hora y modalidad) como heurística. No eliminar
        // slots por esta operación — sólo añadimos la referencia si se detecta.
        if (!dispId && Array.isArray(user?.disponibilidades) && user.disponibilidades.length > 0) {
          try {
            const slotDate = parseSlotDate(slot?.fecha_hora_inicio || slot?.fecha_hora || slot?.start || slot?.datetime || slot?.fecha || slot);
            const slotTime = slotDate ? slotDate.toTimeString().slice(0,5) : null; // "HH:MM"
            const slotDay = slotDate ? slotDate.getDay() : null; // 0-6 (domingo=0)

            for (const d of user.disponibilidades) {
              const dd: any = d as any;
              const dHoraInicio = (dd?.hora_inicio || '').toString().slice(0,5);
              // `dia_semana` en API puede ser 1-7 o 0-6; intentar ambos
              const dDiaSemana = typeof dd?.dia_semana === 'number' ? dd.dia_semana : parseInt(dd?.dia_semana, 10);
              const dDayNormalized = Number.isFinite(dDiaSemana) ? (dDiaSemana > 7 ? dDiaSemana : dDiaSemana - 1) : undefined; // convert 1-7 -> 0-6
              const modoSlot = (slot?.modalidad || slot?.tipo || '').toString().toUpperCase();
              const modoDisp = (dd?.modalidad || dd?.modo || '').toString().toUpperCase();

              const dayMatches = slotDay === dDayNormalized || slotDay === dDiaSemana || dDiaSemana === slotDay;

              if (slotTime && dHoraInicio && slotTime === dHoraInicio && (dayMatches || !dDiaSemana)) {
                // Coincide hora de inicio (y opcionalmente día); tomar id de la disponibilidad configurada
                dispId = dd?.id || dd?.disponibilidad_id || dd?._id || dispId;
                if (dispId) break;
              }

              // Si modalidad está presente en ambos, comparar también (más estricta)
              if (slotTime && dHoraInicio && modoSlot && modoDisp && slotTime === dHoraInicio && modoSlot === modoDisp && (dayMatches || !dDiaSemana)) {
                dispId = dd?.id || dd?.disponibilidad_id || dd?._id || dispId;
                if (dispId) break;
              }
            }
          } catch (e) {
            // ignore matching errors
          }
        }

        return { ...slot, disponibilidad_id: dispId };
      });

      try {
        console.debug('[perfil] cargarSlots - normalized sample (before dedupe):', (normalized || []).slice(0,3));
      } catch (e) {}

      // Evitar duplicados: algunos backends devuelven tanto la hora de inicio como la hora de fin
      // como entradas distintas. Queremos un slot por hora de inicio. Agrupamos por fecha/hora de inicio.
      const withStart = (normalized || []).map((slot: any) => {
        const startDate = parseSlotDate(slot?.fecha_hora_inicio || slot?.fecha_hora || slot?.start || slot?.datetime || slot?.fecha || slot);
        const startKey = startDate ? startDate.toISOString() : JSON.stringify(slot);
        return { __slot_start_iso: startKey, ...slot };
      });

      const dedupeMap = new Map<string, any>();
      for (const s of withStart) {
        if (!dedupeMap.has(s.__slot_start_iso)) {
          dedupeMap.set(s.__slot_start_iso, s);
        }
      }

      const finalSlots = Array.from(dedupeMap.values()).map(({ __slot_start_iso, ...rest }) => rest);

      try {
        console.debug('[perfil] cargarSlots - normalized sample (after dedupe):', (finalSlots || []).slice(0,3));
      } catch (e) {}

      // Mostrar sólo un slot por disponibilidad: preferimos los slots que coinciden
      // con la hora de inicio de las disponibilidades configuradas del usuario
      // o que ya tienen `disponibilidad_id` detectado.
      const finalFiltered = (finalSlots || []).filter((slot: any) => {
        // si ya tiene disponibilidad_id, mantener
        if (slot?.disponibilidad_id) return true;
        try {
          const startDate = parseSlotDate(slot?.fecha_hora_inicio || slot?.fecha_hora || slot?.start || slot?.datetime || slot?.fecha || slot);
          if (!startDate) return false;
          const slotTime = startDate.toTimeString().slice(0,5); // HH:MM
          const slotDay = startDate.getDay(); // 0-6

          if (Array.isArray(user?.disponibilidades)) {
            for (const d of user.disponibilidades) {
              const dd: any = d as any;
              const dHoraInicio = (dd?.hora_inicio || '').toString().slice(0,5);
              const dDiaSemana = typeof dd?.dia_semana === 'number' ? dd.dia_semana : parseInt(dd?.dia_semana, 10);
              const dDayNormalized = Number.isFinite(dDiaSemana) ? (dDiaSemana > 7 ? dDiaSemana : dDiaSemana - 1) : undefined;

              const dayMatches = dDayNormalized === undefined ? true : (slotDay === dDayNormalized || slotDay === dDiaSemana);
              if (dHoraInicio && slotTime === dHoraInicio && dayMatches) return true;
            }
          }
        } catch (e) {
          return false;
        }

        return false;
      });

      try {
        console.debug('[perfil] cargarSlots - final filtered slots:', (finalFiltered || []).slice(0,6));
      } catch (e) {}

      setProximosSlots(finalFiltered);
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

  // Intentar extraer un id de disponibilidad desde distintos posibles campos del slot
  const getDisponibilidadIdFromSlot = (slot: any): string | undefined => {
    if (!slot) return undefined;
    //
    return (
      slot.disponibilidad_id ||
      slot.disponibilidadId ||
      slot.disponibilidad?.id ||
      slot.disponibilidad?.disponibilidad_id ||
      slot.disponibilidad?.id_disponibilidad ||
      slot.id_disponibilidad ||
      slot.disponibilidad?._id ||
      slot._id ||
      slot.id ||
      slot.availability_id ||
      slot.availability?.id ||
      slot.availability?._id ||
      slot.uuid ||
      undefined
    );
  };

  // Intent to delete: validate and open UI confirmation (modal) without showing the id.
  const attemptDeleteDisponibilidad = (disponibilidadId: string) => {
    const uuidLike = typeof disponibilidadId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(disponibilidadId);
    if (!uuidLike) {
      toast.error('ID de disponibilidad inválido. Operación cancelada por seguridad.');
      try { console.warn('[perfil] intento de eliminar id con formato inválido:', disponibilidadId); } catch (e) {}
      return;
    }

    const existsInUser = Array.isArray(user?.disponibilidades) && user.disponibilidades.some((d: any) => {
      const dd: any = d as any;
      return [dd?.id, dd?.disponibilidad_id, dd?._id].some(x => x && String(x) === String(disponibilidadId));
    });

    if (!existsInUser) {
      toast.error('ID no coincide con tus disponibilidades. Operación cancelada por seguridad.');
      try { console.warn('[perfil] intento de eliminar id no reconocido:', disponibilidadId, 'user.disponibilidades:', user?.disponibilidades); } catch (e) {}
      return;
    }

    // Abrir modal de confirmación (sin mostrar el id)
    setPendingDeleteId(disponibilidadId);
    setOpenDeleteConfirm(true);
  };

  const confirmDeleteDisponibilidad = async () => {
    const disponibilidadId = pendingDeleteId;
    setOpenDeleteConfirm(false);
    setPendingDeleteId(null);
    if (!disponibilidadId) return;

    try {
      setDeletingId(disponibilidadId);
      console.debug('[perfil] eliminando disponibilidad id:', disponibilidadId);
      const resp = await medicosService.deleteMiDisponibilidad(disponibilidadId);
      console.debug('[perfil] respuesta deleteMiDisponibilidad:', resp);
      toast.success('Disponibilidad eliminada');
      // refrescar user y slots
      await fetchUserData();
      await cargarSlots(modalidadSelect, pageSize);
    } catch (err: any) {
      console.error('Error eliminando disponibilidad (detalle):', err);
      try { console.error('Error.response:', err?.response); console.error('Error.response.data:', err?.response?.data); } catch (e) {}
      toast.error(err?.response?.data?.error || err?.message || 'Error eliminando disponibilidad');
    } finally {
      setDeletingId(null);
    }
  };

  // Función para obtener nombre completo del paciente
  const getNombrePaciente = (calificacion: Calificacion) => {
    return `${calificacion.paciente.nombres} ${calificacion.paciente.apellidos}`;
  };

  // Mostrar estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border-0 p-8 max-w-2xl w-full">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border-0 p-8 max-w-2xl w-full text-center">
          <div className="text-red-600">
            <p className="text-xl font-semibold">Error: {error}</p>
            <p className="text-sm mt-2 text-gray-600">Medico ID: {medicoId}</p>
          </div>
        </div>
      </div>
    );
  }

  const horariosDisponibles = formatDisponibilidades();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
      <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Header con información del médico */}
        <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl mb-8 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Foto de perfil */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl group hover:scale-105 transition-transform duration-300">
                <span className="text-white text-4xl font-bold">
                  {user?.datos_personales?.nombres?.[0] || 'M'}
                </span>
              </div>
              
              {/* Información del médico */}
              <div className="flex-1 text-center lg:text-left">
                <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-all duration-300 px-4 py-2 text-sm font-medium">
                  👨‍⚕️ Médico Certificado
                </Badge>
                
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Dr. {user?.datos_personales?.nombre_completo || 'Médico'}
                </h1>
                <p className="text-xl text-slate-600 mb-4">
                  {user?.datos_personales?.especialidad || 'Especialidad'}
                </p>
                
                {/* Calificación promedio */}
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className="flex items-center bg-white rounded-2xl px-4 py-2 shadow-lg">
                    <div className="flex items-center mr-3">
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
                    <span className="text-xl font-bold text-slate-900">
                      {calificacionPromedio.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                    <span className="text-slate-700 font-medium">
                      {calificaciones.length} calificaciones
                    </span>
                  </div>
                </div>

                {/* Stats rápidas */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 text-slate-600 bg-white rounded-xl px-3 py-2 shadow-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">{calificaciones.length} Pacientes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 bg-white rounded-xl px-3 py-2 shadow-sm">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{horariosDisponibles.length} Horarios</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda - Horarios disponibles */}
          <div className="lg:col-span-1 space-y-6">
            {/* Horarios disponibles desde la API */}
            <Card className="border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">Horarios Disponibles</CardTitle>
                    <CardDescription>Próximos slots para consultas</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <label className="text-sm font-medium text-slate-700">Modalidad:</label>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    type="button" 
                    onClick={() => { setModalidadSelect('ALL'); cargarSlots('ALL'); }} 
                    variant={modalidadSelect === 'ALL' ? 'default' : 'outline'}
                    className={`transition-all duration-300 ${modalidadSelect === 'ALL' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg' : ''}`}
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => { setModalidadSelect('VIRTUAL'); cargarSlots('VIRTUAL'); }} 
                    variant={modalidadSelect === 'VIRTUAL' ? 'default' : 'outline'}
                    className={`transition-all duration-300 ${modalidadSelect === 'VIRTUAL' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg' : ''}`}
                    size="sm"
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Virtual
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => { setModalidadSelect('PRESENCIAL'); cargarSlots('PRESENCIAL'); }} 
                    variant={modalidadSelect === 'PRESENCIAL' ? 'default' : 'outline'}
                    className={`transition-all duration-300 ${modalidadSelect === 'PRESENCIAL' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg' : ''}`}
                    size="sm"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Presencial
                  </Button>
                </div>

                <div>
                  <div className="mb-2">
                    <div className="text-sm text-slate-600">Consultar horarios disponibles</div>
                  </div>

                  {/* Fecha filter removed as requested */}

                  {slotsLoading ? (
                    <div className="text-center py-6">🔄 Cargando horarios...</div>
                  ) : proximosSlots.length === 0 ? (
                    <div className="text-sm text-slate-500 py-4">📭 No hay horarios disponibles</div>
                  ) : (
                    (() => {
                      const totalPages = Math.max(1, Math.ceil(proximosSlots.length / pageSize));
                      const start = (currentPage - 1) * pageSize;
                      const paginated = proximosSlots.slice(start, start + pageSize);
                      return (
                        <>
                          <div className="overflow-auto">
                            <table className="w-full text-sm table-fixed border-collapse">
                              <thead>
                                <tr className="text-left text-slate-600">
                                  <th className="py-2 pr-4">Fecha</th>
                                  <th className="py-2 pr-4">Hora</th>
                                  <th className="py-2 pr-4">Modalidad</th>
                                  <th className="py-2 pr-4 text-right">Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginated.map((slot, i) => {
                                  const d = parseSlotDate(slot?.fecha_hora_inicio || slot?.fecha_hora || slot?.start || slot?.datetime || slot?.fecha || slot) ?? new Date();
                                  const datePart = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                  const timePart = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                  const modo = (slot?.modalidad || slot?.tipo || '').toString().toUpperCase() || 'VIRTUAL';
                                  const value = JSON.stringify(slot);
                                  const dispId = slot?.disponibilidad_id || getDisponibilidadIdFromSlot(slot);
                                  return (
                                    <tr key={i} className={`hover:bg-slate-50 ${selectedSlot === value ? 'bg-blue-50' : ''}`}>
                                      <td className="py-2 pr-4 text-slate-700 cursor-pointer" onClick={() => setSelectedSlot(value)}>{datePart}</td>
                                      <td className="py-2 pr-4 text-slate-700 cursor-pointer" onClick={() => setSelectedSlot(value)}>{timePart}</td>
                                      <td className="py-2 pr-4 text-slate-700 cursor-pointer" onClick={() => setSelectedSlot(value)}>{modo}</td>
                                      <td className="py-2 pr-4 text-slate-700 text-right">
                                        <Button
                                          size="sm"
                                          variant={dispId ? 'destructive' : 'ghost'}
                                          className={`h-7 w-7 p-1 ${!dispId ? 'opacity-60' : ''}`}
                                          disabled={!dispId || slotsLoading || deletingId === String(dispId)}
                                          aria-disabled={!dispId || slotsLoading || deletingId === String(dispId)}
                                          title={dispId ? 'Eliminar disponibilidad' : 'ID no detectado'}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!dispId) {
                                              toast.error('No se detectó el id de disponibilidad. Abre la consola para más detalles.');
                                              try { console.debug('[perfil] slot sin id:', slot); } catch (err) {}
                                              return;
                                            }
                                            attemptDeleteDisponibilidad(String(dispId));
                                          }}
                                        >
                                          {deletingId === String(dispId) ? (
                                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Trash className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="text-sm text-slate-500">Mostrando {Math.min(start + 1, proximosSlots.length)}-{Math.min(start + paginated.length, proximosSlots.length)} de {proximosSlots.length}</div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Anterior</Button>
                              <div className="text-sm text-slate-600 px-2">{currentPage} / {totalPages}</div>
                              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Siguiente</Button>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>

                {selectedSlot && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mt-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">Horario seleccionado</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      {formatSlotLabel(JSON.parse(selectedSlot))}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Horarios configurados */}
            <Card className="border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">Tu Disponibilidad</CardTitle>
                    <CardDescription>Horarios establecidos</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex justify-center mb-4">
                  <Dialog open={openDisponibilidad} onOpenChange={setOpenDisponibilidad}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="default" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full px-4 py-2 shadow-lg hover:from-blue-700 transition-all duration-200">
                        <Calendar className="w-4 h-4" />
                        Añadir Disponibilidad
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configurar horarios de disponibilidad</DialogTitle>
                        <DialogDescription>Agrega uno o varios horarios para que los pacientes puedan reservar.</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col">
                            <span className="text-sm text-slate-600 mb-1">Día de la semana</span>
                            <select value={diaSemana} onChange={(e) => setDiaSemana(parseInt(e.target.value, 10))} className="border rounded-md p-2">
                              <option value={0}>Lunes</option>
                              <option value={1}>Martes</option>
                              <option value={2}>Miércoles</option>
                              <option value={3}>Jueves</option>
                              <option value={4}>Viernes</option>
                              <option value={5}>Sábado</option>
                              <option value={6}>Domingo</option>
                            </select>
                          </label>

                          <label className="flex flex-col">
                            <span className="text-sm text-slate-600 mb-1">Modalidad</span>
                            <select value={modalidad} onChange={(e) => setModalidad(e.target.value as any)} className="border rounded-md p-2">
                              <option value="PRESENCIAL">Presencial</option>
                              <option value="VIRTUAL">Virtual</option>
                            </select>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col">
                            <span className="text-sm text-slate-600 mb-1">Hora inicio</span>
                            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                          </label>

                          <label className="flex flex-col">
                            <span className="text-sm text-slate-600 mb-1">Hora fin</span>
                            <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <Button type="button" onClick={() => {
                            const item = {
                              dia_semana: diaSemana,
                              hora_inicio: `${horaInicio}:00`,
                              hora_fin: `${horaFin}:00`,
                              modalidad
                            };
                            setNuevasDisponibilidades(prev => [...prev, item]);
                          }} size="sm">Agregar horario</Button>

                          <Button type="button" variant="ghost" onClick={() => { setNuevasDisponibilidades([]); }}>Limpiar</Button>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2">Horarios a guardar</h4>
                          <div className="space-y-2">
                            {nuevasDisponibilidades.length === 0 && <div className="text-sm text-slate-500">No hay horarios añadidos.</div>}
                            {nuevasDisponibilidades.map((h, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-md border">
                                <div className="text-sm text-slate-700">{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][h.dia_semana]} {h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)} • {h.modalidad}</div>
                                <div>
                                  <Button size="sm" variant="destructive" onClick={() => setNuevasDisponibilidades(prev => prev.filter((_, i) => i !== idx))}>Eliminar</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <div className="flex items-center justify-end gap-2 w-full">
                          <Button type="button" variant="outline" onClick={() => setOpenDisponibilidad(false)}>Cancelar</Button>
                          <Button type="button" onClick={async () => {
                            if (nuevasDisponibilidades.length === 0) {
                              toast.error('Añade al menos un horario antes de guardar.');
                              return;
                            }
                            try {
                              setSaving(true);
                              await medicosService.setMiDisponibilidad({ disponibilidades: nuevasDisponibilidades });
                              toast.success('Disponibilidad guardada con éxito.');
                              await fetchUserData();
                              setNuevasDisponibilidades([]);
                              setOpenDisponibilidad(false);
                            } catch (err) {
                              console.error('Error guardando disponibilidad', err);
                              toast.error('Error al guardar disponibilidad');
                            } finally {
                              setSaving(false);
                            }
                          }}>{saving ? 'Guardando...' : 'Guardar disponibilidad'}</Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {/* Confirmación personalizada para eliminar disponibilidades */}
                  <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Eliminar disponibilidad</DialogTitle>
                        <DialogDescription>¿Estás seguro de eliminar esta disponibilidad? Esta acción no se puede deshacer.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="mt-4">
                        <div className="flex items-center justify-end gap-2 w-full">
                          <Button type="button" variant="outline" onClick={() => { setOpenDeleteConfirm(false); setPendingDeleteId(null); }}>Cancelar</Button>
                          <Button type="button" variant="destructive" onClick={async () => { await confirmDeleteDisponibilidad(); }}>Eliminar</Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Calificaciones */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-900">Calificaciones</CardTitle>
                      <CardDescription>
                        {calificaciones.length} evaluaciones de pacientes
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-lg font-semibold">
                    {calificacionPromedio.toFixed(1)}/5
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {calificaciones.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">
                      Aún no tienes calificaciones
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Las calificaciones de tus pacientes aparecerán aquí después de cada consulta.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {calificaciones.map((calificacion) => (
                      <div 
                        key={calificacion.id} 
                        className="border-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 group hover:scale-105 border border-slate-200"
                      >
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white font-semibold text-lg">
                                {calificacion.paciente.nombres[0]}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 text-lg block">
                                  {getNombrePaciente(calificacion)}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-lg ${
                                          star <= parseInt(calificacion.puntuacion, 10)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-slate-600 text-sm font-medium">
                                    ({calificacion.puntuacion}/5)
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {calificacion.comentario && (
                              <div className="bg-blue-50 rounded-xl p-4 mt-3 border border-blue-100">
                                <div className="flex items-start gap-2">
                                  <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-slate-700 text-lg leading-relaxed italic">
                                    "{calificacion.comentario}"
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <div className="inline-flex flex-col items-end">
                              <span className="text-sm text-slate-500 bg-slate-100 rounded-full px-3 py-1 font-medium">
                                {formatFecha(calificacion.fecha_creacion)}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`mt-2 capitalize ${
                                  calificacion.cita.modalidad?.toLowerCase() === 'virtual' 
                                    ? 'border-blue-200 text-blue-700 bg-blue-50' 
                                    : 'border-green-200 text-green-700 bg-green-50'
                                }`}
                              >
                                {calificacion.cita.modalidad?.toLowerCase() === 'virtual' ? (
                                  <Video className="w-3 h-3 mr-1" />
                                ) : (
                                  <MapPin className="w-3 h-3 mr-1" />
                                )}
                                {calificacion.cita.modalidad?.toLowerCase() ?? 'virtual'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500 pt-3 border-t border-slate-100">
                          <Calendar className="w-4 h-4" />
                          <span>Cita realizada: {formatFecha(calificacion.cita.fecha_hora)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}