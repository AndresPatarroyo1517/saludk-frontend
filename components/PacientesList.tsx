import { Paciente } from '@/lib/api/services/historialMedicoService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Droplets, Calendar } from 'lucide-react';

interface PacientesListProps {
  pacientes: Paciente[];
  pacienteSeleccionado: Paciente | null;
  onSelectPaciente: (pacienteId: string) => void;
}

export default function PacientesList({ pacientes, pacienteSeleccionado, onSelectPaciente }: PacientesListProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {pacientes.map((paciente) => (
          <Card
            key={paciente.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              pacienteSeleccionado?.id === paciente.id 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-slate-200'
            }`}
            onClick={() => onSelectPaciente(paciente.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">
                  {paciente.nombres} {paciente.apellidos}
                </h3>
                <div className="space-y-1 mt-2 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-3 h-3" />
                    <span>ID: {paciente.numero_identificacion}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-3 h-3" />
                    <span>Sangre: {paciente.tipo_sangre}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(paciente.fecha_nacimiento).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {paciente.historial_medico && (
                <Badge variant="secondary" className="ml-2">
                  {paciente.historial_medico.enfermedades_cronicas.length} cond.
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}