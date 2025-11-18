'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Loader2, 
  User, 
  Calendar, 
  FileText, 
  CreditCard, 
  MapPin,
  Droplets,
  Shield,
  Phone,
  Mail,
  IdCard,
  Cake
} from 'lucide-react';
import Link from 'next/link';

export default function InfoPage() {
  const { user, isLoading, error, fetchUserData } = useAuthStore();

  // ✅ Refrescar datos al montar el componente
  useEffect(() => {
    const refreshData = async () => {
      try {
        await fetchUserData();
      } catch (error) {
        console.error('❌ [InfoPage] Error al refrescar datos:', error);
      }
    };

    refreshData();
  }, []);

  // ✅ Estado de carga
  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold">Cargando información...</h2>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ✅ Estado de error
  if (error) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar la información: {error}
            </AlertDescription>
          </Alert>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se encontró información del usuario.
            </AlertDescription>
          </Alert>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['paciente']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Mi Información Personal
              </h1>
              <p className="text-slate-600 mt-2">
                Gestiona y visualiza toda tu información médica y personal
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                Volver al Dashboard
              </Button>
            </Link>
          </div>

          {/* Datos Personales */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <CardTitle>Datos Personales</CardTitle>
              </div>
              <CardDescription>
                Información básica y de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grid de información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Nombres</label>
                    <p className="text-slate-900 mt-1">{user.datos_personales?.nombres}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Apellidos</label>
                    <p className="text-slate-900 mt-1">{user.datos_personales?.apellidos}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-900">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Teléfono</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-900">{user.datos_personales?.telefono}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Cake className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-900">
                        {user.datos_personales?.fecha_nacimiento 
                          ? new Date(user.datos_personales.fecha_nacimiento).toLocaleDateString('es-ES')
                          : 'No especificado'
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Género</label>
                    <p className="text-slate-900 mt-1">{user.datos_personales?.genero || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Tipo de Sangre</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Droplets className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-900">{user.datos_personales?.tipo_sangre || 'No especificado'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Identificación</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <IdCard className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-900">
                        {user.datos_personales?.tipo_identificacion} {user.datos_personales?.numero_identificacion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alergias */}
              {user.datos_personales?.alergias && user.datos_personales.alergias.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Alergias</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.datos_personales.alergias.map((alergia: any, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                        {alergia}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Direcciones */}
              {user.datos_personales?.direcciones && user.datos_personales.direcciones.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Direcciones</label>
                  <div className="space-y-3 mt-2">
                    {user.datos_personales.direcciones.map((direccion: any) => (
                      <div key={direccion.id} className="p-3 border rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                          <div>
                            <p className="font-medium">{direccion.direccion_completa}</p>
                            <p className="text-sm text-slate-600">
                              {direccion.ciudad}, {direccion.departamento}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {direccion.tipo}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial Médico */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <CardTitle>Historial Médico</CardTitle>
              </div>
              <CardDescription>
                Información médica y tratamientos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enfermedades Crónicas */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3">Enfermedades Crónicas</h4>
                {user.historial_medico?.enfermedades_cronicas && 
                 user.historial_medico.enfermedades_cronicas.length > 0 ? (
                  <div className="space-y-3">
                    {(user.historial_medico.enfermedades_cronicas as any[]).map((enfermedad: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{enfermedad.nombre || enfermedad}</p>
                            {enfermedad.estado && (
                              <p className="text-sm text-slate-600">Estado: {enfermedad.estado}</p>
                            )}
                            {enfermedad.tratamiento && (
                              <p className="text-sm text-slate-600">Tratamiento: {enfermedad.tratamiento}</p>
                            )}
                          </div>
                          {(enfermedad.desde) && (
                            <Badge variant="outline">
                              {enfermedad.desde ? `Desde ${new Date(enfermedad.desde).toLocaleDateString('es-ES')}` : 'Fecha no disponible'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No hay enfermedades crónicas registradas</p>
                )}
              </div>

              {/* Cirugías Previas */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3">Cirugías Previas</h4>
                {user.historial_medico?.cirugias_previas && 
                 user.historial_medico.cirugias_previas.length > 0 ? (
                  <div className="space-y-3">
                    {(user.historial_medico.cirugias_previas as any[]).map((cirugia: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <p className="font-medium">{cirugia.nombre || cirugia}</p>
                        {cirugia.hospital && (
                          <p className="text-sm text-slate-600">Hospital: {cirugia.hospital}</p>
                        )}
                        {cirugia.fecha && (
                          <p className="text-sm text-slate-600">
                            Fecha: {new Date(cirugia.fecha).toLocaleDateString('es-ES')}
                          </p>
                        )}
                        {cirugia.complicaciones && (
                          <p className="text-sm text-slate-600">Complicaciones: {cirugia.complicaciones}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No hay cirugías previas registradas</p>
                )}
              </div>

              {/* Medicamentos Actuales */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3">Medicamentos Actuales</h4>
                {user.historial_medico?.medicamentos_actuales && 
                 user.historial_medico.medicamentos_actuales.length > 0 ? (
                  <div className="space-y-3">
                    {(user.historial_medico.medicamentos_actuales as any[]).map((medicamento: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{medicamento.nombre || medicamento}</p>
                            {medicamento.dosis && (
                              <p className="text-sm text-slate-600">Dosis: {medicamento.dosis}</p>
                            )}
                            {medicamento.frecuencia && (
                              <p className="text-sm text-slate-600">Frecuencia: {medicamento.frecuencia}</p>
                            )}
                            {medicamento.prescrito_por && (
                              <p className="text-sm text-slate-600">Prescrito por: {medicamento.prescrito_por}</p>
                            )}
                          </div>
                          {medicamento.desde && (
                            <Badge variant="outline">
                              Desde {new Date(medicamento.desde).toLocaleDateString('es-ES')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No hay medicamentos actuales registrados</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Activo */}
          {user.plan_activo && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <CardTitle>Plan de Suscripción</CardTitle>
                </div>
                <CardDescription>
                  Información de tu plan actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Detalles del Plan</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Plan:</span>
                        <span className="font-medium">{user.plan_activo?.plan?.nombre || 'Sin plan activo'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Estado:</span>
                        <Badge variant={user.plan_activo?.estado === 'ACTIVA' ? 'default' : 'secondary'}>
                          {user.plan_activo?.estado}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Fecha Inicio:</span>
                        <span>{new Date(user.plan_activo?.fecha_inicio).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Fecha Vencimiento:</span>
                        <span>{new Date(user.plan_activo?.fecha_vencimiento).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Auto Renovable:</span>
                        <span>{user.plan_activo.auto_renovable ? 'Sí' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Consultas Disponibles</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>Consultas Virtuales</span>
                        </div>
                        <Badge variant="outline">
                          {user.plan_activo.consultas_virtuales.disponibles} / {user.plan_activo.consultas_virtuales.incluidas}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span>Consultas Presenciales</span>
                        </div>
                        <Badge variant="outline">
                          {user.plan_activo.consultas_presenciales.disponibles} / {user.plan_activo.consultas_presenciales.incluidas}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beneficios */}
                <div className="mt-6">
                  <h4 className="font-medium text-slate-800 mb-3">Beneficios Incluidos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {user.plan_activo?.plan?.beneficios.map((beneficio: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{beneficio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Órdenes de Pago Recientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <CardTitle>Historial de Pagos</CardTitle>
              </div>
              <CardDescription>
                Tus transacciones y órdenes de pago recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.ordenes_pago && user.ordenes_pago.length > 0 ? (
                <div className="space-y-3">
                  {user.ordenes_pago.map((orden: any) => (
                    <div key={orden.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Orden #{orden.id.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-slate-600">
                            {new Date(orden.fecha_creacion).toLocaleDateString('es-ES')}
                          </p>
                          <p className="text-sm text-slate-600">
                            Tipo: {orden.tipo_orden} • Método: {orden.metodo_pago}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${parseFloat(orden.monto).toLocaleString('es-ES')}
                          </p>
                          <Badge 
                            variant={
                              orden.estado === 'COMPLETADA' ? 'default' : 
                              orden.estado === 'PENDIENTE' ? 'secondary' : 'destructive'
                            }
                          >
                            {orden.estado}
                          </Badge>
                          {orden.fecha_pago && (
                            <p className="text-xs text-slate-500 mt-1">
                              Pagado: {new Date(orden.fecha_pago).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No hay órdenes de pago registradas</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}