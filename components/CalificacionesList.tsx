import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, Calendar, Video, MapPin } from 'lucide-react';
import { Calificacion } from '@/types/medicos';

interface CalificacionesListProps {
  calificaciones: Calificacion[];
  calificacionPromedio: number;
  getNombrePaciente: (calificacion: Calificacion) => string;
  formatFecha: (fecha: string) => string;
}

export const CalificacionesList: React.FC<CalificacionesListProps> = ({
  calificaciones,
  calificacionPromedio,
  getNombrePaciente,
  formatFecha
}) => {
  return (
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
  );
};