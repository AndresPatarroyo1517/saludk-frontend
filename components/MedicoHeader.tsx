import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';

interface MedicoHeaderProps {
  user: any;
  calificaciones: any[];
  calificacionPromedio: number;
  horariosDisponibles: string[];
}

export const MedicoHeader: React.FC<MedicoHeaderProps> = ({
  user,
  calificaciones,
  calificacionPromedio,
  horariosDisponibles
}) => {
  return (
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
  );
};