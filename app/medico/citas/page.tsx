'use client';

import { useAuthStore } from '@/lib/store/authStore';

export default function MedicoHome() {
    const { user } = useAuthStore();

    return (
        <div className="p-6 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl ">
                <h1 className="text-3xl font-semibold text-gray-900">
                    Citas medicas
                </h1>

                <p className="text-gray-600 mt-3 text-lg leading-relaxed">
                    Dividir en dos cards, una tiene las citas agendadas para el dia de hoy (tipo teams) y
                    la segunda card tiene las citas agendadas totales (mostrar como el calendario de teams)
                </p>
            </div>
        </div>
    );
}
