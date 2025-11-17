'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSolicitudesStore } from '@/lib/store/solicitudesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import solicitudesService from '@/lib/api/services/directorService';
import { Dialog, DialogPanel, DialogTitle, Description, DialogBackdrop } from '@headlessui/react';

export default function DetalleSolicitud() {
    const { id } = useParams();
    const router = useRouter();
    const { aprobadas, pendientes } = useSolicitudesStore();
    const solicitud = [...aprobadas, ...pendientes].find((s) => s.id === id);
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [modalMotivoOpen, setModalMotivoOpen] = useState(false);
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [accion, setAccion] = useState<'aprobar' | 'rechazar' | 'devolver' | null>(null);
    const [motivo, setMotivo] = useState('');

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const response = await solicitudesService.getDocumentosSolicitud(id as string);
                // Aquí accedemos al array real de documentos
                setDocumentos(response.data || []);
            } catch (err) {
                console.error(err);
                setDocumentos([]);
            }
        })();
    }, [id]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (modalConfirmOpen) {
            timer = setTimeout(() => {
                setModalConfirmOpen(false);
                router.push('/director/solicitudes');
            }, 5000);
        }
        return () => clearTimeout(timer); // Limpiar el timeout si se cierra antes
    }, [modalConfirmOpen, router]);

    if (!solicitud) {
        return (
            <div className="text-center text-slate-500 mt-10">
                <p>Solicitud no encontrada o no cargada.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-3 py-2 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                >
                    Volver
                </button>
            </div>
        );
    }

    const handleAprobar = async () => {
        try {
            await solicitudesService.aprobarSolicitud(solicitud.id);
            setAccion('aprobar');
            setModalConfirmOpen(true);
        } catch (e) {
            console.error(e);
            alert('Error al aprobar la solicitud');
        }
    };

    const handleAccionConMotivo = async () => {
        if (!accion) return;
        try {
            if (accion === 'rechazar') {
                await solicitudesService.rechazarSolicitud(solicitud.id, motivo);
            } else if (accion === 'devolver') {
                await solicitudesService.devolverSolicitud(solicitud.id, motivo);
            }
            setModalMotivoOpen(false);
            setModalConfirmOpen(true);
            setMotivo('');
        } catch (e) {
            console.error(e);
            alert(`Error al ${accion} la solicitud`);
        }
    };

    const closeModalMotivo = () => {
        setModalMotivoOpen(false);
        setMotivo(''); // Limpiar motivo al cerrar
    };

    const handleConfirmClose = () => {
        setModalConfirmOpen(false);
        router.push('/director/solicitudes'); // Redirige al dashboard de solicitudes
    };

    const p = solicitud.paciente;

    return (
        <div className="grid h-full w-full gap-4 p-2 grid-cols-4 grid-rows-2">
            {/* Salmon: Detalle + Paciente */}
            <div className="col-span-2 row-span-2 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg p-4 overflow-auto">
                <Card className="mb-4 border-none shadow-none bg-transparent">
                    <CardHeader>
                        <CardTitle className="text-blue-800 text-lg font-semibold">Detalle de Solicitud</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-slate-700">
                        <p><strong>ID:</strong> {solicitud.id}</p>
                        <p><strong>Estado:</strong> {solicitud.estado}</p>
                        <p><strong>Fecha creación:</strong> {new Date(solicitud.fecha_creacion ?? '').toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader>
                        <CardTitle className="text-green-800 text-lg font-semibold">Datos del Paciente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-slate-700">
                        <p><strong>Nombre:</strong> {p.nombres} {p.apellidos}</p>
                        <p><strong>Identificación:</strong> {p.tipo_identificacion} {p.numero_identificacion}</p>
                        <p><strong>Teléfono:</strong> {p.telefono}</p>
                        <p><strong>Correo:</strong> {p.usuario.email}</p>
                        <p><strong>Tipo de sangre:</strong> {p.tipo_sangre}</p>
                        <p><strong>Alergias:</strong> {p.alergias.join(', ')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Broccoli: Documentos */}
            <div className="col-span-2 row-span-1 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg p-4 overflow-auto">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader>
                        <CardTitle className="text-indigo-800 text-lg font-semibold">Documentos Asociados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {documentos.length > 0 ? (
                            documentos.map((doc, i) => (
                                <a
                                    key={i}
                                    href={doc.ruta_storj}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-3 py-2 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-sm transition"
                                >
                                    {doc.nombre || `Documento ${i + 1}`}
                                </a>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No hay documentos asociados.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tamago: Botones */}
            <div className="col-span-2 row-span-1 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg flex items-center justify-end gap-3 p-4">
                <button onClick={handleAprobar}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer">
                    Aprobar
                </button>
                <button onClick={() => { setAccion('devolver'); setModalMotivoOpen(true); }}
                    className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition cursor-pointer">
                    Devolver
                </button>
                <button onClick={() => { setAccion('rechazar'); setModalMotivoOpen(true); }}
                    className="px-3 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition cursor-pointer">
                    Rechazar
                </button>
                <button
                    onClick={() => router.back()}
                    className="px-3 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition cursor-pointer"
                >
                    Volver a la lista
                </button>
            </div>

            {/* Modal de Motivo */}
            <Dialog open={modalMotivoOpen} onClose={closeModalMotivo} className="relative z-50">
                <DialogBackdrop className="fixed inset-0 bg-black/30" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
                        <DialogTitle className="text-lg  text-slate-950 font-semibold">
                            {accion === 'rechazar' ? 'Rechazar Solicitud' : 'Devolver Solicitud'}
                        </DialogTitle>
                        <Description className="text-sm text-slate-500">
                            Ingrese el motivo para {accion}.
                        </Description>
                        <textarea
                            className="w-full mt-2 p-2 text-black border rounded-md"
                            placeholder="Ingrese el motivo..."
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                className="px-3 py-2 bg-rose-500 rounded-lg hover:bg-rose-600 transition cursor-pointer"
                                onClick={() => setModalMotivoOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                                onClick={handleAccionConMotivo}
                            >
                                Confirmar
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Modal de Confirmación */}
            <Dialog open={modalConfirmOpen} onClose={handleConfirmClose} className="relative z-50">
                <DialogBackdrop className="fixed inset-0 bg-black/30" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center space-y-4">
                        <DialogTitle className="text-lg font-semibold">¡Acción completada!</DialogTitle>
                        <Description className="text-sm text-slate-500">
                            {accion === 'aprobar' && 'La solicitud ha sido aprobada exitosamente.'}
                            {accion === 'rechazar' && 'La solicitud ha sido rechazada exitosamente.'}
                            {accion === 'devolver' && 'La solicitud ha sido devuelta exitosamente.'}
                        </Description>
                        <button
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
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
