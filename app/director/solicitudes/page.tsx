'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import solicitudesService from "@/lib/api/services/directorService";
import { useRouter } from 'next/navigation';
import { Solicitud, useSolicitudesStore } from '@/lib/store/solicitudesStore';

// Paletas de colores para las cards
const palettes = {
    slate: {
        card: 'bg-slate-50 border-slate-200',
        title: 'text-slate-800',
        value: 'text-slate-900',
        sub: 'text-slate-500',
        chip: 'bg-slate-600',
    },
    emerald: {
        card: 'bg-emerald-50 border-emerald-200',
        title: 'text-emerald-800',
        value: 'text-emerald-900',
        sub: 'text-emerald-600',
        chip: 'bg-emerald-600',
    },
    amber: {
        card: 'bg-amber-50 border-amber-200',
        title: 'text-amber-800',
        value: 'text-amber-900',
        sub: 'text-amber-600',
        chip: 'bg-amber-600',
    },
    rose: {
        card: 'bg-rose-50 border-rose-200',
        title: 'text-rose-800',
        value: 'text-rose-900',
        sub: 'text-rose-600',
        chip: 'bg-rose-600',
    },
};

// Regla de color para "Pendientes con errores": verde si 0, ámbar 1–5, rojo >5
function paletteForSolicitudes(count: number) {
    if (count < 3) return palettes.emerald;
    if (count >= 4 && count <=8) return palettes.amber;
    return palettes.rose;
}

export default function SolicitudesPage() {
    const router = useRouter();
    const { setAprobadas, setPendientes } = useSolicitudesStore();
    const [aprobadas, setAprobadasCount] = useState<number | null>(null);
    const [pendientesErrores, setPendientesErrores] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setErr(null);
        try {
            const [aprobadasArr, pendientesArr]: [Solicitud[], Solicitud[]] = await Promise.all([
                solicitudesService.getSolicitudesAprovadas(),
                solicitudesService.getSolicitudesPendientes(),
            ]);

            setAprobadas(aprobadasArr);    // <-- Guardamos globalmente
            setPendientes(pendientesArr);  // <-- Guardamos globalmente

            setAprobadasCount(aprobadasArr.length);
            setPendientesErrores(pendientesArr.length);
        } catch (e) {
            console.error('Error cargando solicitudes:', e);
            setErr('No se pudieron cargar las solicitudes.');
            setAprobadasCount(0);
            setPendientesErrores(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
        );
    }

    const aprobadasCount = aprobadas ?? 0;
    const pendientesCount = pendientesErrores ?? 0;
    
    const palAprob = paletteForSolicitudes(aprobadasCount);
    const palPend = paletteForSolicitudes(pendientesCount);


    return (
        <div className="space-y-6">
            {/* Header / acciones */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-800">Solicitudes</h1>
                <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refrescar
                </button>
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card: Solicitudes Aprobadas */}
                <Card className={`border ${palAprob.card}`}>
                    <CardHeader>
                        <CardTitle className={palAprob.title}>Solicitudes Aprobadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold ${palAprob.value}`}>
                            {aprobadasCount.toLocaleString()}
                        </p>
                        <p className={`text-sm mt-1 ${palAprob.sub}`}>Total en estado APROBADA</p>
                        <button
                            onClick={() => router.push('/director/solicitudes/listaSolicitudes?tipo=aprobadas')}
                            className="mt-3 text-sm text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                        >
                            Ver lista
                        </button>
                    </CardContent>     
                </Card>

                {/* Card: Solicitudes Pendientes con Errores */}
                <Card className={`border ${palPend.card}`}>
                    <CardHeader>
                        <CardTitle className={palPend.title}>Pendientes con Errores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold ${palPend.value}`}>
                            {pendientesCount.toLocaleString()}
                        </p>
                        <p className={`text-sm mt-1 ${palPend.sub}`}>
                            Total de solicitudes PENDIENTE con errores
                        </p>
                        <button
                            onClick={() => router.push('/director/solicitudes/listaSolicitudes?tipo=pendientes')}
                            className="mt-3 text-sm text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                        >
                            Ver lista
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Mensaje de error (si aplica) */}
            {err && (
                <p className="text-sm text-rose-600">
                    {err}
                </p>
            )}
        </div>
    );
}