import { useState } from 'react';
import { HistorialMedico, EnfermedadCronica, CirugiaPrevia, MedicamentoActual } from '@/lib/api/services/historialMedicoService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Stethoscope, Pill, User, Plus, Trash2, Save, X } from 'lucide-react';

interface HistorialMedicoEditProps {
  historial: HistorialMedico | null;
  paciente: any;
  onSave: (historialData: any) => void;
  onCancel: () => void;
}

export default function HistorialMedicoEdit({ historial, paciente, onSave, onCancel }: HistorialMedicoEditProps) {
  const [enfermedades, setEnfermedades] = useState<EnfermedadCronica[]>(
    historial?.enfermedades_cronicas || []
  );
  const [cirugias, setCirugias] = useState<CirugiaPrevia[]>(
    historial?.cirugias_previas || []
  );
  const [medicamentos, setMedicamentos] = useState<MedicamentoActual[]>(
    historial?.medicamentos_actuales || []
  );

  const addEnfermedad = () => {
    setEnfermedades([...enfermedades, { nombre: '', desde: '', tratamiento: '', estado: 'controlada' }]);
  };

  const removeEnfermedad = (index: number) => {
    setEnfermedades(enfermedades.filter((_, i) => i !== index));
  };

  const updateEnfermedad = (index: number, field: string, value: string) => {
    const updated = [...enfermedades];
    updated[index] = { ...updated[index], [field]: value };
    setEnfermedades(updated);
  };

  const addCirugia = () => {
    setCirugias([...cirugias, { nombre: '', fecha: '', hospital: '', complicaciones: 'Ninguna' }]);
  };

  const removeCirugia = (index: number) => {
    setCirugias(cirugias.filter((_, i) => i !== index));
  };

  const updateCirugia = (index: number, field: string, value: string) => {
    const updated = [...cirugias];
    updated[index] = { ...updated[index], [field]: value };
    setCirugias(updated);
  };

  const addMedicamento = () => {
    setMedicamentos([...medicamentos, { nombre: '', dosis: '', frecuencia: '', desde: '', prescrito_por: '' }]);
  };

  const removeMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const updateMedicamento = (index: number, field: string, value: string) => {
    const updated = [...medicamentos];
    updated[index] = { ...updated[index], [field]: value };
    setMedicamentos(updated);
  };

  const handleSave = () => {
    onSave({
      enfermedades_cronicas: enfermedades,
      cirugias_previas: cirugias,
      medicamentos_actuales: medicamentos,
    });
  };

  return (
    <div className="space-y-6">
      {/* Información del paciente */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-blue-800">
                  {paciente?.nombres} {paciente?.apellidos}
                </CardTitle>
                <p className="text-blue-700">
                  ID: {paciente?.numero_identificacion} | 
                  Tipo de sangre: {paciente?.tipo_sangre}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </Button>
              <Button onClick={onCancel} variant="outline" className="flex items-center space-x-2">
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enfermedades Crónicas */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle>Enfermedades Crónicas</CardTitle>
              <Badge variant="secondary">{enfermedades.length}</Badge>
            </div>
            <Button onClick={addEnfermedad} variant="outline" size="sm" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {enfermedades.map((enfermedad, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-800">Enfermedad #{index + 1}</h4>
                <Button
                  onClick={() => removeEnfermedad(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Nombre</label>
                  <Input
                    value={enfermedad.nombre}
                    onChange={(e) => updateEnfermedad(index, 'nombre', e.target.value)}
                    placeholder="Ej: Diabetes Mellitus Tipo 2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Estado</label>
                  <select
                    value={enfermedad.estado}
                    onChange={(e) => updateEnfermedad(index, 'estado', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="controlada">Controlada</option>
                    <option value="activa">Activa</option>
                    <option value="en_tratamiento">En Tratamiento</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Desde</label>
                  <Input
                    type="date"
                    value={enfermedad.desde}
                    onChange={(e) => updateEnfermedad(index, 'desde', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Tratamiento</label>
                  <Textarea
                    value={enfermedad.tratamiento}
                    onChange={(e) => updateEnfermedad(index, 'tratamiento', e.target.value)}
                    placeholder="Descripción del tratamiento..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          {enfermedades.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay enfermedades crónicas registradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cirugías Previas */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-purple-600" />
              <CardTitle>Cirugías Previas</CardTitle>
              <Badge variant="secondary">{cirugias.length}</Badge>
            </div>
            <Button onClick={addCirugia} variant="outline" size="sm" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {cirugias.map((cirugia, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-800">Cirugía #{index + 1}</h4>
                <Button
                  onClick={() => removeCirugia(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Nombre</label>
                  <Input
                    value={cirugia.nombre}
                    onChange={(e) => updateCirugia(index, 'nombre', e.target.value)}
                    placeholder="Ej: Apendicectomía"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Fecha</label>
                  <Input
                    type="date"
                    value={cirugia.fecha}
                    onChange={(e) => updateCirugia(index, 'fecha', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Hospital</label>
                  <Input
                    value={cirugia.hospital}
                    onChange={(e) => updateCirugia(index, 'hospital', e.target.value)}
                    placeholder="Nombre del hospital"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Complicaciones</label>
                  <Input
                    value={cirugia.complicaciones}
                    onChange={(e) => updateCirugia(index, 'complicaciones', e.target.value)}
                    placeholder="Ej: Ninguna, Infección, etc."
                  />
                </div>
              </div>
            </div>
          ))}
          {cirugias.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Stethoscope className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay cirugías previas registradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicamentos Actuales */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pill className="w-5 h-5 text-blue-600" />
              <CardTitle>Medicamentos Actuales</CardTitle>
              <Badge variant="secondary">{medicamentos.length}</Badge>
            </div>
            <Button onClick={addMedicamento} variant="outline" size="sm" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicamentos.map((medicamento, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-800">Medicamento #{index + 1}</h4>
                <Button
                  onClick={() => removeMedicamento(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Nombre</label>
                  <Input
                    value={medicamento.nombre}
                    onChange={(e) => updateMedicamento(index, 'nombre', e.target.value)}
                    placeholder="Ej: Losartán"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Dosis</label>
                  <Input
                    value={medicamento.dosis}
                    onChange={(e) => updateMedicamento(index, 'dosis', e.target.value)}
                    placeholder="Ej: 50mg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Frecuencia</label>
                  <Input
                    value={medicamento.frecuencia}
                    onChange={(e) => updateMedicamento(index, 'frecuencia', e.target.value)}
                    placeholder="Ej: Cada 24 horas"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Desde</label>
                  <Input
                    type="date"
                    value={medicamento.desde}
                    onChange={(e) => updateMedicamento(index, 'desde', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Prescrito por</label>
                  <Input
                    value={medicamento.prescrito_por}
                    onChange={(e) => updateMedicamento(index, 'prescrito_por', e.target.value)}
                    placeholder="Ej: Dr. Juan Pérez"
                  />
                </div>
              </div>
            </div>
          ))}
          {medicamentos.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay medicamentos actuales registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}