import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Video, MapPin, Filter, Trash, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { medicosService } from '@/lib/api/services/medicosService';
import { BloqueDisponibilidad, DisponibilidadDia } from '@/types/medicos';

interface DisponibilidadManagerProps {
  user: any;
  fetchUserData: () => Promise<void>;
  modalidadSelect: 'ALL' | 'VIRTUAL' | 'PRESENCIAL';
  setModalidadSelect: (modalidad: 'ALL' | 'VIRTUAL' | 'PRESENCIAL') => void;
}

export const DisponibilidadManager: React.FC<DisponibilidadManagerProps> = ({
  user,
  fetchUserData,
  modalidadSelect,
  setModalidadSelect
}) => {
  const [disponibilidadData, setDisponibilidadData] = useState<DisponibilidadDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDisponibilidad, setOpenDisponibilidad] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [diaSemana, setDiaSemana] = useState<number>(0);
  const [horaInicio, setHoraInicio] = useState<string>('08:00');
  const [horaFin, setHoraFin] = useState<string>('09:00');
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL');
  const [nuevasDisponibilidades, setNuevasDisponibilidades] = useState<Array<any>>([]);
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cargar disponibilidad al montar el componente
  useEffect(() => {
    const cargarDisponibilidad = async () => {
      try {
        setLoading(true);
        const response = await medicosService.getMiDisponibilidad();
        
        if (response.success && response.data?.disponibilidad_por_dia) {
          setDisponibilidadData(response.data.disponibilidad_por_dia);
        } else {
          console.error('Estructura de respuesta inesperada:', response);
          toast.error('Error al cargar la disponibilidad');
        }
      } catch (error: any) {
        console.error('Error cargando disponibilidad:', error);
        toast.error(error.response?.data?.message || 'Error al cargar disponibilidad');
        setDisponibilidadData([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDisponibilidad();
  }, []);

  // Función para recargar la disponibilidad después de cambios
  const recargarDisponibilidad = async () => {
    try {
      const response = await medicosService.getMiDisponibilidad();
      if (response.success && response.data?.disponibilidad_por_dia) {
        setDisponibilidadData(response.data.disponibilidad_por_dia);
      }
    } catch (error) {
      console.error('Error recargando disponibilidad:', error);
    }
  };

  // Función para procesar la disponibilidad del backend
  const procesarDisponibilidad = (): BloqueDisponibilidad[] => {
    if (!disponibilidadData || disponibilidadData.length === 0) return [];

    const todosLosBloques: BloqueDisponibilidad[] = [];
    
    disponibilidadData.forEach((dia: DisponibilidadDia) => {
      dia.bloques.forEach((bloque: BloqueDisponibilidad) => {
        if (bloque.disponible) {
          todosLosBloques.push({
            ...bloque,
            // Añadir información del día para mostrar
            dia_numero: dia.dia_numero,
            dia_nombre: dia.dia_nombre
          } as any);
        }
      });
    });

    // Filtrar por modalidad si no es ALL
    if (modalidadSelect !== 'ALL') {
      return todosLosBloques.filter(bloque => bloque.modalidad === modalidadSelect);
    }

    return todosLosBloques;
  };

  const bloquesDisponibles = procesarDisponibilidad();

  const formatHorario = (bloque: BloqueDisponibilidad) => {
    const horaInicio = bloque.hora_inicio.substring(0, 5);
    const horaFin = bloque.hora_fin.substring(0, 5);
    return `${bloque.dia_nombre}, ${horaInicio} - ${horaFin}`;
  };

  const attemptDeleteDisponibilidad = (bloqueId: string) => {
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bloqueId);
    if (!uuidLike) {
      toast.error('ID de disponibilidad inválido');
      return;
    }
    setPendingDeleteId(bloqueId);
    setOpenDeleteConfirm(true);
  };

  const confirmDeleteDisponibilidad = async () => {
    const bloqueId = pendingDeleteId;
    setOpenDeleteConfirm(false);
    setPendingDeleteId(null);
    if (!bloqueId) return;

    try {
      setDeletingId(bloqueId);
      await medicosService.deleteMiDisponibilidad(bloqueId);
      toast.success('Disponibilidad eliminada');
      // Recargar los datos actualizados
      await recargarDisponibilidad();
      await fetchUserData();
    } catch (err: any) {
      console.error('Error eliminando disponibilidad:', err);
      toast.error(err?.response?.data?.error || 'Error eliminando disponibilidad');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 bg-white shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando disponibilidad...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Horarios Disponibles</CardTitle>
                <CardDescription>Configuración de disponibilidad semanal</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {bloquesDisponibles.length} horarios
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <label className="text-sm font-medium text-slate-700">Filtrar por modalidad:</label>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setModalidadSelect('ALL')} 
              variant={modalidadSelect === 'ALL' ? 'default' : 'outline'}
              className={modalidadSelect === 'ALL' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg' : ''}
              size="sm"
            >
              Todos
            </Button>
            <Button 
              onClick={() => setModalidadSelect('VIRTUAL')} 
              variant={modalidadSelect === 'VIRTUAL' ? 'default' : 'outline'}
              className={modalidadSelect === 'VIRTUAL' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg' : ''}
              size="sm"
            >
              <Video className="w-4 h-4 mr-1" />
              Virtual
            </Button>
            <Button 
              onClick={() => setModalidadSelect('PRESENCIAL')} 
              variant={modalidadSelect === 'PRESENCIAL' ? 'default' : 'outline'}
              className={modalidadSelect === 'PRESENCIAL' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg' : ''}
              size="sm"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Presencial
            </Button>
          </div>

          <div>
            <div className="mb-4">
              <div className="text-sm text-slate-600 mb-2">Horarios configurados:</div>
              {bloquesDisponibles.length === 0 ? (
                <div className="text-sm text-slate-500 py-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <div>No hay horarios disponibles configurados</div>
                  <div className="text-xs mt-1">Agrega tu primera disponibilidad usando el botón inferior</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bloquesDisponibles.map((bloque) => (
                    <div key={bloque.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant={bloque.modalidad === 'VIRTUAL' ? 'default' : 'secondary'}>
                          {bloque.modalidad === 'VIRTUAL' ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                          {bloque.modalidad}
                        </Badge>
                        <span className="text-sm font-medium text-slate-700">
                          {formatHorario(bloque)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        disabled={deletingId === bloque.id}
                        onClick={() => attemptDeleteDisponibilidad(bloque.id)}
                      >
                        {deletingId === bloque.id ? (
                          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t">
            <Dialog open={openDisponibilidad} onOpenChange={setOpenDisponibilidad}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full px-4 py-2 shadow-lg hover:from-blue-700 transition-all duration-200">
                  <Calendar className="w-4 h-4" />
                  {bloquesDisponibles.length === 0 ? 'Configurar Disponibilidad' : 'Añadir Disponibilidad'}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configurar horarios de disponibilidad</DialogTitle>
                  <DialogDescription>
                    Agrega uno o varios horarios para que los pacientes puedan reservar.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Día de la semana</label>
                      <select 
                        value={diaSemana} 
                        onChange={(e) => setDiaSemana(parseInt(e.target.value, 10))} 
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>Domingo</option>
                        <option value={1}>Lunes</option>
                        <option value={2}>Martes</option>
                        <option value={3}>Miércoles</option>
                        <option value={4}>Jueves</option>
                        <option value={5}>Viernes</option>
                        <option value={6}>Sábado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Modalidad</label>
                      <select 
                        value={modalidad} 
                        onChange={(e) => setModalidad(e.target.value as any)} 
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="VIRTUAL">Virtual</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Hora inicio</label>
                      <Input 
                        type="time" 
                        value={horaInicio} 
                        onChange={(e) => setHoraInicio(e.target.value)} 
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Hora fin</label>
                      <Input 
                        type="time" 
                        value={horaFin} 
                        onChange={(e) => setHoraFin(e.target.value)} 
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button" 
                      onClick={() => {
                        const item = {
                          dia_semana: diaSemana,
                          hora_inicio: `${horaInicio}:00`,
                          hora_fin: `${horaFin}:00`,
                          modalidad
                        };
                        setNuevasDisponibilidades(prev => [...prev, item]);
                      }} 
                      size="sm"
                      variant="outline"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Agregar horario
                    </Button>

                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => { setNuevasDisponibilidades([]); }}
                      disabled={nuevasDisponibilidades.length === 0}
                    >
                      Limpiar
                    </Button>
                  </div>

                  {nuevasDisponibilidades.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-2 text-slate-700">Horarios a guardar:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {nuevasDisponibilidades.map((h, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-blue-50 p-2 rounded-md border border-blue-200">
                            <div className="text-sm text-slate-700">
                              <span className="font-medium">
                                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][h.dia_semana]}
                              </span>
                              {' '}{h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)} • 
                              <Badge variant="outline" className="ml-2 text-xs">
                                {h.modalidad}
                              </Badge>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setNuevasDisponibilidades(prev => prev.filter((_, i) => i !== idx))}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="mt-6">
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setOpenDisponibilidad(false);
                        setNuevasDisponibilidades([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      onClick={async () => {
                        if (nuevasDisponibilidades.length === 0) {
                          toast.error('Añade al menos un horario antes de guardar.');
                          return;
                        }
                        try {
                          setSaving(true);
                          await medicosService.setMiDisponibilidad({ disponibilidades: nuevasDisponibilidades });
                          toast.success('Disponibilidad guardada con éxito.');
                          await recargarDisponibilidad();
                          await fetchUserData();
                          setNuevasDisponibilidades([]);
                          setOpenDisponibilidad(false);
                        } catch (err: any) {
                          console.error('Error guardando disponibilidad', err);
                          toast.error(err.response?.data?.message || 'Error al guardar disponibilidad');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving || nuevasDisponibilidades.length === 0}
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        `Guardar (${nuevasDisponibilidades.length})`
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="w-5 h-5 text-red-500" />
              Eliminar disponibilidad
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar esta disponibilidad? Los pacientes ya no podrán agendar citas en este horario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <div className="flex items-center justify-end gap-2 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { 
                  setOpenDeleteConfirm(false); 
                  setPendingDeleteId(null); 
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={confirmDeleteDisponibilidad}
                disabled={deletingId !== null}
              >
                {deletingId ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};