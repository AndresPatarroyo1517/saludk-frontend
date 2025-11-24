'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Stethoscope } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Description, DialogBackdrop } from "@headlessui/react";
import { useRouter, useParams } from "next/navigation";
import { useMedicosStore } from "@/lib/store/medicosStore";
import { medicosService } from '@/lib/api/services/medicosService';
import { directorService } from '@/lib/api/services/directorService';

const localidades = [
    "Chapinero", "Usaquén", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito", "Bosa", "Kennedy", "Fontibón", "Engativá",
];
const especialidades = ["Cardiología", "Medicina General", "Dermatología", "Pediatría", "Ginecología"];

export interface MedicoForm {
    usuario: { email: string; password?: string };
    medico: {
        nombres: string;
        apellidos: string;
        numero_identificacion: string;
        especialidad: string;
        registro_medico: string;
        telefono: string;
        localidad: string;
        disponible: boolean;
        costo_consulta_presencial?: number;
        costo_consulta_virtual?: number;
    };
}

export default function MedicoDetallePage() {
    const router = useRouter();
    const params = useParams();
    const medicoId = params.id as string;

    const { medicos, setMedicos } = useMedicosStore();

    const [medico, setMedico] = useState<any>(null);
    const [form, setForm] = useState<MedicoForm>({
        usuario: { email: "", password: "" },
        medico: {
            nombres: "",
            apellidos: "",
            numero_identificacion: "",
            especialidad: "",
            registro_medico: "",
            telefono: "",
            localidad: "",
            disponible: true,
            costo_consulta_presencial: 0,
            costo_consulta_virtual: 0,
        }
    });

    const [originalForm, setOriginalForm] = useState<MedicoForm>(form);
    const [editMode, setEditMode] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openSuccessModal, setOpenSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Cargar médico
    useEffect(() => {
        async function load() {
            try {
                const data = await medicosService.getMedico(medicoId);
                
                const mapped: MedicoForm = {
                    usuario: { email: data.data.email },
                    medico: {
                        nombres: data.data.nombres,
                        apellidos: data.data.apellidos,
                        numero_identificacion: data.data.numero_identificacion,
                        especialidad: data.data.especialidad,
                        registro_medico: data.data.registro_medico,
                        telefono: data.data.telefono,
                        localidad: data.data.localidad,
                        disponible: data.data.disponible,
                        costo_consulta_presencial: data.data.costo_consulta_presencial,
                        costo_consulta_virtual: data.data.costo_consulta_virtual,
                    }
                };
                setForm(mapped);
                setOriginalForm(mapped);
                setMedico(data.data);
            } catch (err) {
                console.error("Error al obtener médico", err);
            }
        }
        load();
    }, [medicoId]);

    if (!medico) {
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

    const handleChange = (section: 'usuario' | 'medico', field: string, value: string | number | boolean) => {
        setForm(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value },
        }));
    };

    // Validaciones
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (tel: string) => tel.trim().length >= 10;
    const isPositiveNumber = (num: number) => num > 0;
    const isNonEmpty = (val: string) => val && val.toString().trim() !== "";

    const isFormValid =
        isValidEmail(form.usuario.email) &&
        isValidPhone(form.medico.telefono) &&
        isNonEmpty(form.medico.nombres) &&
        isNonEmpty(form.medico.apellidos) &&
        isNonEmpty(form.medico.especialidad) &&
        isNonEmpty(form.medico.registro_medico) &&
        isNonEmpty(form.medico.localidad) &&
        isPositiveNumber(form.medico.costo_consulta_presencial ?? 0) &&
        isPositiveNumber(form.medico.costo_consulta_virtual ?? 0);

    // Guardar edición
    const handleUpdate = async () => {
        if (!isFormValid) return;

        try {
            // Llamada al backend
            const body = {
                usuario: { email: form.usuario.email, password: form.usuario.password },
                medico: {
                    nombres: form.medico.nombres,
                    apellidos: form.medico.apellidos,
                    numero_identificacion: form.medico.numero_identificacion,
                    especialidad: form.medico.especialidad,
                    registro_medico: form.medico.registro_medico,
                    telefono: form.medico.telefono,
                    localidad: form.medico.localidad,
                    disponible: form.medico.disponible,
                    costo_consulta_presencial: form.medico.costo_consulta_presencial,
                    costo_consulta_virtual: form.medico.costo_consulta_virtual,
                    ...(form.medico.costo_consulta_presencial === undefined ? {} : { costo_consulta_presencial: form.medico.costo_consulta_presencial }),
                    ...(form.medico.costo_consulta_virtual === undefined ? {} : { costo_consulta_virtual: form.medico.costo_consulta_virtual }),
                },
            };

            if (form.usuario.password) {
                body.usuario.password = form.usuario.password;
            }

            const updated = await directorService.actualizarMedico(medicoId, body);

            // Actualizar estado local y store
            const updatedList = medicos.map(m => m.id === medicoId ? { ...m, ...updated } : m);
            setMedicos(updatedList);
            setMedico(updated);
            setOriginalForm(form);

            setOpenEditModal(false);
            setEditMode(false);
            setSuccessMessage("Médico actualizado exitosamente");
            setOpenSuccessModal(true);

        } catch (err: any) {
            console.error("Error al actualizar médico:", err);
            alert(err?.message || "Error al actualizar el médico");
        }
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setForm(originalForm);
        setEditMode(false);
    };

    // Eliminar médico
    const handleDelete = async() => {
        try {
            await directorService.desactivarMedico(medicoId);

            const filtered = medicos.filter(m => m.id !== medicoId);
            setMedicos(filtered);

            setOpenDeleteModal(false);
            setSuccessMessage("Médico eliminado exitosamente");
            setOpenSuccessModal(true);

        } catch (err: any) {
            console.error("Error al desactivar médico:", err);
            alert(err?.message || "Error al eliminar el médico");
        }
    };

    const closeSuccessModal = () => {
        setOpenSuccessModal(false);
        router.push("/director/medicos");
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
            <div className="max-w-4xl mx-auto transition-all duration-700">

                {/* Header */}
                <Card className="border-0 bg-linear-to-br from-white to-slate-50 shadow-xl mb-10">
                    <CardContent className="p-8 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl">
                            <UserPlus className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Detalle del Médico</h1>
                            <p className="text-slate-600 mt-1">Visualiza, edita o elimina la información del profesional</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Formulario */}
                <Card className="border-0 bg-white shadow-xl p-6">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-green-600" />
                            Información del Médico
                        </CardTitle>
                        <CardDescription>Datos básicos y de contacto</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Inputs */}
                        <div>
                            <Label>Nombres</Label>
                            <Input value={form.medico.nombres} disabled={!editMode} onChange={e => handleChange('medico', 'nombres', e.target.value)} />
                        </div>
                        <div>
                            <Label>Apellidos</Label>
                            <Input value={form.medico.apellidos} disabled={!editMode} onChange={e => handleChange('medico', 'apellidos', e.target.value)} />
                        </div>
                        <div>
                            <Label>Número Identificación</Label>
                            <Input value={form.medico.numero_identificacion} disabled={!editMode} onChange={e => handleChange('medico', 'numero_identificacion', e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Especialidad</Label>
                            <select disabled={!editMode} value={form.medico.especialidad} onChange={e => handleChange('medico', 'especialidad', e.target.value)} className="border rounded-lg px-3 py-2">
                                <option value="">---</option>
                                {especialidades.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label>Registro Médico</Label>
                            <Input value={form.medico.registro_medico} disabled={!editMode} onChange={e => handleChange('medico', 'registro_medico', e.target.value)} />
                        </div>
                        <div>
                            <Label>Teléfono</Label>
                            <Input value={form.medico.telefono} disabled={!editMode} onChange={e => handleChange('medico', 'telefono', e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Localidad</Label>
                            <select disabled={!editMode} value={form.medico.localidad} onChange={e => handleChange('medico', 'localidad', e.target.value)} className="border rounded-lg px-3 py-2">
                                <option value="">---</option>
                                {localidades.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label>Costo Consulta Presencial</Label>
                            <Input type="number" min={0} value={form.medico.costo_consulta_presencial} disabled={!editMode} onChange={e => handleChange('medico', 'costo_consulta_presencial', Number(e.target.value))} />
                        </div>
                        <div>
                            <Label>Costo Consulta Virtual</Label>
                            <Input type="number" min={0} value={form.medico.costo_consulta_virtual} disabled={!editMode} onChange={e => handleChange('medico', 'costo_consulta_virtual', Number(e.target.value))} />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Email</Label>
                            <Input value={form.usuario.email} disabled={!editMode} onChange={e => handleChange('usuario', 'email', e.target.value)} />
                        </div>
                        {editMode && (
                            <div className="md:col-span-2">
                                <Label>Contraseña</Label>
                                <Input type="password" placeholder="********" onChange={e => handleChange('usuario', 'password', e.target.value)} />
                            </div>
                        )}

                        {/* Botones */}
                        <div className="md:col-span-2 flex gap-4 mt-6">
                            {!editMode && <Button className="bg-blue-600 text-white" onClick={() => setEditMode(true)}>Editar</Button>}
                            {editMode && <>
                                <Button className="bg-green-600 text-white" onClick={() => setOpenEditModal(true)} disabled={!isFormValid}>Guardar cambios</Button>
                                <Button className="bg-gray-400 text-white" onClick={handleCancelEdit}>Cancelar edición</Button>
                            </>}
                            <Button className="bg-red-600 text-white" onClick={() => setOpenDeleteModal(true)}>Eliminar Médico</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Modales */}
                <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} className="relative z-50">
                    <DialogBackdrop className="fixed inset-0 bg-black/30" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="bg-white p-6 rounded-xl w-full max-w-md">
                            <DialogTitle className="text-lg font-bold">Confirmar edición</DialogTitle>
                            <Description>¿Desea guardar los cambios realizados?</Description>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button onClick={() => setOpenEditModal(false)}>Cancelar</Button>
                                <Button className="bg-green-600 text-white" onClick={handleUpdate}>Confirmar</Button>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>

                <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} className="relative z-50">
                    <DialogBackdrop className="fixed inset-0 bg-black/30" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="bg-white p-6 rounded-xl w-full max-w-md">
                            <DialogTitle className="text-lg font-bold">Eliminar Médico</DialogTitle>
                            <Description>Esta acción no se puede deshacer. ¿Desea continuar?</Description>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button onClick={() => setOpenDeleteModal(false)}>Cancelar</Button>
                                <Button className="bg-red-600 text-white" onClick={handleDelete}>Eliminar</Button>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>

                <Dialog open={openSuccessModal} onClose={closeSuccessModal} className="relative z-50">
                    <DialogBackdrop className="fixed inset-0 bg-black/30" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4 border border-slate-200">
                            <DialogTitle className="text-lg font-semibold text-slate-800">Éxito</DialogTitle>
                            <Description className="text-sm text-slate-600">{successMessage}</Description>
                            <Button className="mt-3 bg-blue-600 text-white" onClick={closeSuccessModal}>Cerrar</Button>
                        </DialogPanel>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}
