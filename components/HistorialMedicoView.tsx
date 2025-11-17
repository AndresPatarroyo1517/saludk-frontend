import { HistorialMedico } from '@/lib/api/services/historialMedicoService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Stethoscope, Pill, User, Edit } from 'lucide-react';

interface HistorialMedicoViewProps {
  historial: HistorialMedico;
  onEdit: () => void;
}

export default function HistorialMedicoView({ historial, onEdit }: HistorialMedicoViewProps) {
  return (
    <div className="space-y-6">
      {/* Información del paciente */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <CardTitle className="text-green-800">
                  {historial.paciente.nombres} {historial.paciente.apellidos}
                </CardTitle>
                <p className="text-green-700">
                  ID: {historial.paciente.numero_identificacion} | 
                  Tipo de sangre: {historial.paciente.tipo_sangre}
                </p>
              </div>
            </div>
            <Button onClick={onEdit} className="flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Editar Historial</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Enfermedades Crónicas */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <CardTitle>Enfermedades Crónicas</CardTitle>
            <Badge variant="secondary">
              {historial.enfermedades_cronicas.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {historial.enfermedades_cronicas.map((enfermedad, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-800 text-lg">{enfermedad.nombre}</h4>
                <Badge 
                  variant={enfermedad.estado === 'controlada' ? 'default' : 'destructive'}
                >
                  {enfermedad.estado}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium">Tratamiento:</span> {enfermedad.tratamiento}</p>
                <p><span className="font-medium">Desde:</span> {new Date(enfermedad.desde).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cirugías Previas */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-purple-600" />
            <CardTitle>Cirugías Previas</CardTitle>
            <Badge variant="secondary">
              {historial.cirugias_previas.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {historial.cirugias_previas.map((cirugia, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-800 text-lg">{cirugia.nombre}</h4>
                <span className="text-sm text-slate-500">
                  {new Date(cirugia.fecha).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium">Hospital:</span> {cirugia.hospital}</p>
                {cirugia.complicaciones && cirugia.complicaciones !== 'Ninguna' && (
                  <p className="text-orange-600">
                    <span className="font-medium">Complicaciones:</span> {cirugia.complicaciones}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Medicamentos Actuales */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <CardTitle>Medicamentos Actuales</CardTitle>
            <Badge variant="secondary">
              {historial.medicamentos_actuales.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {historial.medicamentos_actuales.map((medicamento, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white">
              <h4 className="font-semibold text-slate-800 text-lg mb-2">{medicamento.nombre}</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium">Dosis:</span> {medicamento.dosis}</p>
                <p><span className="font-medium">Frecuencia:</span> {medicamento.frecuencia}</p>
                <p><span className="font-medium">Prescrito por:</span> {medicamento.prescrito_por}</p>
                <p><span className="font-medium">Desde:</span> {new Date(medicamento.desde).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}