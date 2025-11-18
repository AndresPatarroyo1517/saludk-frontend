"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import { medicosService } from "@/lib/api/services/medicosService";
import { Search, MapPin, Award, Phone, CreditCard, Stethoscope, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Medico {
  id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  especialidad: string;
  registro_medico: string;
  calificacion_promedio: number;
  costo_consulta_presencial: number;
  costo_consulta_virtual: number;
  localidad: string;
  telefono: string;
  tiene_disponibilidad: boolean;
  modalidades_disponibles: string[];
}

export default function Home() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("");
  const [localidadFilter, setLocalidadFilter] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDoctors() {
      setLoading(true);
      setError(null);
      try {
        const filtros: any = {};
        if (especialidadFilter) filtros.especialidad = especialidadFilter;
        if (localidadFilter) filtros.localidad = localidadFilter;

        const response = await medicosService.getMedicos(filtros);
        
        if (!response.success) {
          throw new Error("Error en la respuesta del servidor");
        }

        if (mounted) {
          setDoctors(response.data.medicos);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Error al cargar médicos");
          setDoctors([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDoctors();
    return () => {
      mounted = false;
    };
  }, [especialidadFilter, localidadFilter]);

  const filteredDoctors = doctors.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.nombre_completo.toLowerCase().includes(term) ||
      doc.especialidad.toLowerCase().includes(term)
    );
  });

  const getInitials = (nombres: string, apellidos: string): string => {
    const firstInitial = nombres.charAt(0).toUpperCase();
    const lastInitial = apellidos.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const hasActiveFilters = especialidadFilter || localidadFilter;

  return (
    <ProtectedRoute allowedRoles={["paciente"]}>
      <DashboardLayout>
        <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Directorio de Médicos
              </h1>
              <p className="text-lg text-slate-600">
                Encuentra al especialista ideal para tu salud
              </p>
            </div>

            {/* Search & Filters */}
            <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="Buscar por nombre o especialidad..."
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={especialidadFilter}
                      onChange={(e) => setEspecialidadFilter(e.target.value)}
                      placeholder="Filtrar por especialidad"
                      className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={localidadFilter}
                      onChange={(e) => setLocalidadFilter(e.target.value)}
                      placeholder="Filtrar por localidad"
                      className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
                    />
                  </div>
                  {hasActiveFilters && (
                    <Button
                      onClick={() => {
                        setEspecialidadFilter("");
                        setLocalidadFilter("");
                      }}
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 border-slate-200 hover:bg-slate-100"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Doctors List */}
            <div className="space-y-4">
              {loading ? (
                <Card className="p-12 text-center border-0 shadow-lg bg-white">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-slate-600">Cargando médicos...</p>
                  </div>
                </Card>
              ) : error ? (
                <Card className="p-12 text-center border-0 shadow-lg bg-white">
                  <p className="text-red-600 font-semibold mb-4">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Reintentar
                  </Button>
                </Card>
              ) : doctors.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow-lg bg-white">
                  <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">No se encontraron médicos disponibles</p>
                </Card>
              ) : filteredDoctors.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow-lg bg-white">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">No se encontraron médicos con esos criterios</p>
                </Card>
              ) : (
                filteredDoctors.map((doc) => (
                  <Card
                    key={doc.id}
                    className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl shrink-0 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <span className="text-2xl font-bold text-white">
                            {getInitials(doc.nombres, doc.apellidos)}
                          </span>
                        </div>

                        {/* Info Principal */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 mb-1">
                                {doc.nombre_completo}
                              </h3>
                              <p className="text-slate-600 font-medium">{doc.especialidad}</p>
                            </div>
                            
                            {/* Rating */}
                            {doc.calificacion_promedio > 0 && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">
                                ★ {doc.calificacion_promedio.toFixed(1)}
                              </Badge>
                            )}
                          </div>

                          {/* Detalles en grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="truncate">{doc.localidad}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-slate-600">
                              <Award className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="truncate">{doc.registro_medico}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="truncate">{doc.telefono}</span>
                            </div>
                            
                            {doc.costo_consulta_presencial > 0 && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="font-semibold truncate">
                                  ${doc.costo_consulta_presencial.toLocaleString('es-CO')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Modalidades */}
                          {doc.modalidades_disponibles.length > 0 && (
                            <div className="flex items-center gap-2 mt-3">
                              {doc.modalidades_disponibles.map((modalidad) => (
                                <Badge 
                                  key={modalidad}
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  {modalidad}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </DashboardLayout>
    </ProtectedRoute>
  );
}