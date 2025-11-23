'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Shield, Stethoscope } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Description, DialogBackdrop } from "@headlessui/react";
import registroService, { RegistroMedicoRequest } from "@/lib/api/services/directorService";
import { useRouter } from "next/navigation";

const localidades = [
    "Chapinero",
    "Usaquén",
    "Santa Fe",
    "San Cristóbal",
    "Usme",
    "Tunjuelito",
    "Bosa",
    "Kennedy",
    "Fontibón",
    "Engativá",
];

const especialidades = [
    "Cardiología",
    "Medicina General",
    "Dermatología",
    "Pediatría",
    "Ginecología",
];

export default function CrearMedicoPage() {
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const [form, setForm] = useState<RegistroMedicoRequest>({
        usuario: {
            email: "",
            password: "",
        },
        medico: {
            nombres: "",
            apellidos: "",
            numero_identificacion: "",
            especialidad: "",
            registro_medico: "",
            telefono: "",
            costo_consulta_presencial: 0,
            costo_consulta_virtual: 0,
            localidad: "",
            disponible: true,
        },
    });

    // -------------------------------
    // VALIDACIÓN DEL FORMULARIO
    // -------------------------------
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isFormValid =
        form.usuario.email.trim() !== "" &&
        isValidEmail(form.usuario.email) &&
        form.usuario.password.trim().length >= 6 &&
        form.medico.nombres.trim() !== "" &&
        form.medico.apellidos.trim() !== "" &&
        form.medico.numero_identificacion.trim().length >= 10 &&
        form.medico.especialidad.trim() !== "" &&
        form.medico.registro_medico.trim() !== "" &&
        form.medico.telefono.trim().length >= 10 &&
        form.medico.localidad.trim() !== "" &&
        form.medico.costo_consulta_presencial > 0 &&
        form.medico.costo_consulta_virtual > 0;

    // -------------------------------
    // AUTO-CIERRE DEL MODAL Y REDIRECCIÓN
    // -------------------------------
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (modalOpen) {
            timer = setTimeout(() => {
                setModalOpen(false);
                router.push("/director/medicos");
            }, 4000);
        }

        return () => clearTimeout(timer);
    }, [modalOpen, router]);

    const handleChange = (section: 'usuario' | 'medico', field: string, value: string | number | boolean) => {
        setForm(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const onSubmit = async () => {
        if (!isFormValid) return;

        try {
            const response = await registroService.register(form);
            setModalMessage(response.message);
            setModalOpen(true);
        } catch (e) {
            console.error(e);
            setModalMessage("Error al crear el médico.");
            setModalOpen(true);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        router.push("/director/medicos");
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
            <div className="max-w-4xl mx-auto transition-all duration-700">

                {/* Header */}
                <Card className="border-0 bg-linear-to-br from-white to-slate-50 shadow-xl mb-10">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl">
                                <UserPlus className="w-10 h-10 text-white" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">
                                    Crear Nuevo Médico
                                </h1>
                                <p className="text-slate-600 mt-1">
                                    Registra un nuevo profesional de salud en la plataforma
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Formulario */}
                <Card className="border-0 bg-white shadow-xl p-6">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Credenciales de Usuario
                        </CardTitle>
                        <CardDescription>
                            Datos necesarios para iniciar sesión
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">

                        {/* Credenciales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Email */}
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={form.usuario.email}
                                    onChange={(e) => handleChange('usuario', 'email', e.target.value)}
                                    className={`border-2 rounded-xl p-3 ${!isValidEmail(form.usuario.email) && form.usuario.email ? "border-red-500" : "border-slate-200"}`}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <Label>Contraseña</Label>
                                <Input
                                    type="password"
                                    placeholder="********"
                                    value={form.usuario.password}
                                    onChange={(e) => handleChange('usuario', 'password', e.target.value)}
                                    className={`border-2 rounded-xl p-3 ${form.usuario.password.length > 0 && form.usuario.password.length < 6 ? "border-red-500" : "border-slate-200"}`}
                                />
                                {form.usuario.password.length > 0 && form.usuario.password.length < 6 && (
                                    <p className="text-red-500 text-xs mt-1">Mínimo 6 caracteres.</p>
                                )}
                            </div>
                        </div>

                        <hr className="my-6" />

                        {/* Datos médico */}
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-green-600" />
                            Información del Médico
                        </CardTitle>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <Label>Nombres</Label>
                                <Input
                                    value={form.medico.nombres}
                                    onChange={(e) => handleChange('medico', 'nombres', e.target.value)}
                                />
                            </div>


                            <div>
                                <Label>Apellidos</Label>
                                <Input
                                    value={form.medico.apellidos}
                                    onChange={(e) => handleChange('medico', 'apellidos', e.target.value)}
                                />
                            </div>


                            <div>
                                <Label>Número Identificación</Label>
                                <Input
                                    value={form.medico.numero_identificacion}
                                    onChange={(e) => handleChange('medico', 'numero_identificacion', e.target.value)}
                                />
                            </div>


                            <div className="flex flex-col gap-1">
                                <Label>Especialidad</Label>
                                <select
                                    className="border rounded-lg px-3 py-2"
                                    value={form.medico.especialidad}
                                    onChange={(v) => handleChange('medico', 'especialidad', v.target.value)}
                                >
                                    <option value="">---</option>
                                    {especialidades.map((esp) => (
                                        <option key={esp} value={esp}>{esp}</option>
                                    ))}
                                </select>
                            </div>


                            <div>
                                <Label>Registro Médico (RM)</Label>
                                <Input
                                    value={form.medico.registro_medico}
                                    onChange={(e) => handleChange('medico', 'registro_medico', e.target.value)}
                                />
                            </div>


                            <div>
                                <Label>Teléfono</Label>
                                <Input
                                    value={form.medico.telefono}
                                    onChange={(e) => handleChange('medico', 'telefono', e.target.value)}
                                />
                            </div>


                            <div className="flex flex-col gap-1">
                                <Label>Localidad</Label>
                                <select
                                    className="border rounded-lg px-3 py-2"
                                    value={form.medico.localidad}
                                    onChange={(v) => handleChange('medico', 'localidad', v.target.value)}
                                >
                                    <option value="">---</option>
                                    {localidades.map((loc) => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>


                            {/* Costo consulta presencial */}
                            <div>
                                <Label>Costo Consulta Presencial</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.medico.costo_consulta_presencial}
                                    onChange={(e) => handleChange('medico', 'costo_consulta_presencial', Number(e.target.value))}
                                />
                            </div>

                            {/* Costo consulta virtual */}
                            <div>
                                <Label>Costo Consulta Virtual</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.medico.costo_consulta_virtual}
                                    onChange={(e) => handleChange('medico', 'costo_consulta_virtual', Number(e.target.value))}
                                />
                            </div>


                        </div>

                        {/* Botón enviar */}
                        <div className="pt-6 text-right">
                            <Button
                                disabled={!isFormValid}
                                onClick={onSubmit}
                                className="bg-linear-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl shadow-md cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                               Crear Médico
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Modal */}
                <Dialog open={modalOpen} onClose={closeModal} className="relative z-50">
                    <DialogBackdrop className="fixed inset-0 bg-black/30 transition-opacity" />

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4 border border-slate-200">
                            <DialogTitle className="text-lg font-semibold text-slate-800">
                                Confirmación
                            </DialogTitle>

                            <Description className="text-sm text-slate-600">
                                {modalMessage}
                            </Description>

                            <button
                                onClick={closeModal}
                                className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </DialogPanel>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}
