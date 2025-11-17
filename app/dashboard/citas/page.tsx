"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import citasService from '@/lib/api/services/citasService';
import pacienteService from '@/lib/api/services/pacienteService';
import medicosService from '@/lib/api/services/medicosService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  
} from '@/components/ui/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Parse a date string as UTC if it has no timezone information.
// If the value is already a Date, return it. Accepts strings or Date objects.
const parseAsUTC = (s?: any): Date | null => {
  if (s == null) return null;
  if (s instanceof Date) return s;
  const str = String(s);
  const hasTZ = /Z$|[+-]\d{2}:?\d{2}$/.test(str);
  return new Date(hasTZ ? str : str + 'Z');
};

function FechaBadge({ fecha }: { fecha: string }) {
  const d = parseAsUTC(fecha) ?? new Date(String(fecha));
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
  const num = d.getDate();
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-20 flex-shrink-0">
      <div className="bg-blue-50 rounded-md p-2 text-center">
        <div className="text-xs font-semibold text-blue-600">{dia}</div>
        <div className="text-2xl font-bold text-slate-900">{num}</div>
        <div className="text-xs text-slate-600 mt-1">{hora}</div>
      </div>
    </div>
  );
}

export default function MisCitasPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detalleCita, setDetalleCita] = useState<any | null>(null);

  // Debug: mostrar información del usuario
  useEffect(() => {
    console.log('📋 User actual:', user);
    console.log('📋 paciente_id:', user?.paciente_id);
    console.log('📋 user.id:', user?.id);
  }, [user]);

  // Modal/agendamiento state
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCitaId, setEditingCitaId] = useState<string | null>(null);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [modalidad, setModalidad] = useState<string>('VIRTUAL');
  const [duracion, setDuracion] = useState<number>(30);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [motivo, setMotivo] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [proximosSlots, setProximosSlots] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PROXIMAS' | 'CONFIRMADAS' | 'COMPLETADAS' | 'CANCELADAS'>('PROXIMAS');
  // Paginación
  const [page, setPage] = useState<number>(1);
  const pageSize = 4; // resultados por página (mostrar 4 por página)
  // Toggle para pruebas: si true enviamos la fecha preservando el offset local
  // (ej: 2025-11-17T14:30:00-05:00). Si false enviamos ISO UTC (ej: 2025-11-17T19:30:00Z).
  // Cambia este valor a `true` si el backend espera la hora local tal como la eligió el usuario.
  const SEND_DATES_AS_LOCAL_OFFSET = false;

  useEffect(() => {
    const load = async () => {
      const paciente_id = user?.paciente_id || user?.id;
      if (!paciente_id) return;
      setLoading(true);
      try {
        // intentar por paciente
        try {
          const resp = await citasService.getCitasPaciente(String(paciente_id));
          console.log('DEBUG getCitasPaciente response:', resp);
          const list = resp?.data?.citas ?? resp?.citas ?? resp?.data ?? resp ?? [];
          if (Array.isArray(list) && list.length > 0) {
            // Debug: show summary of dates and months to detect missing items
            try {
              console.group('DEBUG citas summary (load)');
              console.log('total citas received:', list.length);
              const mapped = list.map((c: any) => {
                const d = parseAsUTC(c.fecha_hora) ?? new Date(String(c.fecha_hora));
                return {
                  id: c.id,
                  fecha_hora: c.fecha_hora,
                  iso: d ? d.toISOString() : null,
                  month_local: d ? monthKey(d) : null,
                  month_utc: d ? monthKeyUTC(d) : null,
                };
              });
              console.table(mapped);
              const months = Array.from(new Set(mapped.map((m: any) => m.month_utc).filter(Boolean)));
              console.log('months present (UTC):', months);
              console.groupEnd();
            } catch (e) {
              console.warn('Error al generar summary de citas:', e);
            }
            setCitas(list);
            return;
          }
        } catch (e) {
          console.warn('getCitasPaciente fallo, intentando por usuario', e);
        }

        // si falla o está vacío, intentar por usuario id
        try {
          const usuarioId = String(user.id);
          const list2 = await citasService.getCitasPorUsuario(usuarioId);
          console.log('DEBUG getCitasPorUsuario result:', list2);
          if (Array.isArray(list2) && list2.length > 0) {
            setCitas(list2);
            return;
          }
          // si no hay resultados, limpiar lista
          setCitas([]);
        } catch (e) {
          console.error('Error intentando obtener citas por usuario', e);
          setCitas([]);
        }
      } catch (err) {
        console.error('Error cargando citas', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.paciente_id, user?.id]);

  const refreshCitas = async () => {
    const paciente_id = user?.paciente_id || user?.id;
    if (!paciente_id) return;
    try {
      try {
        const resp = await citasService.getCitasPaciente(String(paciente_id));
        console.log('DEBUG refresh getCitasPaciente response:', resp);
        const list = resp?.data?.citas ?? resp?.citas ?? resp?.data ?? resp ?? [];
        if (Array.isArray(list) && list.length > 0) {
          try {
            console.group('DEBUG citas summary (refresh)');
            console.log('total citas received (refresh):', list.length);
            const mapped = list.map((c: any) => {
              const d = parseAsUTC(c.fecha_hora) ?? new Date(String(c.fecha_hora));
              return { id: c.id, fecha_hora: c.fecha_hora, iso: d ? d.toISOString() : null, month_local: d ? monthKey(d) : null, month_utc: d ? monthKeyUTC(d) : null };
            });
            console.table(mapped);
            const months = Array.from(new Set(mapped.map((m: any) => m.month_utc).filter(Boolean)));
            console.log('months present (UTC):', months);
            console.groupEnd();
          } catch (e) {
            console.warn('Error al generar summary de citas (refresh):', e);
          }
          setCitas(list);
          return;
        }
      } catch (e) {
        console.warn('refresh getCitasPaciente fallo, intentando por usuario', e);
      }

      const usuarioId = String(user.id);
      const list2 = await citasService.getCitasPorUsuario(usuarioId);
      console.log('DEBUG refresh getCitasPorUsuario result:', list2);
      setCitas(Array.isArray(list2) ? list2 : []);
    } catch (err) {
      console.error('Error cargando citas', err);
      setCitas([]);
    }
  };

  const handleCancelar = async (citaId: string) => {
    // legacy: kept for compatibility but not used by the UI
    try {
      await citasService.cancelarCita(citaId);
      setCitas((prev) => prev.filter((c) => c.id !== citaId));
      alert('Cita cancelada exitosamente');
    } catch (err: any) {
      console.error('Error cancelando cita', err);
      alert(err?.message || 'Error cancelando la cita');
    }
  };

  // New alert-dialog state for nicer confirmation UI
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [citaToCancel, setCitaToCancel] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  const openCancelDialog = (citaId: string) => {
    setCitaToCancel(citaId);
    setCancelDialogOpen(true);
  };

  const performCancel = async () => {
    if (!citaToCancel) return;
    setCanceling(true);
    try {
      const resp = await citasService.cancelarCita(citaToCancel);
      console.log('Respuesta cancelación (frontend):', resp);
      // refrescar la lista desde el backend para mantener sincronía
      try {
        await refreshCitas();
      } catch (e) {
        console.warn('refreshCitas falló tras cancelar:', e);
      }

      // si refresh no trajo cambios, filtrar localmente igual
      setCitas((prev) => prev.filter((c) => String(c.id) !== String(citaToCancel)));
      setCancelDialogOpen(false);
      setCitaToCancel(null);
      // cerrar detalles si corresponde
      if (detalleCita && String(detalleCita.id) === String(citaToCancel)) {
        setDetailsOpen(false);
        setDetalleCita(null);
      }
    } catch (err: any) {
      // Logging mejorado para depuración — intentamos obtener campos útiles
      try {
        console.group('Error cancelando cita (detalles)');
        console.error('raw error object:', err);
        console.log('isAxiosError:', Boolean(err?.isAxiosError));
        console.log('message:', err?.message);
        console.log('response status:', err?.response?.status);
        console.log('response data:', err?.response?.data);
        console.log('request config:', err?.config?.url, err?.config?.method);
        console.groupEnd();
      } catch (e) {
        console.error('Falló al loggear el error:', e, err);
      }

      // Intentar extraer un mensaje de servidor de distintas formas
      const serverMsg = err?.response?.data?.error
        || err?.response?.data?.mensaje
        || (typeof err?.response?.data === 'string' ? err.response.data : null)
        || err?.message
        || null;

      // Si fue un error de servidor o de red, intentar un único reintento rápido
      try {
        const status = err?.response?.status;
        if (!err?.response || (typeof status === 'number' && status >= 500)) {
          try {
            const retryResp = await citasService.cancelarCita(citaToCancel);
            console.log('Reintento de cancelación exitoso:', retryResp);
            try { await refreshCitas(); } catch (e) { console.warn('refreshCitas falló tras reintento:', e); }
            toast({ title: 'Cita cancelada', description: 'La cita fue cancelada correctamente.', className: 'bg-emerald-50 border-emerald-200 text-emerald-900' });
            setCitas((prev) => prev.filter((c) => String(c.id) !== String(citaToCancel)));
            setCancelDialogOpen(false);
            setCitaToCancel(null);
            setCanceling(false);
            return;
          } catch (retryErr) {
            console.warn('Reintento de cancelación falló:', retryErr);
          }
        }
      } catch (ignore) {
        console.warn('Error evaluando reintento:', ignore);
      }

      // Intento de mitigación: verificar en el backend si la cita ya fue removida
      try {
        const paciente_id = user?.paciente_id || user?.id;
        if (paciente_id) {
          const resp = await citasService.getCitasPaciente(String(paciente_id));
          const list = resp?.data?.citas ?? resp?.citas ?? resp?.data ?? resp ?? [];
          const stillExists = Array.isArray(list) && list.some((c: any) => String(c.id) === String(citaToCancel));
          if (!stillExists) {
            toast({
              title: 'Cita cancelada',
              description: 'La cita fue cancelada correctamente aunque el servidor devolvió un error.',
              className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            });
            // asegurarnos de actualizar el estado local
            setCitas(Array.isArray(list) ? list : []);
            setCancelDialogOpen(false);
            setCitaToCancel(null);
            setCanceling(false);
            return;
          }
        }
      } catch (refreshErr) {
        console.warn('check tras error de cancelación falló:', refreshErr);
      }

      alert(serverMsg || 'Error cancelando la cita');
    } finally {
      setCanceling(false);
    }
  };

  const openDetails = (cita: any) => {
    setDetalleCita(cita);
    setDetailsOpen(true);
  };

  const startReprogram = (cita: any) => {
    // Prefill form with existing cita values and open modal in edit mode
    setIsEditing(true);
    setEditingCitaId(String(cita.id));
    setSelectedMedicoId(cita.medico?.id || cita.medico_id || '');
    setMotivo(cita.motivo_consulta || '');
    setDuracion(cita.duracion_minutos || 30);
    setModalidad(cita.modalidad || 'VIRTUAL');
    // try to set selectedSlot if backend returns same format
    setSelectedSlot(cita.fecha_hora ? { fecha_hora_inicio: cita.fecha_hora } : null);
    setOpen(true);
  };

  // Helpers de filtrado
  const normalizeEstado = (x: any) => String(x?.estado || x?.estado_cita || '').toUpperCase();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // UTC monthKey avoids local timezone shifts that can move dates across month boundaries
  const monthKeyUTC = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const matchesTab = (estado: string) => {
    switch (activeTab) {
      case 'CONFIRMADAS':
        return estado === 'CONFIRMADA';
      case 'CANCELADAS':
        return estado === 'CANCELADA';
      case 'COMPLETADAS':
        return estado === 'COMPLETADA' || estado === 'FINALIZADA' || estado === 'REALIZADA' || estado === 'ATENDIDA';
      case 'PROXIMAS':
      default:
        return estado === 'AGENDADA' || estado === 'PROGRAMADA' || estado === 'PENDIENTE';
    }
  };

  const filteredCitas = (() => {
    let list = Array.isArray(citas) ? [...citas] : [];
    // por estado según pestaña
    list = list.filter((c) => matchesTab(normalizeEstado(c)));
    // por búsqueda: médico nombre/apellido/especialidad
    const term = (searchTerm || '').trim().toLowerCase();
    if (term) {
      list = list.filter((c: any) => {
        const m = c.medico || {};
        const full = [m.nombres, m.apellidos, m.nombre, m.especialidad, m.especialidad_nombre]
          .filter(Boolean)
          .join(' ') // string
          .toLowerCase();
        return full.includes(term);
      });
    }
    // por mes seleccionado
    if (selectedMonth) {
      list = list.filter((c: any) => {
        const d = parseAsUTC(c.fecha_hora) ?? new Date(String(c.fecha_hora));
        return monthKeyUTC(d) === selectedMonth;
      });
    }
    // ordenar por fecha ascendente
    list.sort((a: any, b: any) => (parseAsUTC(a.fecha_hora) ?? new Date(String(a.fecha_hora))).getTime() - (parseAsUTC(b.fecha_hora) ?? new Date(String(b.fecha_hora))).getTime());
    return list;
  })();

  // Ajustar página cuando cambie el conjunto filtrado
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredCitas.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filteredCitas.length]);

  // Cuando el usuario cambia filtros o búsqueda, volver a la primera página
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedMonth, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredCitas.length / pageSize));
  const paginatedCitas = filteredCitas.slice((page - 1) * pageSize, page * pageSize);

  // Cuando se abre el modal, cargar lista de médicos
  useEffect(() => {
    if (!open) return;
    const loadMedicos = async () => {
      try {
        const resp = await medicosService.getMedicos();
        console.log('Respuesta médicos (raw):', resp);
        let list: any[] = [];
        
        // Intenta múltiples estructuras de respuesta
        if (Array.isArray(resp)) {
          list = resp;
        } else if (resp?.data) {
          if (Array.isArray(resp.data)) {
            list = resp.data;
          } else if (resp.data.medicos && Array.isArray(resp.data.medicos)) {
            list = resp.data.medicos;
          } else if (typeof resp.data === 'object') {
            list = Object.values(resp.data).filter((item: any) => item && typeof item === 'object');
          }
        } else if (resp?.medicos && Array.isArray(resp.medicos)) {
          list = resp.medicos;
        }
        
        console.log('Lista de médicos procesada:', list);
        console.log('Cantidad de médicos:', list.length);
        setMedicos(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error('Error cargando médicos:', err);
        console.error('Error details:', err?.response?.data || err?.message);
        setMedicos([]);
      }
    };
    loadMedicos();
  }, [open]);

  // Cuando se selecciona un médico, cargar sus próximos slots disponibles
  useEffect(() => {
    if (!selectedMedicoId || !open) {
      setProximosSlots([]);
      setFecha('');
      setSelectedSlot(null);
      return;
    }

    const cargarSlots = async () => {
      try {
        setBusy(true);
        const params = {
          cantidad: 50,
          modalidad: modalidad
        };
        const resp = await citasService.getDisponibilidad(selectedMedicoId, {
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          modalidad: modalidad,
          duracion_cita: duracion
        });

        console.log('Respuesta slots:', resp);
        let list: any[] = [];
        if (Array.isArray(resp?.data?.disponibilidad)) {
          list = resp.data.disponibilidad;
        } else if (Array.isArray(resp?.disponibilidad)) {
          list = resp.disponibilidad;
        }
        // Filtrar solo slots disponibles
        const normalizeSlotTime = (s: any) => {
          return s?.fecha_hora_inicio || s?.fecha_hora || s?.start || s?.datetime || null;
        };

        const isFlagTrue = (v: any) => {
          if (v === true) return true;
          if (typeof v === 'string') {
            const low = v.toLowerCase();
            return low === 'true' || low === 'si' || low === 'sí' || low === '1' || low === 'available' || low === 'disponible';
          }
          if (typeof v === 'number') return v === 1;
          return false;
        };

        const isSlotAvailable = (s: any) => {
          // Support multiple possible keys that the backend might return
          if (isFlagTrue(s?.disponible)) return true;
          if (isFlagTrue(s?.available)) return true;
          if (isFlagTrue(s?.is_available)) return true;
          if (typeof s?.estado === 'string' && s.estado.toLowerCase().includes('disp')) return true;
          if (typeof s?.status === 'string' && s.status.toLowerCase().includes('avail')) return true;
          // fallback: if there is an explicit 'ocupado' flag false
          if (s?.ocupado === false) return true;
          return false;
        };

        // Build a set of occupied times for the selected medico from existing citas
        const occupied = new Set<string>();
        try {
          citas.forEach((c: any) => {
            if (!c) return;
            const mId = c.medico?.id || c.medico_id || c.medico?.usuario_id || null;
            if (!mId) return;
              if (String(mId) === String(selectedMedicoId)) {
                const t = c.fecha_hora || c.fecha || c.start || null;
                if (t) {
                  const dt = parseAsUTC(t) ?? new Date(String(t));
                  occupied.add(dt.toISOString());
                }
              }
          });
        } catch (e) {
          console.warn('Error procesando citas para ocupación:', e);
        }

        const disponibles = list.filter((s: any) => {
          try {
            const timeVal = normalizeSlotTime(s);
            if (!timeVal) return false;
              const iso = (parseAsUTC(timeVal) ?? new Date(String(timeVal))).toISOString();
            // Excluir si coincide con una cita ya agendada para ese médico
            if (occupied.has(iso)) return false;
            return isSlotAvailable(s);
          } catch (e) {
            return false;
          }
        });

        setProximosSlots(disponibles);
        console.log('Slots disponibles:', disponibles);
      } catch (err: any) {
        console.error('Error cargando slots:', err);
        setProximosSlots([]);
      } finally {
        setBusy(false);
      }
    };

    cargarSlots();
  }, [selectedMedicoId, open, modalidad, duracion]);

  const confirmarReserva = async () => {
    console.log('🔍 Debug confirmarReserva:', { selectedSlot, selectedMedicoId, paciente_id: user?.paciente_id, user_id: user?.id });
    
    if (!selectedSlot || !selectedMedicoId || !user?.id) {
      console.error('❌ Falta info:', { selectedSlot: !!selectedSlot, selectedMedicoId: !!selectedMedicoId, user_id: !!user?.id });
      return;
    }
    
    setBusy(true);
    try {
      // Enviar la fecha al backend según la política de envío seleccionada (toggle para pruebas).
      let fechaToSend: string | undefined = undefined;
      if (selectedSlot?.fecha_hora_inicio) {
        if (SEND_DATES_AS_LOCAL_OFFSET) {
          // Formatear preservando la hora local con el offset (ej: 2025-11-17T14:30:00-05:00)
          const d = new Date(selectedSlot.fecha_hora_inicio);
          const pad = (n: number) => String(n).padStart(2, '0');
          const offsetMin = d.getTimezoneOffset();
          const sign = offsetMin > 0 ? '-' : '+';
          const absMin = Math.abs(offsetMin);
          const offH = pad(Math.floor(absMin / 60));
          const offM = pad(absMin % 60);
          fechaToSend = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${sign}${offH}:${offM}`;
          console.log('ConfirmarReserva: fecha original:', selectedSlot?.fecha_hora_inicio, '-> fecha a enviar (local offset):', fechaToSend);
        } else {
          // Enviar como ISO UTC
          fechaToSend = parseAsUTC(selectedSlot.fecha_hora_inicio)?.toISOString() ?? selectedSlot.fecha_hora_inicio;
          console.log('ConfirmarReserva: fecha original:', selectedSlot?.fecha_hora_inicio, '-> fecha a enviar (UTC):', fechaToSend);
        }
      }

      // Validar slot nuevamente usando la misma representación que enviaremos
      if (!fechaToSend) {
        alert('Fecha inválida, intenta nuevamente');
        setBusy(false);
        return;
      }

      const validar = await citasService.validarSlot(selectedMedicoId, { fecha_hora: fechaToSend, duracion_minutos: duracion });
      const disponible = validar?.data?.disponible ?? validar?.disponible;
      if (!disponible) {
        alert(validar?.data?.motivo || validar?.motivo || 'El slot ya no está disponible');
        setBusy(false);
        return;
      }

      // Intentar resolver paciente real por usuario_id (más fiable)
      let pacienteIdToSend: string | undefined = undefined;
      try {
        const paciente = await pacienteService.getByUsuarioId(String(user.id));
        if (paciente && paciente.id) pacienteIdToSend = paciente.id;
      } catch (e) {
        // no encontrado, fallback a user.paciente_id o user.id
        pacienteIdToSend = user?.paciente_id || String(user.id);
      }

      const payload = {
        medico_id: selectedMedicoId,
        paciente_id: String(pacienteIdToSend),
        usuario_id: String(user.id),
        fecha_hora: fechaToSend,
        modalidad: modalidad,
        motivo_consulta: motivo,
        duracion_minutos: duracion
      };

      console.log('📤 Enviando payload:', payload);
      let resp: any = null;
      if (isEditing && editingCitaId) {
        resp = await citasService.reprogramarCita(editingCitaId, payload);
        console.log('✅ Cita reprogramada:', resp);
        toast({
          title: "¡Cita reprogramada!",
          description: "La cita ha sido reprogramada correctamente.",
          className: "bg-emerald-50 border-emerald-200 text-emerald-900",
        });
      } else {
        resp = await citasService.crearCita(payload);
        console.log('✅ Cita creada:', resp);
        toast({
          title: "¡Cita creada exitosamente!",
          description: "Tu cita médica ha sido agendada correctamente.",
          className: "bg-emerald-50 border-emerald-200 text-emerald-900",
        });
      }
      setOpen(false);
      setIsEditing(false);
      setEditingCitaId(null);
      // reset modal
      setSelectedMedicoId(''); setFecha(''); setSelectedSlot(null); setMotivo(''); setProximosSlots([]); setModalidad('VIRTUAL'); setDuracion(30);
      // refrescar lista
      await refreshCitas();
    } catch (err:any) {
      console.error('Error creando cita', err);

      // Si es un error FK sobre paciente, intentar resolver paciente por usuario y reintentar
      const msg = err?.response?.data?.mensaje || err?.response?.data?.error || err?.message || '';
      const constraint = String(msg).toLowerCase();
      if (constraint.includes('cita_paciente_id_fkey') || constraint.includes('foreign key') || constraint.includes('paciente')) {
        try {
          // primero intentar obtener
          let paciente = null;
          try {
            paciente = await pacienteService.getByUsuarioId(String(user.id));
          } catch (e) {
            paciente = null;
          }

          // si no existe, intentar crear un paciente mínimo desde frontend
          if (!paciente) {
            try {
              paciente = await pacienteService.createForUsuario(String(user.id));
              console.log('Paciente creado desde frontend:', paciente);
            } catch (e2) {
              console.error('No se pudo crear paciente desde frontend:', e2);
            }
          }

          if (paciente && paciente.id) {
            const retryPayload = {
              medico_id: selectedMedicoId,
              paciente_id: String(paciente.id),
                usuario_id: String(user.id),
              fecha_hora: selectedSlot.fecha_hora_inicio,
              modalidad: modalidad,
              motivo_consulta: motivo,
              duracion_minutos: duracion
            };
            console.log('📤 Reintentando con paciente.id:', retryPayload);
            const resp2 = await citasService.crearCita(retryPayload);
            console.log('✅ Cita creada al reintentar:', resp2);
            toast({
              title: "¡Cita creada exitosamente!",
              description: "Tu cita médica ha sido agendada correctamente.",
              className: "bg-emerald-50 border-emerald-200 text-emerald-900",
            });
            setOpen(false);
            setSelectedMedicoId(''); setFecha(''); setSelectedSlot(null); setMotivo(''); setProximosSlots([]); setModalidad('VIRTUAL'); setDuracion(30);
            await refreshCitas();
            setBusy(false);
            return;
          }
        } catch (e2) {
          console.error('Error buscando paciente para reintento:', e2);
        }
      }

      toast({
        title: "Error al crear la cita",
        description: err?.response?.data?.error || err?.message || 'No se pudo crear la cita. Intenta nuevamente.',
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["paciente"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mis Citas Médicas</h1>
              <p className="text-slate-600 mt-1">Consulta, crea o cancela tus citas</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Botón azul que abre el modal de agendamiento */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">+ Agendar Nueva Cita</Button>
                </DialogTrigger>

                <DialogContent className="bg-white text-slate-900 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">{isEditing ? 'Reprogramar Cita' : 'Agendar Nueva Cita'}</DialogTitle>
                    <DialogDescription className="text-slate-600">{isEditing ? 'Selecciona médico, fecha y horario para reprogramar tu cita.' : 'Selecciona médico, fecha y horario para reservar tu cita.'}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="text-sm font-medium text-slate-900">Médico</label>
                      <select className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900" value={selectedMedicoId} onChange={(e) => setSelectedMedicoId(e.target.value)}>
                        <option value="">-- Seleccionar médico --</option>
                        {medicos && medicos.length > 0 ? (
                          medicos.map((m:any) => (
                            <option key={m.id} value={m.id}>{m.nombres} {m.apellidos} {m.especialidad ? `- ${m.especialidad}` : ''}</option>
                          ))
                        ) : (
                          <option disabled>No hay médicos disponibles</option>
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium text-slate-900">Modalidad</label>
                        <select className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900" value={modalidad} onChange={(e) => { setModalidad(e.target.value); setSelectedSlot(null); }}>
                          <option value="VIRTUAL">Virtual</option>
                          <option value="PRESENCIAL">Presencial</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-900">Duración (min)</label>
                        <select className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900" value={duracion} onChange={(e) => { setDuracion(parseInt(e.target.value)); setSelectedSlot(null); }}>
                          <option value={15}>15</option>
                          <option value={30}>30</option>
                          <option value={45}>45</option>
                          <option value={60}>60</option>
                        </select>
                      </div>
                    </div>

                    {/* Dropdown con horarios disponibles del médico */}
                    {selectedMedicoId && (
                      <div>
                        <label className="text-sm font-medium text-slate-900">Selecciona fecha y hora</label>
                        {busy ? (
                          <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">Cargando horarios disponibles...</div>
                        ) : proximosSlots.length > 0 ? (
                          <select 
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900"
                            value={selectedSlot ? selectedSlot.fecha_hora_inicio : ''}
                            onChange={(e) => {
                              const selected = proximosSlots.find(s => s.fecha_hora_inicio === e.target.value);
                              setSelectedSlot(selected || null);
                            }}
                          >
                            <option value="">-- Seleccionar horario --</option>
                            {proximosSlots.map((s: any) => (
                              <option key={s.fecha_hora_inicio} value={s.fecha_hora_inicio}>
                                  {(parseAsUTC(s.fecha_hora_inicio) ?? new Date(String(s.fecha_hora_inicio))).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} - {s.modalidad}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                            No hay horarios disponibles para este médico en los próximos 30 días.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedSlot && (
                      <div className="pt-2">
                        <label className="text-sm font-medium text-slate-900">Motivo (opcional)</label>
                        <input className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button onClick={confirmarReserva} disabled={!selectedSlot || busy}>{busy ? (isEditing ? 'Reprogramando...' : 'Reservando...') : (isEditing ? 'Reprogramar Cita' : 'Reservar Cita')}</Button>
                    <DialogClose asChild>
                      <Button className="bg-blue-600 text-white hover:bg-blue-700">Cerrar</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Confirmación bonita para cancelar cita */}
              <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro que deseas cancelar esta cita?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción cancelará la cita de forma permanente. ¿Deseas continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex items-center justify-end space-x-2">
                    <AlertDialogCancel onClick={() => { setCancelDialogOpen(false); setCitaToCancel(null); }}>
                      No
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={performCancel}>
                      {canceling ? 'Cancelando...' : 'Sí, cancelar'}
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Barra de búsqueda y filtro por mes */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por médico o especialidad..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Mes:</label>
              <input
                type="month"
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs de filtrado por estado */}
          <div className="flex items-center gap-2">
            {(['PROXIMAS','CONFIRMADAS','COMPLETADAS','CANCELADAS'] as const).map((tab) => {
              const active = activeTab === tab;
              const label = tab === 'PROXIMAS' ? 'Próximas' : tab.charAt(0) + tab.slice(1).toLowerCase();
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={active
                    ? 'px-4 py-2 rounded-full bg-blue-100 text-blue-600 font-medium text-sm'
                    : 'px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-medium text-sm hover:bg-slate-200'}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="bg-white border rounded-lg p-4 space-y-4">
            {loading && <div>Cargando citas...</div>}

            {!loading && citas.length === 0 && (
              <div className="text-center text-slate-600 py-8">No hay citas registradas.</div>
            )}

            <div className="space-y-4">
              {paginatedCitas.map((c) => {
                const fecha = parseAsUTC(c.fecha_hora) ?? new Date(String(c.fecha_hora));
                const weekday = fecha.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
                const day = fecha.getDate();
                const time = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                const medicoNombre = c.medico?.nombres ? `${c.medico.nombres} ${c.medico.apellidos || ''}` : (c.medico?.nombre || 'Médico');
                const especialidad = c.medico?.especialidad || c.medico?.especialidad_nombre || '';

                const estado = String(c.estado || c.estado_cita || '').toUpperCase();
                const esCompletada = estado === 'COMPLETADA' || estado === 'FINALIZADA' || estado === 'REALIZADA' || estado === 'ATENDIDA';

                const estadoClasses = estado === 'CONFIRMADA'
                  ? 'bg-emerald-50 text-emerald-700'
                  : estado === 'AGENDADA'
                    ? 'bg-blue-50 text-blue-700'
                    : estado === 'CANCELADA'
                      ? 'bg-rose-50 text-rose-700'
                      : esCompletada
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-600';

                const badgeBg = estado === 'CONFIRMADA'
                  ? 'bg-emerald-50'
                  : estado === 'CANCELADA'
                    ? 'bg-rose-50'
                    : esCompletada
                      ? 'bg-amber-50'
                      : 'bg-blue-50';

                const badgeText = estado === 'CONFIRMADA'
                  ? 'text-emerald-600'
                  : estado === 'CANCELADA'
                    ? 'text-rose-600'
                    : esCompletada
                      ? 'text-amber-700'
                      : 'text-blue-600';

                return (
                  <div key={c.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-20 flex-shrink-0">
                        <div className={`rounded-md p-2 text-center ${badgeBg}`}>
                          <div className={`text-xs font-semibold ${badgeText}`}>{weekday}</div>
                          <div className="text-2xl font-bold text-slate-900">{day}</div>
                          <div className="text-xs text-slate-600 mt-1">{time}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-lg font-semibold text-slate-900">{medicoNombre}</div>
                        {especialidad && <div className="text-sm text-slate-600">{especialidad}</div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="self-center">
                          <span className={`px-3 py-1 rounded-full text-sm ${estadoClasses}`}>{(estado && (estado.charAt(0) + estado.slice(1).toLowerCase())) || 'Desconocido'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            onClick={() => openDetails(c)}
                            className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                          >
                            Ver Detalles
                          </Button>

                          {estado === 'AGENDADA' && (
                            <button onClick={() => openCancelDialog(c.id)} className="text-sm text-rose-600">Cancelar</button>
                          )}

                          {estado === 'CONFIRMADA' && (
                            <button onClick={() => startReprogram(c)} className="text-sm text-indigo-600">Reprogramar</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && filteredCitas.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">Mostrando {filteredCitas.length} resultados</div>
                <div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          aria-label="Anterior"
                          size="icon"
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                          className={page === 1 ? 'opacity-50 pointer-events-none bg-white border border-slate-200 text-slate-300 h-10 min-w-[44px] flex items-center justify-center rounded-md' : 'bg-white border border-slate-200 text-slate-700 h-10 min-w-[44px] flex items-center justify-center rounded-md hover:bg-slate-50'}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          size="icon"
                          aria-current="page"
                          onClick={(e) => { e.preventDefault(); }}
                          className={'bg-blue-500 border-blue-500 text-white h-10 min-w-[44px] flex items-center justify-center rounded-md shadow-sm'}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          aria-label="Siguiente"
                          size="icon"
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(Math.ceil(filteredCitas.length / pageSize), p + 1)); }}
                          className={page === Math.ceil(filteredCitas.length / pageSize) ? 'opacity-50 pointer-events-none bg-white border border-slate-200 text-slate-300 h-10 min-w-[44px] flex items-center justify-center rounded-md' : 'bg-white border border-slate-200 text-slate-700 h-10 min-w-[44px] flex items-center justify-center rounded-md hover:bg-slate-50'}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </div>
          {/* Modal de Detalles de Cita */}
          <Dialog open={detailsOpen} onOpenChange={(v) => { setDetailsOpen(v); if (!v) setDetalleCita(null); }}>
            <DialogContent className="bg-white text-slate-900 max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Detalle de la Cita</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Información completa de la cita seleccionada.
                </DialogDescription>
              </DialogHeader>

              {detalleCita ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs uppercase text-slate-500">Fecha y hora</div>
                      <div className="font-medium text-slate-900">
                        {(parseAsUTC(detalleCita.fecha_hora) ?? new Date(String(detalleCita.fecha_hora))).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Estado</div>
                      <div className="font-medium">{String(detalleCita.estado || detalleCita.estado_cita || 'DESCONOCIDO').toUpperCase()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs uppercase text-slate-500">Médico</div>
                      <div className="font-medium">
                        {detalleCita.medico?.nombres ? `${detalleCita.medico.nombres} ${detalleCita.medico.apellidos || ''}` : (detalleCita.medico?.nombre || 'Médico')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Especialidad</div>
                      <div className="font-medium">{detalleCita.medico?.especialidad || detalleCita.medico?.especialidad_nombre || '—'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs uppercase text-slate-500">Modalidad</div>
                      <div className="font-medium">{detalleCita.modalidad || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Duración</div>
                      <div className="font-medium">{detalleCita.duracion_minutos ? `${detalleCita.duracion_minutos} min` : '—'}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-slate-500">Motivo</div>
                    <div className="font-medium">{detalleCita.motivo_consulta || '—'}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-slate-500">Ubicación</div>
                    <div className="font-medium">
                      {detalleCita.ubicacion || detalleCita.direccion || detalleCita.sede || detalleCita.consultorio || detalleCita.medico?.consultorio?.direccion || '—'}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">ID: {String(detalleCita.id)}</div>
                </div>
              ) : (
                <div className="text-slate-600">Cargando detalles...</div>
              )}

              <DialogFooter>
                {detalleCita && String(detalleCita.estado || detalleCita.estado_cita).toUpperCase() === 'AGENDADA' && (
                  <Button variant="destructive" onClick={() => { if (detalleCita) { setCitaToCancel(String(detalleCita.id)); setCancelDialogOpen(true); } }}>
                    Cancelar Cita
                  </Button>
                )}

                {detalleCita && String(detalleCita.estado || detalleCita.estado_cita).toUpperCase() === 'CONFIRMADA' && (
                  <Button variant="default" onClick={() => { if (detalleCita) startReprogram(detalleCita); }}>
                    Reprogramar
                  </Button>
                )}
                <DialogClose asChild>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">Cerrar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

