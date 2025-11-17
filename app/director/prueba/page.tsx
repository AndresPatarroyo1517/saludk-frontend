'use client';

import { useEffect, useState } from 'react';
import { 
  historialMedicoService, 
  Paciente, 
  HistorialMedico as HistorialMedicoType 
} from '@/lib/api/services/historialMedicoService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertCircle, 
  FileText,
  User,
  Plus
} from 'lucide-react';
import PacientesList from '@/components/PacientesList';
import HistorialMedicoView from '@/components/HistorialMedicoView';
import HistorialMedicoEdit from '@/components/HistorialMedicoEdit';

type Modo = 'vista' | 'edicion' | 'creacion';

export default function PruebaPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [historialSeleccionado, setHistorialSeleccionado] = useState<HistorialMedicoType | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [modo, setModo] = useState<Modo>('vista');
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de pacientes
  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        setLoading(true);
        const response = await historialMedicoService.obtenerPacientes();
        setPacientes(response.data);
      } catch (err) {
        setError('Error al cargar los pacientes');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarPacientes();
  }, []);

  // Cargar historial de un paciente
  const cargarHistorialPaciente = async (pacienteId: string) => {
    try {
      setLoadingHistorial(true);
      setError(null);
      const paciente = pacientes.find(p => p.id === pacienteId);
      setPacienteSeleccionado(paciente || null);
      
      const response = await historialMedicoService.obtenerHistorialPaciente(pacienteId);
      setHistorialSeleccionado(response.data);
      setModo('vista');
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No existe historial, permitir crear uno nuevo
        setHistorialSeleccionado(null);
        setModo('creacion');
      } else {
        setError('Error al cargar el historial del paciente');
        console.error('Error:', err);
      }
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleEditarHistorial = () => {
    setModo('edicion');
  };

  const handleCancelarEdicion = () => {
    if (historialSeleccionado) {
      setModo('vista');
    } else {
      setModo('creacion');
    }
  };

  const handleGuardarHistorial = async (historialData: any) => {
    try {
      setLoadingHistorial(true);
      setError(null);
      
      if (!pacienteSeleccionado) return;

      const response = await historialMedicoService.upsertHistorialCompleto(
        pacienteSeleccionado.id,
        historialData
      );
      
      setHistorialSeleccionado(response.data);
      setModo('vista');
      
      // Actualizar la lista de pacientes para reflejar los cambios
      const updatedPacientes = pacientes.map(p => 
        p.id === pacienteSeleccionado.id 
          ? { ...p, historial_medico: { ...p.historial_medico, enfermedades_cronicas: historialData.enfermedades_cronicas } }
          : p
      );
      setPacientes(updatedPacientes);
    } catch (err) {
      setError('Error al guardar el historial médico');
      console.error('Error:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleCrearHistorial = () => {
    if (pacienteSeleccionado) {
      setModo('creacion');
      setHistorialSeleccionado(null);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold">Cargando pacientes...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Gestión de Historial Médico</h1>
        <p className="text-slate-600 mt-2">
          Administra el historial médico de tus pacientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Lista de pacientes */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Pacientes ({pacientes.length})</span>
              </CardTitle>
              <CardDescription>
                Selecciona un paciente para ver su historial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PacientesList
                pacientes={pacientes}
                pacienteSeleccionado={pacienteSeleccionado}
                onSelectPaciente={cargarHistorialPaciente}
              />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Detalles del historial */}
        <div className="lg:col-span-2 space-y-6">
          {!pacienteSeleccionado ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-blue-800">
                    Selecciona un paciente
                  </h3>
                  <p className="text-blue-600 mt-2">
                    Elige un paciente de la lista para ver su historial médico completo
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : loadingHistorial ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span>Cargando historial médico...</span>
                </div>
              </CardContent>
            </Card>
          ) : modo === 'vista' && historialSeleccionado ? (
            <HistorialMedicoView 
              historial={historialSeleccionado}
              onEdit={handleEditarHistorial}
            />
          ) : (modo === 'edicion' || modo === 'creacion') ? (
            <HistorialMedicoEdit
              historial={historialSeleccionado}
              paciente={pacienteSeleccionado}
              onSave={handleGuardarHistorial}
              onCancel={handleCancelarEdicion}
            />
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-orange-800">
                    No hay historial médico
                  </h3>
                  <p className="text-orange-600 mt-2">
                    Este paciente no tiene un historial médico registrado
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={handleCrearHistorial}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Historial</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}