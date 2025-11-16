'use client';

import { useAuthStore } from '@/lib/store/authStore';

export default function MedicoHome() {
    const { user } = useAuthStore();

    return (
        <div className="p-6 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl ">
                <h1 className="text-3xl font-semibold text-gray-900">
                    Bienvenido Dr
                    {user?.datos_personales?.nombres
                        ? `, ${user.datos_personales.nombres}`
                        : 'Medico'}
                    .
                </h1>

                <p className="text-gray-600 mt-3 text-lg leading-relaxed">
                    Accede a las herramientas para gestionar tus horaios disponibles o
                    citas agendadas desde la la parte izquierda de la pantalla.
                </p>
            </div>
        </div>
    );
}
