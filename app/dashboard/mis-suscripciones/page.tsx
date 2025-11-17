'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import pagoService from '@/lib/api/services/pagoService';
import Link from 'next/link';
import {
    CreditCard,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    RefreshCw,
    Package,
    Video,
    Building,
    TrendingUp,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';

interface Plan {
    id: string;
    nombre: string;
    codigo: string;
    precio_mensual: string;
    duracion_meses: string;
}

// ✅ Estados según DDL de la tabla suscripcion
type EstadoSuscripcion = 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'PAUSADA';

interface Suscripcion {
    id: string;
    paciente_id: string;
    plan_id: string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    estado: EstadoSuscripcion;
    auto_renovable: boolean;
    consultas_virtuales_usadas: string;
    consultas_presenciales_usadas: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    plan: Plan;
}

interface SuscripcionesResponse {
    success: boolean;
    data: {
        pacienteId: string;
        total: number;
        suscripciones: Suscripcion[];
    };
}

export default function MisSuscripcionesPage() {
    const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
    const [suscripcionActiva, setSuscripcionActiva] = useState<Suscripcion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarSuscripciones();
    }, []);

    const cargarSuscripciones = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response: SuscripcionesResponse = await pagoService.obtenerMisSuscripciones();

            if (response.success) {
                setSuscripciones(response.data.suscripciones);

                // ✅ Identificar suscripción activa
                const activa = response.data.suscripciones.find(s => s.estado === 'ACTIVA');
                setSuscripcionActiva(activa || null);
            }
        } catch (err: any) {
            console.error('❌ Error al cargar suscripciones:', err);
            setError(err.response?.data?.message || 'Error al cargar las suscripciones');
        } finally {
            setIsLoading(false);
        }
    };

    const getEstadoConfig = (estado: EstadoSuscripcion) => {
        const configs: Record<EstadoSuscripcion, { label: string; icon: any; color: string; iconColor: string }> = {
            ACTIVA: {
                label: 'Activa',
                icon: CheckCircle2,
                color: 'bg-green-100 text-green-800 border-green-300',
                iconColor: 'text-green-600'
            },
            VENCIDA: {
                label: 'Vencida',
                icon: Clock,
                color: 'bg-red-100 text-red-800 border-red-300',
                iconColor: 'text-red-600'
            },
            CANCELADA: {
                label: 'Cancelada',
                icon: XCircle,
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                iconColor: 'text-gray-600'
            },
            PAUSADA: {
                label: 'Pausada',
                icon: AlertTriangle,
                color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                iconColor: 'text-yellow-600'
            }
        };

        return configs[estado];
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearMoneda = (valor: string) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(parseFloat(valor));
    };

    const calcularDiasRestantes = (fechaVencimiento: string) => {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diff = vencimiento.getTime() - hoy.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const calcularPorcentajeUso = (usadas: string, total: number) => {
        const usadasNum = parseInt(usadas);
        if (total === 0) return 0;
        return Math.round((usadasNum / total) * 100);
    };

    if (isLoading) {
        return (
            <ProtectedRoute allowedRoles={['paciente']}>
                <DashboardLayout>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <h2 className="text-xl font-semibold">Cargando suscripciones...</h2>
                        </div>
                        <Skeleton className="h-64 w-full" />
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
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={cargarSuscripciones} className="mt-4">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reintentar
                    </Button>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['paciente']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Encabezado */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Mis Suscripciones</h1>
                            <p className="text-slate-600 mt-2">
                                Gestiona tu plan activo y consulta tu historial
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/dashboard/planes">
                                <Button variant="outline" size="sm">
                                    <Package className="w-4 h-4 mr-2" />
                                    Ver Planes
                                </Button>
                            </Link>
                            <Button onClick={cargarSuscripciones} variant="outline" size="sm">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Actualizar
                            </Button>
                        </div>
                    </div>

                    {/* Sin suscripción activa */}
                    {!suscripcionActiva ? (
                        <Card className="border-blue-200 bg-blue-50">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
                                        <div>
                                            <CardTitle className="text-blue-800">No tienes un plan activo</CardTitle>
                                            <CardDescription className="text-blue-700 mt-2">
                                                Suscríbete a uno de nuestros planes para acceder a consultas médicas,
                                                descuentos en farmacia y mucho más.
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Link href="/dashboard/planes">
                                        <Button>Ver Planes Disponibles</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                        </Card>
                    ) : (
                        <>
                            {/* Suscripción Activa */}
                            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full blur-3xl -z-0" />
                                <CardHeader className="relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Badge className="bg-green-600 text-white border-0">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Plan Activo
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    Vence en {calcularDiasRestantes(suscripcionActiva.fecha_vencimiento)} días
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-2xl text-slate-800">
                                                {suscripcionActiva.plan.nombre}
                                            </CardTitle>
                                            <p className="text-slate-600 mt-1">
                                                {formatearMoneda(suscripcionActiva.plan.precio_mensual)} / mes
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-600">Próxima renovación</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {formatearFecha(suscripcionActiva.fecha_vencimiento)}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Fechas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/60 backdrop-blur p-4 rounded-lg">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Calendar className="w-4 h-4 text-slate-600" />
                                                <p className="text-xs text-slate-600 font-medium">FECHA DE INICIO</p>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {formatearFecha(suscripcionActiva.fecha_inicio)}
                                            </p>
                                        </div>
                                        <div className="bg-white/60 backdrop-blur p-4 rounded-lg">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Calendar className="w-4 h-4 text-slate-600" />
                                                <p className="text-xs text-slate-600 font-medium">PRÓXIMA RENOVACIÓN</p>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {formatearFecha(suscripcionActiva.fecha_vencimiento)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Uso de consultas */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-slate-800 flex items-center">
                                            <TrendingUp className="w-4 h-4 mr-2" />
                                            Uso de Consultas Este Mes
                                        </h3>

                                        {/* Consultas Virtuales */}
                                        <div className="bg-white/60 backdrop-blur p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Video className="w-5 h-5 text-blue-600" />
                                                    <span className="font-medium text-slate-800">Consultas Virtuales</span>
                                                </div>
                                                <span className="text-sm text-slate-600">
                                                    {suscripcionActiva.consultas_virtuales_usadas} de 10 usadas
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, calcularPorcentajeUso(suscripcionActiva.consultas_virtuales_usadas, 10))}%`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Consultas Presenciales */}
                                        <div className="bg-white/60 backdrop-blur p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Building className="w-5 h-5 text-teal-600" />
                                                    <span className="font-medium text-slate-800">Consultas Presenciales</span>
                                                </div>
                                                <span className="text-sm text-slate-600">
                                                    {suscripcionActiva.consultas_presenciales_usadas} de 10 usadas
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-teal-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, calcularPorcentajeUso(suscripcionActiva.consultas_presenciales_usadas, 10))}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auto-renovación */}
                                    <div className="bg-white/60 backdrop-blur p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <RefreshCw className="w-4 h-4 text-slate-600" />
                                                <span className="font-medium text-slate-800">Auto-renovación</span>
                                            </div>
                                            <Badge variant={suscripcionActiva.auto_renovable ? "default" : "secondary"}>
                                                {suscripcionActiva.auto_renovable ? 'Activada' : 'Desactivada'}
                                            </Badge>
                                        </div>
                                        {!suscripcionActiva.auto_renovable && (
                                            <p className="text-xs text-slate-600 mt-2">
                                                Tu plan no se renovará automáticamente. Deberás renovarlo manualmente antes del vencimiento.
                                            </p>
                                        )}
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                                        <Link href="/dashboard/planes?cambiar=true" className="flex-1 min-w-[200px]">
                                            <Button variant="outline" className="w-full">
                                                <Package className="w-4 h-4 mr-2" />
                                                Cambiar Plan
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                        <Link href="/dashboard/medicos" className="flex-1 min-w-[200px]">
                                            <Button className="w-full">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Agendar Cita
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sección de Cambio de Plan */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-blue-600" />
                                        ¿Quieres cambiar tu plan?
                                    </CardTitle>
                                    <CardDescription>
                                        Explora nuestras opciones y encuentra el plan que mejor se adapte a tus necesidades
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-800">Beneficios de cambiar:</h4>
                                            <ul className="space-y-2 text-sm text-slate-600">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    Acceso inmediato a nuevos beneficios
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    Precios actualizados
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    Sin interrupciones en tu servicio
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    Proceso 100% en línea
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <p className="text-sm text-blue-800 font-medium mb-2">
                                                    Tu cambio será efectivo inmediatamente después del pago
                                                </p>
                                                <p className="text-xs text-blue-600">
                                                    El plan anterior se cancelará automáticamente
                                                </p>
                                            </div>
                                            <Link href="/dashboard/planes?cambiar=true">
                                                <Button className="w-full">
                                                    <Package className="w-4 h-4 mr-2" />
                                                    Explorar Planes Disponibles
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Historial de suscripciones */}
                    {suscripciones.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-800">Historial de Suscripciones</h2>

                            {suscripciones.map((suscripcion) => {
                                // const estadoConfig = getEstadoConfig(suscripcion.estado);
                                //const Icon = estadoConfig.icon;

                                return (
                                    <Card key={suscripcion.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="bg-slate-50">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-3">
                                                        <CreditCard className="w-5 h-5 text-slate-600" />
                                                        <CardTitle className="text-lg">
                                                            {suscripcion.plan.nombre}
                                                        </CardTitle>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {formatearFecha(suscripcion.fecha_inicio)}
                                                        </div>
                                                        <span>→</span>
                                                        <div className="flex items-center">
                                                            {formatearFecha(suscripcion.fecha_vencimiento)}
                                                        </div>
                                                        <span>•</span>
                                                        <span className="font-semibold">
                                                            {formatearMoneda(suscripcion.plan.precio_mensual)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/*<Badge className={`${estadoConfig.color} border flex items-center gap-1`}>
                          <Icon className={`w-4 h-4 ${estadoConfig.iconColor}`} />
                          {estadoConfig.label}
                        </Badge>*/}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-600">Consultas Virtuales</p>
                                                    <p className="font-semibold">{suscripcion.consultas_virtuales_usadas} usadas</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-600">Consultas Presenciales</p>
                                                    <p className="font-semibold">{suscripcion.consultas_presenciales_usadas} usadas</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-600">Duración</p>
                                                    <p className="font-semibold">{suscripcion.plan.duracion_meses} mes(es)</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-600">Auto-renovación</p>
                                                    <p className="font-semibold">{suscripcion.auto_renovable ? 'Sí' : 'No'}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}