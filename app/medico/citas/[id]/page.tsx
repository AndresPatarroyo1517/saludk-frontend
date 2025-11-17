'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCitasStore, CitaAgendada } from '@/lib/store/citasStore';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogPanel, DialogTitle, Description, DialogBackdrop } from '@headlessui/react';
import citasService from '@/lib/api/services/citasService';

export default function DetalleCita() {
    const { id } = useParams();
    const router = useRouter();
    const { stats } = useCitasStore();

    const cita: CitaAgendada | undefined =
        stats?.proximas_citas_hoy.find(c => c.id === id) ||
        stats?.citas_mes.find(c => c.id === id);

    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [mensajeConfirm, setMensajeConfirm] = useState('');

    if (!cita) {
        return (
            <div className="text-center text-slate-500 mt-10">
                <p>Cita no encontrada o no cargada.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-3 py-2 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                >
                    Volver
                </button>
            </div>
        );
    }

    const actualizarEstado = async (nuevoEstado: string, mensaje: string) => {
        try {
            await citasService.modificarEstadoCita(cita.id, { estado: nuevoEstado });
            setMensajeConfirm(mensaje);
            setModalConfirmOpen(true);
        } catch (e) {
            console.error(e);
            alert(`Error al actualizar el estado a ${nuevoEstado}`);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (modalConfirmOpen) {
            timer = setTimeout(() => {
                setModalConfirmOpen(false);
                router.push('/medico'); // Navega automáticamente después de 5s
            }, 3500);
        }
        return () => clearTimeout(timer); // Limpiar el timeout si se cierra antes
    }, [modalConfirmOpen, router]);

    const handleConfirmClose = () => {
        setModalConfirmOpen(false);
        router.push('/medico'); // Redirige al listado
    };

    return (
        <div className="grid h-full w-full gap-4 p-2 grid-cols-4 grid-rows-2">
            {/* Detalle de Cita */}
            <div className="col-span-2 row-span-2 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg p-4 overflow-auto">
                <Card className="mb-4 border-none shadow-none bg-transparent">
                    <CardHeader>
                        <CardTitle className="text-blue-800 text-lg font-semibold">Detalle de Cita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-slate-700">
                        <p><strong>ID:</strong> {cita.id}</p>
                        <p><strong>Estado:</strong> {cita.estado}</p>
                        <p><strong>Fecha/Hora:</strong> {new Date(cita.fecha).toLocaleString()}</p>
                        <p><strong>Modalidad:</strong> {cita.modalidad}</p>
                        <p><strong>Paciente:</strong> {cita.paciente}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Botón Historial Médico */}
            <div className="col-span-2 row-span-1 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg flex items-center justify-center p-4">
                <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                    onClick={() => alert('Abrir historial médico (modal o página)')}
                >
                    Ver Historial Médico
                </button>
            </div>

            {/* Botones de acción */}
            <div className="col-span-2 row-span-1 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg flex items-center justify-end gap-3 p-4">
                {cita.estado === 'AGENDADA' && (
                    <button
                        onClick={() => actualizarEstado('CONFIRMADA', 'La cita ha sido confirmada exitosamente.')}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                    >
                        Confirmar Cita
                    </button>
                )}
                {cita.estado === 'CONFIRMADA' && (
                    <>
                        <button
                            onClick={() => actualizarEstado('COMPLETADA', 'La cita ha sido completada exitosamente.')}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer"
                        >
                            Completar Cita
                        </button>
                        <button
                            onClick={() => actualizarEstado('NO_ASISTIO', 'Se ha registrado que el paciente no asistió.')}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                        >
                            No Asistió
                        </button>
                    </>
                )}
                <button
                    onClick={() => router.back()}
                    className="px-3 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition cursor-pointer"
                >
                    Volver a la lista
                </button>
            </div>

            {/* Modal de confirmación */}
            <Dialog open={modalConfirmOpen} onClose={() => setModalConfirmOpen(false)} className="relative z-50">
                <DialogBackdrop className="fixed inset-0 bg-black/30" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center space-y-4">
                        <DialogTitle className="text-lg font-semibold">¡Acción completada!</DialogTitle>
                        <Description className="text-sm text-slate-500">{mensajeConfirm}</Description>
                        <button
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            onClick={handleConfirmClose}
                        >
                            Cerrar
                        </button>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
