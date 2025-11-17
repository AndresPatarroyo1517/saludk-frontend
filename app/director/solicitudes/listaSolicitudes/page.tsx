'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSolicitudesStore } from '@/lib/store/solicitudesStore';
import { Card, CardContent } from '@/components/ui/card';

export default function ListaSolicitudes() {
    const params = useSearchParams();
    const router = useRouter();
    const tipo = params.get('tipo');
    const { aprobadas, pendientes } = useSolicitudesStore();

    const data = tipo === 'aprobadas' ? aprobadas : pendientes;

    if (!data.length) {
        return (
            <div>
                <button
                    onClick={() => router.back()}
                    className="mb-4 px-3 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition cursor-pointer"
                >
                    Volver a la lista
                </button>
                <p className="text-slate-600">No hay solicitudes disponibles.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold text-slate-800">
                Solicitudes {tipo === 'aprobadas' ? 'Aprobadas por el sistema' : 'Pendientes con Errores'}
            </h1>

            <h3 className="text-s font-semibold text-slate-500">
                Selecciona una solicitud para revisar
            </h3>

            <button
                onClick={() => router.back()}
                className="px-3 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition cursor-pointer"
            >
                Volver a la lista
            </button>

            <div className="grid gap-4">
                {data.map((s) => (
                    <Card
                        key={s.id}
                        className="border bg-white border-slate-200 hover:shadow-sm transition cursor-pointer"
                        onClick={() => router.push(`/director/solicitudes/${s.id}`)}
                    >
                        <CardContent className="p-4">
                            <p className="font-medium text-slate-800">
                                {s.paciente?.nombres} {s.paciente?.apellidos}
                            </p>
                            <p className="text-sm text-slate-600">
                                Estado: {s.estado} | Creada: {new Date(s.fecha_creacion ?? '').toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Identificación: {s.paciente?.numero_identificacion}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
