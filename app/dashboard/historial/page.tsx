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
import {
  Package,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Truck,
  PackageCheck,
  RefreshCw,
  PackageOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Image from 'next/image';

interface Producto {
  id: string;
  codigo_producto: string;
  nombre: string;
  descripcion: string;
  precio: string;
  categoria: string;
  marca: string;
  imagen_url: string;
  requiere_receta: boolean;
}

interface ProductoCompra {
  id: string;
  compra_id: string;
  producto_id: string;
  cantidad: string;
  precio_unitario: string;
  descuento_aplicado: string;
  subtotal: string;
  producto: Producto;
}

// ✅ ESTADOS REALES según DDL de la tabla compra
type EstadoCompra = 'CARRITO' | 'PENDIENTE' | 'PAGADA' | 'PREPARANDO' | 'EN_TRANSITO' | 'ENTREGADA' | 'CANCELADA';

interface Compra {
  id: string;
  paciente_id: string;
  numero_orden: string;
  subtotal: string;
  descuento: string;
  total: string;
  estado: EstadoCompra;
  tipo_entrega: 'DOMICILIO' | 'RECOGIDA';
  direccion_entrega_id: string | null;
  punto_recogida: string | null;
  notas_entrega: string | null;
  fecha_creacion: string;
  fecha_pago: string | null;
  fecha_entrega: string | null;
  fecha_actualizacion: string;
  productos: ProductoCompra[];
}

interface ComprasResponse {
  success: boolean;
  data: {
    compras: Compra[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

type EstadoFiltro = 'TODOS' | EstadoCompra;

export default function HistorialComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [comprasFiltradas, setComprasFiltradas] = useState<Compra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('TODOS');
  const [expandedCompra, setExpandedCompra] = useState<string | null>(null);

  useEffect(() => {
    cargarCompras();
  }, []);

  useEffect(() => {
    filtrarCompras();
  }, [estadoFiltro, compras]);

  const cargarCompras = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: ComprasResponse = await pagoService.obtenerMisCompras({ limit: 100 });

      if (response.success) {
        // ✅ Filtrar CARRITO - no es parte del historial de compras reales
        const comprasValidas = response.data.compras.filter(
          (compra) => compra.estado !== 'CARRITO'
        );
        setCompras(comprasValidas);
      }
    } catch (err: any) {
      console.error('❌ Error al cargar compras:', err);
      setError(err.response?.data?.message || 'Error al cargar el historial de compras');
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarCompras = () => {
    if (estadoFiltro === 'TODOS') {
      setComprasFiltradas(compras);
    } else {
      setComprasFiltradas(compras.filter((c) => c.estado === estadoFiltro));
    }
  };

  const toggleDetalles = (compraId: string) => {
    setExpandedCompra(expandedCompra === compraId ? null : compraId);
  };

  // ✅ Configuración de estados REALES
  const getEstadoConfig = (estado: EstadoCompra) => {
    const configs: Record<EstadoCompra, { label: string; icon: any; color: string; iconColor: string }> = {
      CARRITO: {
        label: 'Carrito',
        icon: PackageOpen,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        iconColor: 'text-gray-600'
      },
      PENDIENTE: {
        label: 'Pendiente',
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        iconColor: 'text-yellow-600'
      },
      PAGADA: {
        label: 'Pagada',
        icon: CheckCircle2,
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        iconColor: 'text-blue-600'
      },
      PREPARANDO: {
        label: 'Preparando',
        icon: Package,
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        iconColor: 'text-purple-600'
      },
      EN_TRANSITO: {
        label: 'En Tránsito',
        icon: Truck,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        iconColor: 'text-indigo-600'
      },
      ENTREGADA: {
        label: 'Entregada',
        icon: PackageCheck,
        color: 'bg-green-100 text-green-800 border-green-300',
        iconColor: 'text-green-600'
      },
      CANCELADA: {
        label: 'Cancelada',
        icon: XCircle,
        color: 'bg-red-100 text-red-800 border-red-300',
        iconColor: 'text-red-600'
      }
    };

    return configs[estado];
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'No registrada';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (valor: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(parseFloat(valor));
  };

  const contarPorEstado = (estado: EstadoFiltro) => {
    if (estado === 'TODOS') return compras.length;
    return compras.filter((c) => c.estado === estado).length;
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['paciente']}>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold">Cargando historial...</h2>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={cargarCompras} className="mt-4">
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
              <h1 className="text-3xl font-bold text-slate-800">Historial de Compras</h1>
              <p className="text-slate-600 mt-2">
                Revisa el estado de tus órdenes y compras realizadas
              </p>
            </div>
            <Button onClick={cargarCompras} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {/* Filtros por estado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtrar por estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(['TODOS', 'PENDIENTE', 'PAGADA', 'PREPARANDO', 'EN_TRANSITO', 'ENTREGADA', 'CANCELADA'] as EstadoFiltro[]).map(
                  (estado) => {
                    const config = estado !== 'TODOS' ? getEstadoConfig(estado as EstadoCompra) : null;
                    return (
                      <Button
                        key={estado}
                        variant={estadoFiltro === estado ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEstadoFiltro(estado)}
                        className="min-w-[100px]"
                      >
                        {estado === 'TODOS' ? 'Todos' : config?.label}
                        <Badge variant="secondary" className="ml-2">
                          {contarPorEstado(estado)}
                        </Badge>
                      </Button>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de compras */}
          {comprasFiltradas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PackageOpen className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No hay compras para mostrar
                </h3>
                <p className="text-slate-500 text-center max-w-md">
                  {estadoFiltro === 'TODOS'
                    ? 'Aún no has realizado ninguna compra. Visita nuestra farmacia para comenzar.'
                    : `No tienes compras con estado "${getEstadoConfig(estadoFiltro as EstadoCompra)?.label}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comprasFiltradas.map((compra) => {
                const estadoConfig = getEstadoConfig(compra.estado);
                const Icon = estadoConfig.icon;
                const isExpanded = expandedCompra === compra.id;

                return (
                  <Card key={compra.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <Package className="w-5 h-5 text-slate-600" />
                            <CardTitle className="text-lg">
                              Orden {compra.numero_orden}
                            </CardTitle>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatearFecha(compra.fecha_creacion)}
                            </div>
                            <span>•</span>
                            <span>{compra.productos.length} producto(s)</span>
                            <span>•</span>
                            <span className="font-semibold">{formatearMoneda(compra.total)}</span>
                          </div>
                        </div>
                        <Badge className={`${estadoConfig.color} border flex items-center gap-1`}>
                          <Icon className={`w-4 h-4 ${estadoConfig.iconColor}`} />
                          {estadoConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      {/* Resumen de fechas importantes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">FECHA DE PAGO</p>
                          <p className="text-sm">{formatearFecha(compra.fecha_pago)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">TIPO DE ENTREGA</p>
                          <p className="text-sm capitalize">
                            {compra.tipo_entrega === 'DOMICILIO' ? 'A Domicilio' : 'Recogida en Punto'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">FECHA DE ENTREGA</p>
                          <p className="text-sm">{formatearFecha(compra.fecha_entrega)}</p>
                        </div>
                      </div>

                      {/* Botón expandir/colapsar productos */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDetalles(compra.id)}
                        className="w-full justify-between"
                      >
                        <span>Ver detalles de productos</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Detalles expandibles */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          {compra.productos.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start space-x-4 p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <Image
                                  src={item.producto.imagen_url}
                                  alt={item.producto.nombre}
                                  fill
                                  className="object-contain rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-product.png';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-slate-800">
                                      {item.producto.nombre}
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                      {item.producto.marca} • {item.producto.categoria}
                                    </p>
                                    {item.producto.requiere_receta && (
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        Requiere Receta
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-slate-800">
                                      {formatearMoneda(item.subtotal)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {item.cantidad} x {formatearMoneda(item.precio_unitario)}
                                    </p>
                                  </div>
                                </div>
                                {parseFloat(item.descuento_aplicado) > 0 && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Descuento: -{formatearMoneda(item.descuento_aplicado)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Resumen de totales */}
                          <div className="border-t pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Subtotal:</span>
                              <span className="font-medium">{formatearMoneda(compra.subtotal)}</span>
                            </div>
                            {parseFloat(compra.descuento) > 0 && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Descuento:</span>
                                <span className="font-medium">-{formatearMoneda(compra.descuento)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-base font-bold border-t pt-2">
                              <span>Total:</span>
                              <span>{formatearMoneda(compra.total)}</span>
                            </div>
                          </div>

                          {compra.notas_entrega && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs text-blue-600 font-medium mb-1">NOTAS DE ENTREGA</p>
                              <p className="text-sm text-slate-700">{compra.notas_entrega}</p>
                            </div>
                          )}
                        </div>
                      )}
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