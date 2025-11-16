'use client';

import { useEffect, useState } from 'react';
import kpiService, { KpisResponse } from "@/lib/api/services/directorService";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
    PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { Loader2 } from 'lucide-react';

export default function PanelDirector() {
    const [kpis, setKpis] = useState<KpisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [rango, setRango] = useState<'hoy' | '7dias' | 'mes' | 'personalizado'>('hoy');

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                const data = await kpiService.getKPIs(rango);
                setKpis(data);
            } catch (err) {
                console.error('Error al obtener KPIs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchKPIs();
    }, [rango]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
        );
    }

    if (!kpis) {
        return <p className="text-center text-slate-500">No hay datos disponibles.</p>;
    }



    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="flex space-x-2">
                {['hoy', '7dias', 'mes', 'personalizado'].map((key) => (
                    <button
                        key={key}
                        onClick={() => setRango(key as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${rango === key
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        {key === 'hoy'
                            ? 'Hoy'
                            : key === '7dias'
                                ? 'Últimos 7 Días'
                                : key === 'mes'
                                    ? 'Este Mes'
                                    : 'Rango Personalizado'}
                    </button>
                ))}
            </div>

            {/* Cards principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Citas Agendadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{kpis.citasAgendadas}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">${kpis.ingresos.toLocaleString()}</p>
                    </CardContent>
                </Card>

                {/* === Calificación Promedio (medicos) con Gauge === */}
                <Card>
                    <CardHeader>
                        <CardTitle>Calificación Promedio (Médicos)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            // Valor del backend (1..10). Forzamos límites por seguridad.
                            const raw = typeof kpis?.califMedicos === 'number' ? kpis.califMedicos : 0;
                            const value = Math.max(0, Math.min(10, raw));
                            // Color por rango
                            const color =
                                value >= 7 ? '#10B981' : value >= 4 ? '#F59E0B' : '#EF4444';

                            // Recharts RadialBarChart: usamos un dataset con 2 barras:
                            // 1) fondo (10)  2) valor actual (value)
                            const data = [
                                { name: 'fondo', val: 10, fill: '#E5E7EB' }, // slate-200
                                { name: 'valor', val: value, fill: color },
                            ];

                            return (
                                <div className="grid grid-cols-2 items-center">
                                    {/* Valor grande */}
                                    <div>
                                        <p className="text-4xl font-bold leading-tight">
                                            {value.toFixed(1)}
                                        </p>
                                        <p className="text-slate-500 text-sm">de 10</p>
                                    </div>

                                    {/* Gauge circular */}
                                    <div className="h-28">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                data={data}
                                                innerRadius="70%"
                                                outerRadius="100%"
                                                startAngle={180}
                                                endAngle={0}
                                            >
                                                {/* Escala 0..10, semicircular */}
                                                <PolarAngleAxis
                                                    type="number"
                                                    domain={[0, 10]}
                                                    angleAxisId={0}
                                                    tick={false}
                                                />
                                                {/* Barra de fondo */}
                                                <RadialBar
                                                    dataKey="val"
                                                    cornerRadius={10}
                                                    background
                                                    data={[data[0]]}
                                                    fill={data[0].fill}
                                                />
                                                {/* Barra del valor */}
                                                <RadialBar
                                                    dataKey="val"
                                                    cornerRadius={10}
                                                    data={[data[1]]}
                                                    fill={data[1].fill}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* === Calificación Promedio (productos) con Gauge === */}
                <Card>
                    <CardHeader>
                        <CardTitle>Calificación Promedio (Productos)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            // Valor del backend (1..10). Forzamos límites por seguridad.
                            const raw = typeof kpis?.califProductos === 'number' ? kpis.califProductos : 0;
                            const value = Math.max(0, Math.min(10, raw));
                            // Color por rango
                            const color =
                                value >= 7 ? '#10B981' : value >= 4 ? '#F59E0B' : '#EF4444';

                            // Recharts RadialBarChart: usamos un dataset con 2 barras:
                            // 1) fondo (10)  2) valor actual (value)
                            const data = [
                                { name: 'fondo', val: 10, fill: '#E5E7EB' }, // slate-200
                                { name: 'valor', val: value, fill: color },
                            ];

                            return (
                                <div className="grid grid-cols-2 items-center">
                                    {/* Valor grande */}
                                    <div>
                                        <p className="text-4xl font-bold leading-tight">
                                            {value.toFixed(1)}
                                        </p>
                                        <p className="text-slate-500 text-sm">de 10</p>
                                    </div>

                                    {/* Gauge circular */}
                                    <div className="h-28">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                data={data}
                                                innerRadius="70%"
                                                outerRadius="100%"
                                                startAngle={180}
                                                endAngle={0}
                                            >
                                                {/* Escala 0..10, semicircular */}
                                                <PolarAngleAxis
                                                    type="number"
                                                    domain={[0, 10]}
                                                    angleAxisId={0}
                                                    tick={false}
                                                />
                                                {/* Barra de fondo */}
                                                <RadialBar
                                                    dataKey="val"
                                                    cornerRadius={10}
                                                    background
                                                    data={[data[0]]}
                                                    fill={data[0].fill}
                                                />
                                                {/* Barra del valor */}
                                                <RadialBar
                                                    dataKey="val"
                                                    cornerRadius={10}
                                                    data={[data[1]]}
                                                    fill={data[1].fill}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

            </div>

            {/* Detalles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* === Pacientes Premium vs Estándar (Pie chart) === */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pacientes (Premium vs Estándar)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const total = kpis?.pacientes?.total ?? 0;
                            const premium = kpis?.pacientes?.premium ?? 0;
                            const estandar = kpis?.pacientes?.estandar ?? 0;

                            // Evitar negativos / inconsistencias
                            const safePremium = Math.max(0, premium);
                            const safeEstandar = Math.max(0, estandar);
                            const safeTotal = Math.max(0, total) || (safePremium + safeEstandar);

                            const data =
                                safePremium + safeEstandar > 0
                                    ? [
                                        { name: 'Premium', value: safePremium },
                                        { name: 'Estándar', value: safeEstandar },
                                    ]
                                    : [
                                        // Si no hay datos, mostramos 0/0 para evitar errores visuales
                                        { name: 'Premium', value: 0 },
                                        { name: 'Estándar', value: 0 },
                                    ];

                            const COLORS = ['#10B981', '#3B82F6']; // Verde para premium, azul para estándar

                            const porcentaje = (v: number) =>
                                safePremium + safeEstandar > 0
                                    ? `${Math.round((v / (safePremium + safeEstandar)) * 100)}%`
                                    : '0%';

                            return (
                                <div className="flex items-center gap-6">
                                    {/* Lado izquierdo: Totales */}
                                    <div className="w-1/2">
                                        <p className="text-4xl font-bold leading-tight">
                                            {safeTotal.toLocaleString()}
                                        </p>
                                        <p className="text-slate-500 text-sm">Total con suscripción activa</p>

                                        <div className="mt-4 space-y-1 text-sm text-slate-700">
                                            <p className="flex items-center gap-2">
                                                <span
                                                    className="inline-block w-3 h-3 rounded-sm"
                                                    style={{ background: COLORS[0] }}
                                                />
                                                <span className="font-medium">Premium:</span>{' '}
                                                {safePremium.toLocaleString()} ({porcentaje(safePremium)})
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span
                                                    className="inline-block w-3 h-3 rounded-sm"
                                                    style={{ background: COLORS[1] }}
                                                />
                                                <span className="font-medium">Estándar:</span>{' '}
                                                {safeEstandar.toLocaleString()} ({porcentaje(safeEstandar)})
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lado derecho: Pie chart */}
                                    <div className="w-1/2 h-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                >
                                                    {data.map((_, idx) => (
                                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number, name: string) => [
                                                        value.toLocaleString(),
                                                        name,
                                                    ]}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* === Resumen de estado de la cita (Donut chart) === */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen del Estado de las Citas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const total =
                                kpis?.resumenCitas?.total ??
                                ((kpis?.resumenCitas?.completadas ?? 0) +
                                    (kpis?.resumenCitas?.agendadas ?? 0) +
                                    (kpis?.resumenCitas?.canceladas ?? 0));

                            const completadas = Math.max(0, kpis?.resumenCitas?.completadas ?? 0);
                            const agendadas = Math.max(0, kpis?.resumenCitas?.agendadas ?? 0);
                            const canceladas = Math.max(0, kpis?.resumenCitas?.canceladas ?? 0);

                            const data = [
                                { name: 'Completadas', value: completadas },
                                { name: 'Agendadas', value: agendadas },
                                { name: 'Canceladas', value: canceladas },
                            ];

                            const COLORS = ['#10B981', '#3B82F6', '#EF4444']; // verde, azul, rojo

                            const porcentaje = (v: number) =>
                                total > 0 ? `${Math.round((v / total) * 100)}%` : '0%';

                            return (
                                <div className="flex items-center gap-6">
                                    {/* Lado izquierdo: Totales y desglose */}
                                    <div className="w-1/2">
                                        <p className="text-4xl font-bold leading-tight">
                                            {total.toLocaleString()}
                                        </p>
                                        <p className="text-slate-500 text-sm">Total de citas</p>

                                        <div className="mt-4 space-y-1 text-sm text-slate-700">
                                            <p className="flex items-center gap-2">
                                                <span
                                                    className="inline-block w-3 h-3 rounded-sm"
                                                    style={{ background: COLORS[0] }}
                                                />
                                                <span className="font-medium">Completadas:</span>{' '}
                                                {completadas.toLocaleString()} ({porcentaje(completadas)})
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span
                                                    className="inline-block w-3 h-3 rounded-sm"
                                                    style={{ background: COLORS[1] }}
                                                />
                                                <span className="font-medium">Agendadas:</span>{' '}
                                                {agendadas.toLocaleString()} ({porcentaje(agendadas)})
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span
                                                    className="inline-block w-3 h-3 rounded-sm"
                                                    style={{ background: COLORS[2] }}
                                                />
                                                <span className="font-medium">Canceladas:</span>{' '}
                                                {canceladas.toLocaleString()} ({porcentaje(canceladas)})
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lado derecho: Donut */}
                                    <div className="w-1/2 h-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                >
                                                    {data.map((_, idx) => (
                                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number, name: string) => [
                                                        value.toLocaleString(),
                                                        name,
                                                    ]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* === Número de Solicitudes (Barra horizontal por estado) === */}
                <Card>
                    <CardHeader>
                        <CardTitle>Número de Solicitudes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const pendiente = Math.max(0, kpis?.solicitudes?.PENDIENTE ?? 0);
                            const aprobada = Math.max(0, kpis?.solicitudes?.APROBADA ?? 0);
                            const rechazada = Math.max(0, kpis?.solicitudes?.RECHAZADA ?? 0);
                            const devuelta = Math.max(0, kpis?.solicitudes?.DEVUELTA ?? 0);

                            const total = pendiente + aprobada + rechazada + devuelta;

                            // Data para barras horizontales (layout vertical)
                            const data = [
                                { estado: 'Pendiente', valor: pendiente, color: '#F59E0B' }, // amber
                                { estado: 'Aprobada', valor: aprobada, color: '#10B981' }, // green
                                { estado: 'Rechazada', valor: rechazada, color: '#EF4444' }, // red
                                { estado: 'Devuelta', valor: devuelta, color: '#6366F1' }, // indigo
                            ];

                            return (
                                <div className="flex items-start gap-6">
                                    {/* Lado izquierdo: total y desglose */}
                                    <div className="w-1/3">
                                        <p className="text-4xl font-bold leading-tight">
                                            {total.toLocaleString()}
                                        </p>
                                        <p className="text-slate-500 text-sm">Total de solicitudes</p>

                                        <div className="mt-4 space-y-1 text-sm text-slate-700">
                                            <p className="flex items-center gap-2">
                                                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: data[0].color }} />
                                                <span className="font-medium">Pendiente:</span>{' '}
                                                {pendiente.toLocaleString()}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: data[1].color }} />
                                                <span className="font-medium">Aprobada:</span>{' '}
                                                {aprobada.toLocaleString()}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: data[2].color }} />
                                                <span className="font-medium">Rechazada:</span>{' '}
                                                {rechazada.toLocaleString()}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: data[3].color }} />
                                                <span className="font-medium">Devuelta:</span>{' '}
                                                {devuelta.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lado derecho: barras horizontales */}
                                    <div className="w-2/3 h-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={data}
                                                layout="vertical"
                                                margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
                                            >
                                                {/* Eje Y muestra las categorías (estados) */}
                                                <YAxis
                                                    type="category"
                                                    dataKey="estado"
                                                    tick={{ fill: '#64748b' }} // slate-500
                                                    width={110}
                                                />
                                                {/* Eje X muestra los valores */}
                                                <XAxis
                                                    type="number"
                                                    allowDecimals={false}
                                                    tick={{ fill: '#64748b' }}
                                                />
                                                <Tooltip
                                                    formatter={(value: number, name: string, props) => [
                                                        (value as number).toLocaleString(),
                                                        props?.payload?.estado ?? name,
                                                    ]}
                                                />
                                                <Bar dataKey="valor" radius={[6, 6, 6, 6]}>
                                                    {data.map((entry, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

}
