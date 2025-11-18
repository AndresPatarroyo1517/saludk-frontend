'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Star,
  User,
  Pill,
  Calendar,
  Monitor,
  MapPin,
  ShoppingBag,
  AlertCircle,
  Loader2,
  MessageSquare,
  StarHalf
} from 'lucide-react';
import { calificacionesService } from '@/lib/api/services/calificacionesService';

interface CalificacionMedico {
  id: string;
  paciente_id: string;
  medico_id: string;
  cita_id: string;
  puntuacion: string;
  comentario: string | null;
  fecha_creacion: string;
  medico: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  cita: {
    fecha_hora: string;
    modalidad: string;
  };
}

interface CalificacionProducto {
  id: string;
  paciente_id: string;
  producto_id: string;
  compra_id: string;
  puntuacion: string;
  comentario: string | null;
  fecha_creacion: string;
  producto: {
    id: string;
    nombre: string;
    marca: string;
  };
  compra: {
    numero_orden: string;
    fecha_entrega: string | null;
  };
}

interface CalificacionesResponse {
  data: {
    medicos: CalificacionMedico[];
    productos: CalificacionProducto[];
  };
}

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 text-yellow-400 fill-current" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">{rating}.0</span>
    </div>
  );
};

const ModalidadBadge = ({ modalidad }: { modalidad: string }) => {
  const isVirtual = modalidad === 'VIRTUAL';
  
  return (
    <Badge variant={isVirtual ? "default" : "secondary"} className={isVirtual ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
      {isVirtual ? (
        <Monitor className="w-3 h-3 mr-1" />
      ) : (
        <MapPin className="w-3 h-3 mr-1" />
      )}
      {isVirtual ? 'Virtual' : 'Presencial'}
    </Badge>
  );
};

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function MisCalificacionesPage() {
  const { user } = useAuthStore();
  const [calificaciones, setCalificaciones] = useState<CalificacionesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalificaciones = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Usar el servicio para obtener las calificaciones
        const data = await calificacionesService.getCalificacionesGenerales('ambos');
        setCalificaciones(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar las calificaciones');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalificaciones();
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold">Cargando calificaciones...</h2>
            </div>
            
            {/* Skeletons para médicos */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Skeletons para productos */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar las calificaciones: {error}
            </AlertDescription>
          </Alert>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const medicos = calificaciones?.data.medicos || [];
  const productos = calificaciones?.data.productos || [];

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Encabezado */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Mis Calificaciones
            </h1>
            <p className="text-slate-600 mt-2">
              Revisa todas las calificaciones que has realizado
            </p>
          </div>

          {/* Calificaciones de Médicos */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Calificaciones a Médicos
              </h2>
              <Badge variant="outline" className="text-sm">
                {medicos.length} calificación{medicos.length !== 1 ? 'es' : ''}
              </Badge>
            </div>

            {medicos.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No has calificado médicos aún
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Las calificaciones que realices a los médicos aparecerán aquí.
                  </p>
                  <Link href="/dashboard/medicos">
                    <Button>Buscar Médicos</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {medicos.map((calificacion) => (
                  <Card key={calificacion.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Dr. {calificacion.medico.nombres} {calificacion.medico.apellidos}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {formatFecha(calificacion.cita.fecha_hora)}
                          </CardDescription>
                        </div>
                        <ModalidadBadge modalidad={calificacion.cita.modalidad} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <StarRating rating={parseInt(calificacion.puntuacion)} />
                      
                      {calificacion.comentario ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MessageSquare className="w-4 h-4" />
                            Tu comentario:
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border">
                            {calificacion.comentario}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Sin comentario
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Calificado el {formatFecha(calificacion.fecha_creacion)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Calificaciones de Productos */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <Pill className="w-6 h-6 text-green-600" />
                Calificaciones a Productos
              </h2>
              <Badge variant="outline" className="text-sm">
                {productos.length} calificación{productos.length !== 1 ? 'es' : ''}
              </Badge>
            </div>

            {productos.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No has calificado productos aún
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Las calificaciones que realices a productos de la farmacia aparecerán aquí.
                  </p>
                  <Link href="/dashboard/farmacia">
                    <Button>Ir a Farmacia</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productos.map((calificacion) => (
                  <Card key={calificacion.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {calificacion.producto.nombre}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Marca: {calificacion.producto.marca}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          Orden: {calificacion.compra.numero_orden.slice(-6)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <StarRating rating={parseInt(calificacion.puntuacion)} />
                      
                      {calificacion.comentario ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MessageSquare className="w-4 h-4" />
                            Tu comentario:
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border">
                            {calificacion.comentario}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Sin comentario
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Calificado el {formatFecha(calificacion.fecha_creacion)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Resumen General */}
          {(medicos.length > 0 || productos.length > 0) && (
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Total de calificaciones:</span>{' '}
                    {medicos.length + productos.length}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Médicos:</span> {medicos.length} •{' '}
                    <span className="font-medium">Productos:</span> {productos.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}