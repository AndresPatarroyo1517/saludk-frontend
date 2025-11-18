'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useCitasStore } from '@/lib/store/citasStore';
import medicoService from '@/lib/api/services/medicosService';
import { 
  CalendarDays, 
  Filter, 
  Clock, 
  Users, 
  Calendar,
  MapPin,
  Video,
  AlertCircle,
  Loader2,
  User,
  Star
} from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { format, isToday, isThisMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface Cita {
  id: string;
  fecha_hora: string;
  modalidad: 'VIRTUAL' | 'PRESENCIAL';
  estado: 'AGENDADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';
  motivo_consulta: string | null;
  enlace_virtual: string | null;
  paciente: {
    id: string;
    nombre_completo: string;
    telefono: string;
  };
}

interface Disponibilidad {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

export default function MedicoHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { stats, setStats } = useCitasStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modoHoy, setModoHoy] = useState<"total" | "agendadas" | "confirmadas">("total");
  const [modoMes, setModoMes] = useState<"total" | "agendadas" | "confirmadas">("total");
  const [citasModo, setCitasModo] = useState<"hoy" | "mes">("hoy");

  // Función para rotar entre modos
  const rotarModo = (modo: "total" | "agendadas" | "confirmadas") => {
    if (modo === "total") return "agendadas";
    if (modo === "agendadas") return "confirmadas";
    return "total";
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setError(null);
        const response = await medicoService.getEstadisticasMedico(user.id);
        setStats(response.data);
      } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        setError('No se pudieron cargar las estadísticas. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, setStats]);

  // Estado de carga
  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold">Cargando dashboard...</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró información del médico.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // CÁLCULOS CORREGIDOS - Usando los datos de stats directamente
  const totalHoy = stats?.total_hoy ? Object.values(stats.total_hoy).reduce((a, b) => a + b, 0) : 0;
  const totalMes = stats?.total_mes ? Object.values(stats.total_mes).reduce((a, b) => a + b, 0) : 0;

  const valorHoy =
    modoHoy === "total" ? totalHoy :
    modoHoy === "agendadas" ? (stats?.total_hoy?.AGENDADA ?? 0) :
    (stats?.total_hoy?.CONFIRMADA ?? 0);

  const valorMes =
    modoMes === "total" ? totalMes :
    modoMes === "agendadas" ? (stats?.total_mes?.AGENDADA ?? 0) :
    (stats?.total_mes?.CONFIRMADA ?? 0);

  // CORRECCIÓN: Usar las citas de stats en lugar de user.proximas_citas
  const citasParaMostrar = citasModo === "hoy" 
    ? (stats?.proximas_citas_hoy || [])
    : (stats?.citas_mes || []);

  // Obtener fechas con citas para el calendario
  const citasFechas = (stats?.citas_mes || []).map((cita: any) => 
    new Date(cita.fecha)
  );

  // Configuraciones de modos
  const colorModo = { 
    total: "bg-slate-50 border-slate-200", 
    agendadas: "bg-blue-50 border-blue-200", 
    confirmadas: "bg-green-50 border-green-200" 
  };

  const labelModo = { 
    total: "Total", 
    agendadas: "Agendadas", 
    confirmadas: "Confirmadas" 
  };

  const anim = "transition-all duration-300 ease-out transform";

  return (
    <div className="p-6 space-y-8">
      {/* Encabezado */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Bienvenido, {user.datos_personales?.nombres ? `Dr. ${user.datos_personales.nombres}` : 'Médico'}
          </h1>
          <p className="text-slate-600 mt-2">
            {user.datos_personales?.especialidad || 'Especialista'} • 
            Calificación: {user.datos_personales?.calificacion_promedio || '0'} ⭐
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {user.datos_personales?.especialidad || 'Médico'}
        </Badge>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Citas Hoy */}
        <Card 
          className={`${colorModo[modoHoy]} cursor-pointer hover:shadow-md ${anim}`}
          onClick={() => setModoHoy(rotarModo(modoHoy))}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Citas {labelModo[modoHoy]} de Hoy
            </CardTitle>
            <Filter className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{valorHoy}</div>
            <p className="text-xs text-slate-600 mt-1">
              Haz clic para cambiar vista
            </p>
          </CardContent>
        </Card>

        {/* Citas Mes */}
        <Card 
          className={`${colorModo[modoMes]} cursor-pointer hover:shadow-md ${anim}`}
          onClick={() => setModoMes(rotarModo(modoMes))}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Citas {labelModo[modoMes]} del Mes
            </CardTitle>
            <Calendar className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{valorMes}</div>
            <p className="text-xs text-slate-600 mt-1">
              Haz clic para cambiar vista
            </p>
          </CardContent>
        </Card>

        {/* Pacientes Atendidos */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Pacientes Atendidos
            </CardTitle>
            <Users className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {stats?.total_mes_completadas ?? 0}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Citas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Próximas Citas */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-slate-800">
                  {citasModo === "hoy" ? "Citas de Hoy" : "Citas del Mes"}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={citasModo === "hoy" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCitasModo("hoy")}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant={citasModo === "mes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCitasModo("mes")}
                  >
                    Este Mes
                  </Button>
                </div>
              </div>
              <CardDescription>
                {citasModo === "hoy" 
                  ? "Citas programadas para hoy" 
                  : "Todas las citas del mes actual"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {citasParaMostrar.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No hay citas {citasModo === "hoy" ? "para hoy" : "este mes"}</p>
                </div>
              ) : (
                citasParaMostrar.map((cita: any) => (
                  <div key={cita.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-full ${
                        cita.modalidad === 'VIRTUAL' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {cita.modalidad === 'VIRTUAL' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-semibold text-slate-800">
                            {cita.paciente || 'Paciente'}
                          </p>
                          <Badge variant={
                            cita.estado === 'CONFIRMADA' ? 'default' : 
                            cita.estado === 'AGENDADA' ? 'secondary' : 'outline'
                          }>
                            {cita.estado}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {cita.fecha_hora 
                                ? format(parseISO(cita.fecha_hora), "HH:mm")
                                : cita.fecha
                                ? format(parseISO(cita.fecha), "HH:mm")
                                : "Hora no disponible"
                              }
                            </span>
                          </div>
                          <span className="capitalize">{(cita.modalidad || '').toLowerCase()}</span>
                          {cita.motivo_consulta && (
                            <span className="text-slate-500 truncate flex-1">
                              {cita.motivo_consulta}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button className='cursor-pointer' variant="outline" size="sm" onClick={() => router.push(`/medico/citas/${cita.id}`)}>
                      Ver Detalles
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - Calendario y Disponibilidad */}
        <div className="space-y-6">
          {/* Calendario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <span>Calendario</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                locale={es}
                showOutsideDays
                selected={new Date()}
                modifiers={{ 
                  today: new Date(), 
                  citas: citasFechas 
                }}
                modifiersClassNames={{ 
                  today: '!bg-blue-600 !text-white !rounded-full', 
                  citas: '!bg-green-200 !text-green-800 !font-bold !rounded-full' 
                }}
                className="mx-auto"
              />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                  <span className="text-slate-600">Días con citas</span>
                </div>
                <div className="text-slate-500">
                  Hoy: {format(new Date(), 'PPPP', { locale: es })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disponibilidad */}
          {(user.disponibilidades || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-slate-800">
                  Tu Disponibilidad
                </CardTitle>
                <CardDescription>
                  Horarios establecidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.disponibilidades?.map((disp: any) => {
                  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  return (
                    <div key={disp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="font-medium text-slate-700">
                        {diasSemana[parseInt(disp.dia_semana)]}
                      </span>
                      <span className="text-sm text-slate-600">
                        {disp.hora_inicio.slice(0, 5)} - {disp.hora_fin.slice(0, 5)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Información Rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-600" />
                <span>Información Rápida</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Calificación:</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{user.datos_personales?.calificacion_promedio || '0.00'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Próximas citas:</span>
                <span className="font-medium">{user.proximas_citas?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Disponibilidad:</span>
                <span className="font-medium text-green-600">Activa</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}