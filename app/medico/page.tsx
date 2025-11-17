'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import medicoService, { EstadisticasMedicoData } from '@/lib/api/services/medicosService';
import { CalendarDays, Filter } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MedicoHome() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<EstadisticasMedicoData | null>(null);

    const [modoHoy, setModoHoy] = useState<"total" | "agendadas" | "confirmadas">("total");
    const [modoMes, setModoMes] = useState<"total" | "agendadas" | "confirmadas">("total");

    // Estado para elegir filtro de citas
    const [citasModo, setCitasModo] = useState<"proximas" | "mes">("proximas");

    const rotarModo = (modo: "total" | "agendadas" | "confirmadas") => {
        if (modo === "total") return "agendadas";
        if (modo === "agendadas") return "confirmadas";
        return "total";
    };

    const siguienteModo = (modo: "total" | "agendadas" | "confirmadas") => rotarModo(modo);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const response = await medicoService.getEstadisticasMedico(user.id);
                setStats(response.data);
            } catch (e) {
                console.error('Error al obtener estadísticas:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (!user) return null;

    if (loading) {
        return <div className="p-6 text-center text-gray-600">Cargando estadísticas…</div>;
    }

    const totalHoy = stats ? Object.values(stats.total_hoy).reduce((a, b) => a + b, 0) : 0;
    const totalMes = stats ? Object.values(stats.total_mes).reduce((a, b) => a + b, 0) : 0;

    const valorHoy =
        modoHoy === "total"
            ? totalHoy
            : modoHoy === "agendadas"
                ? stats?.total_hoy.AGENDADA ?? 0
                : stats?.total_hoy.CONFIRMADA ?? 0;

    const valorMes =
        modoMes === "total"
            ? totalMes
            : modoMes === "agendadas"
                ? stats?.total_mes.AGENDADA ?? 0
                : stats?.total_mes.CONFIRMADA ?? 0;

    const citasFechas = stats?.citas_mes
        ? stats.citas_mes.map((c) => new Date(c.fecha))
        : [];

    const colorModo = {
        total: "bg-slate-50 border-slate-200",
        agendadas: "bg-blue-50 border-blue-200",
        confirmadas: "bg-green-50 border-green-200",
    };

    const anim = "transition-all duration-300 ease-out transform";

    const labelModo = {
        total: "Total",
        agendadas: "Agendadas",
        confirmadas: "Confirmadas",
    };

    const mostrarCitas =
        citasModo === "proximas"
            ? stats?.proximas_citas_hoy ?? []
            : stats?.citas_mes ?? [];

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-semibold text-gray-900">
                Bienvenido de nuevo,{user?.datos_personales?.nombres
                    ? ` Dr. ${user.datos_personales.nombres}`
                    : ' Médico'}
            </h1>

            <p className="text-gray-600">Aquí tiene de las citas agendadas.</p>

            {/* --- Fila de métricas --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* CARD HOY */}
                <Card
                    className={`${colorModo[modoHoy]} cursor-pointer relative group ${anim}`}
                    onClick={() => setModoHoy(rotarModo(modoHoy))}
                >
                    <div className="absolute right-3 top-3 opacity-70 group-hover:opacity-100 transition">
                        <Filter className="w-4 h-4" color="black" />
                    </div>
                    <div className="absolute right-3 top-9 text-xs text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-800 shadow">
                        Ver: {labelModo[siguienteModo(modoHoy)]}
                    </div>
                    <CardHeader>
                        <CardTitle className="text-gray-600 text-base">Citas {labelModo[modoHoy]} de Hoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold text-gray-900 ${anim} scale-105`}>{valorHoy}</p>
                    </CardContent>
                </Card>

                {/* CARD MES */}
                <Card
                    className={`${colorModo[modoMes]} cursor-pointer relative group ${anim}`}
                    onClick={() => setModoMes(rotarModo(modoMes))}
                >
                    <div className="absolute right-3 top-3 opacity-70 group-hover:opacity-100 transition">
                        <Filter className="w-4 h-4" color="black" />
                    </div>
                    <div className="absolute right-3 top-9 text-xs text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-800 shadow">
                        Ver: {labelModo[siguienteModo(modoMes)]}
                    </div>
                    <CardHeader>
                        <CardTitle className="text-gray-600 text-base">Citas {labelModo[modoMes]} en el Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold text-gray-900 ${anim} scale-105`}>{valorMes}</p>
                    </CardContent>
                </Card>

                {/* PACIENTES ATENDIDOS */}
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-gray-600 text-base">Pacientes Atendidos (Mes)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-gray-900">{stats?.total_mes_completadas ?? 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- Fila de Próximas Citas + Calendario --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Próximas Citas: ocupa 2/3 y altura igual al calendario */}
                <div className="lg:col-span-2">
                    <Card className="bg-slate-50 border-slate-200 h-full flex flex-col">
                        <CardHeader className="flex flex-row-reverse justify-between items-center">
                            <button
                                className="bg-blue-600 text-white rounded-md px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition cursor-pointer"
                                onClick={() =>
                                    setCitasModo(citasModo === "proximas" ? "mes" : "proximas")
                                }
                            >
                                <Filter className="w-4 h-4" />
                                {citasModo === "proximas" ? "Ver citas en el mes" : "Ver citas para hoy"}
                            </button>
                            <CardTitle className="text-xl text-black">
                                Próximas Citas {citasModo === "proximas" ? "para Hoy" : "en el Mes"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 overflow-y-auto">
                            {mostrarCitas.length === 0 ? (
                                <p className="text-gray-500">No hay citas.</p>
                            ) : (
                                mostrarCitas.map((cita: any) => (
                                    <div
                                        key={cita.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{cita.paciente}</p>
                                            <p className="text-gray-600 text-sm">
                                                {cita.hora ?? format(new Date(cita.fecha), "HH:mm")} — {cita.modalidad ?? ""}
                                            </p>
                                        </div>
                                        <button className="text-blue-600 font-medium hover:underline cursor-pointer">Ver Detalles</button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Calendario: ocupa 1/3 */}
                <div className="lg:col-span-1">
                    <Card className="bg-slate-50 border-slate-200 h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-xl text-black flex items-center gap-2">
                                <CalendarDays className="w-5 h-5" />
                                Calendario
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-between h-full">
                            <Calendar
                                locale={es}
                                showOutsideDays
                                selected={new Date()}
                                modifiers={{
                                    today: new Date(),
                                    citas: citasFechas
                                }}
                                modifiersClassNames={{
                                    today: '!bg-blue-600 !text-white !rounded-50',
                                    citas: '!bg-green-200 !text-green-800 !font-bold !rounded-50'
                                }}
                                className="mx-auto max-w-[280px] text-gray-800 [&_.rdp-day]:hover:bg-gray-100"
                            />
                            <div className="mt-4 text-gray-600 text-sm">
                                Día actual: {format(new Date(), 'PPP', { locale: es })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
