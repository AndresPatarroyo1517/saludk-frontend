'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { useCitasStore } from '@/lib/store/citasStore';

const palettes = {
    emerald: { card: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-800', value: 'text-emerald-900', sub: 'text-emerald-600' },
    amber: { card: 'bg-amber-50 border-amber-200', title: 'text-amber-800', value: 'text-amber-900', sub: 'text-amber-600' },
    rose: { card: 'bg-rose-50 border-rose-200', title: 'text-rose-800', value: 'text-rose-900', sub: 'text-rose-600' },
};

function paletteForCitas(count: number) {
    if (count < 3) return palettes.emerald;
    if (count <= 8) return palettes.amber;
    return palettes.rose;
}

export default function CitasPage() {
    const router = useRouter();
    const { stats } = useCitasStore();
    const [loading, setLoading] = useState(false);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
    );

    const agendadas = stats?.citas_mes.filter(c => c.estado === "AGENDADA") ?? [];
    const confirmadas = stats?.citas_mes.filter(c => c.estado === "CONFIRMADA") ?? [];

    const palAgend = paletteForCitas(agendadas.length);
    const palApr = paletteForCitas(confirmadas.length);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-800">Citas</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`border ${palAgend.card}`}>
                    <CardHeader><CardTitle className={palAgend.title}>Citas Agendadas</CardTitle></CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold ${palAgend.value}`}>{agendadas.length.toLocaleString()}</p>
                        <p className={`text-sm mt-1 ${palAgend.sub}`}>Total en estado AGENDADO</p>
                        <button onClick={() => router.push('/medico/citas/listaCitas?tipo=agendadas')} className="mt-3 text-sm text-slate-600 hover:text-slate-900 hover:underline cursor-pointer">
                            Ver lista
                        </button>
                    </CardContent>
                </Card>

                <Card className={`border ${palApr.card}`}>
                    <CardHeader><CardTitle className={palApr.title}>Citas CONFIRMADAS</CardTitle></CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold ${palApr.value}`}>{confirmadas.length.toLocaleString()}</p>
                        <p className={`text-sm mt-1 ${palApr.sub}`}>Total en estado CONFIRMADA</p>
                        <button onClick={() => router.push('/medico/citas/listaCitas?tipo=aprobadas')} className="mt-3 text-sm text-slate-600 hover:text-slate-900 hover:underline cursor-pointer">
                            Ver lista
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
