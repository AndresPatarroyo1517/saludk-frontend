'use client';

import { useAuthStore } from '@/lib/store/authStore';

export default function MedicoHome() {
    const { user } = useAuthStore();

    return (
        <div className="p-6 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl ">
                <h1 className="text-3xl font-semibold text-gray-900">
                    Perfil page
                </h1>

                <p className="text-gray-600 mt-3 text-lg leading-relaxed">
                    Aca debe ir foto de perfil, los horarios disponibles y la calificacion promedio? del medico
                </p>
            </div>
        </div>
    );
}
