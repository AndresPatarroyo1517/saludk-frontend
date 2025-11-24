'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { calificacionesService } from '@/lib/api/services/calificacionesService';
import { useEffect, useState } from 'react';
import { MedicoHeader } from '@/components/MedicoHeader';
import { DisponibilidadManager } from '@/components/DisponibilidadManager';
import { CalificacionesList } from '@/components/CalificacionesList';
import { Calificacion } from '@/types/medicos';

export default function MedicoHome() {
  const { user, fetchUserData } = useAuthStore();
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [modalidadSelect, setModalidadSelect] = useState<'ALL' | 'VIRTUAL' | 'PRESENCIAL'>('ALL');

  const medicoId = user?.datos_personales?.id || (user as any)?.medico_id || user?.id;
  const calificacionPromedioFromAPI = user?.datos_personales?.calificacion_promedio;

  const parsedCalificacionPromedioFromAPI =
    typeof calificacionPromedioFromAPI === 'number'
      ? calificacionPromedioFromAPI
      : calificacionPromedioFromAPI
      ? parseFloat(String(calificacionPromedioFromAPI))
      : undefined;

  const calificacionPromedio = (typeof parsedCalificacionPromedioFromAPI === 'number' && !isNaN(parsedCalificacionPromedioFromAPI))
    ? parsedCalificacionPromedioFromAPI
    : calificaciones.length > 0
      ? calificaciones.reduce((acc, curr) => acc + parseInt(curr.puntuacion, 10), 0) / calificaciones.length
      : 0;

  useEffect(() => {
    setIsVisible(true);
    const fetchCalificaciones = async () => {
      if (!user || user.rol !== 'medico' || !medicoId) {
        setError('Usuario no autorizado o no es médico');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await calificacionesService.getCalificacionesMedico(medicoId);
        
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

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNombrePaciente = (calificacion: Calificacion) => {
    return `${calificacion.paciente.nombres} ${calificacion.paciente.apellidos}`;
  };

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
        
        <MedicoHeader
          user={user}
          calificaciones={calificaciones}
          calificacionPromedio={calificacionPromedio}
          horariosDisponibles={horariosDisponibles}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda - Gestión de disponibilidad */}
          <div className="lg:col-span-1 space-y-6">
            <DisponibilidadManager
              user={user}
              fetchUserData={fetchUserData}
              modalidadSelect={modalidadSelect}
              setModalidadSelect={setModalidadSelect}
            />
          </div>

          {/* Columna derecha - Calificaciones */}
          <div className="lg:col-span-1">
            <CalificacionesList
              calificaciones={calificaciones}
              calificacionPromedio={calificacionPromedio}
              getNombrePaciente={getNombrePaciente}
              formatFecha={formatFecha}
            />
          </div>
        </div>
      </div>
    </div>
  );
}