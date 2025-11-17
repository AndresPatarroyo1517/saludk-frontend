'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCitasStore } from '@/lib/store/citasStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function ListaCitas() {
    const router = useRouter();
    const params = useSearchParams();
    const tipo = params.get('tipo'); // "agendadas" o "aprobadas"
    const { stats } = useCitasStore();

    if (!stats) {
        return <p className="p-4 text-gray-600">No hay estadísticas cargadas.</p>;
    }

    // Filtramos las citas según tipo
    const data =
        tipo === 'agendadas'
            ? stats.citas_mes.filter(c => c.estado === 'AGENDADA')
            : stats.citas_mes.filter(c => c.estado === 'CONFIRMADA');

    if (!data.length) {
        return (
            <div className="p-4">
                <button
                    onClick={() => router.back()}
                    className="mb-4 px-3 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition"
                >
                    Volver
                </button>
                <p className="text-slate-600">No hay citas {tipo} disponibles.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            <h1 className="text-xl font-semibold text-slate-800">
                Citas {tipo === 'aprobadas' ? 'Confirmadas' : 'Agendadas'}
            </h1>

            <button
                onClick={() => router.back()}
                className="px-3 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition cursor-pointer"
            >
                Volver
            </button>

            <div className="grid gap-4 mt-2">
                {data.map(cita => (
                    <Card
                        key={cita.id}
                        className="border bg-white border-slate-200 hover:shadow-sm transition cursor-pointer"
                        onClick={() => router.push(`/medico/citas/${cita.id}`)}
                    >
                        <CardHeader>
                            <CardTitle className="text-slate-800 font-medium">{cita.paciente}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-600">
                                {format(new Date(cita.fecha), 'PPP')} — {cita.modalidad ?? ''}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Estado: {cita.estado}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
