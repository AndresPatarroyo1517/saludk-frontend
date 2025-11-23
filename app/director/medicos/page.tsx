"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { useRouter } from "next/navigation";
import { medicosService } from '@/lib/api/services/medicosService';
import { User } from "lucide-react";
import { Label } from '@/components/ui/label';

interface Paginacion {
    total: number;
    limite: number;
    offset: number;
    pagina_actual: number;
    total_paginas: number;
    tiene_siguiente: boolean;
    tiene_anterior: boolean;
}

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

export default function DoctoresPage() {
    const router = useRouter();

    const [medicos, setMedicos] = useState<any[]>([]);
    const [paginacion, setPaginacion] = useState<Paginacion | null>(null);

    const [search, setSearch] = useState("");
    const [especialidad, setEspecialidad] = useState("");
    const [localidad, setLocalidad] = useState("");
    const [calificacion, setCalificacion] = useState("");

    const [page, setPage] = useState(1);

    async function cargarMedicos() {
        const filtros: any = {
            nombre: search || undefined,
            especialidad: especialidad || undefined,
            localidad: localidad || undefined,
            calificacion: calificacion || undefined,
            pagina: page
        };

        const res = await medicosService.getMedicos(filtros);
        console.log(res);


        setMedicos(res.data.medicos);
        setPaginacion(res.data.paginacion);
    }

    // Cargar médicos al renderizar
    useEffect(() => {
        cargarMedicos();
    }, []);

    // Volver a cargar si hay cambio de página
    useEffect(() => {
        cargarMedicos();
    }, [page]);

    return (
        <div className="p-6 flex flex-col gap-6 w-full">
            {/* Header */}
            <div className="flex w-full flex-row items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Doctores</h1>
                    <p className="text-gray-500">Busca, filtra y administra la información de los doctores.</p>
                </div>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => router.push("/director/medicos/formMedico")}
                >
                    Añadir Nuevo Doctor
                </button>
            </div>

            {/* Search + Filters */}

            <div className="flex items-center gap-4 w-full flex-wrap">
                <input
                    type="text"
                    placeholder="Buscar doctores por nombre..."
                    className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="flex flex-col gap-1 min-w-[150px]">
                    <Label>Especialidad</Label>
                    <select
                        className="border rounded-lg px-3 py-2"
                        value={especialidad}
                        onChange={(e) => setEspecialidad(e.target.value)}
                    >
                        <option value="">---</option>
                        {especialidades.map((esp) => (
                            <option key={esp} value={esp}>{esp}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[150px]">
                    <Label>Localidad</Label>
                    <select
                        className="border rounded-lg px-3 py-2"
                        value={localidad}
                        onChange={(e) => setLocalidad(e.target.value)}
                    >
                        <option value="">---</option>
                        {localidades.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[120px]">
                    <Label>Calificación</Label>
                    <select
                        className="border rounded-lg px-3 py-2"
                        value={calificacion}
                        onChange={(e) => setCalificacion(e.target.value)}
                    >
                        <option value="">---</option>
                        <option value="1">≥ 1</option>
                        <option value="2">≥ 2</option>
                        <option value="3">≥ 3</option>
                        <option value="4">≥ 4</option>
                    </select>
                </div>

                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => {
                        setPage(1);
                        cargarMedicos();
                    }}
                >
                    Aplicar
                </button>
            </div>


            {/* Tabla */}
            <div className="border rounded-xl bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Especialidad</TableHead>
                            <TableHead>Localidad</TableHead>
                            <TableHead>Calificación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {medicos.map((m: any) => (
                            <TableRow key={m.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <span>{m.nombre_completo}</span>
                                    </div>
                                </TableCell>

                                <TableCell>{m.especialidad}</TableCell>
                                <TableCell>{m.localidad}</TableCell>
                                <TableCell>{m.calificacion_promedio}</TableCell>

                                <TableCell className="flex justify-end">
                                    <button
                                        className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm"
                                        onClick={() => router.push(`/director/medicos/${m.id}`)}
                                    >
                                        Ver
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {paginacion && paginacion.total > 0 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                className={paginacion.tiene_anterior ? "cursor-pointer" : "cursor-not-allowed opacity-40"}
                                onClick={() =>
                                    paginacion.tiene_anterior && setPage(page - 1)
                                }
                            />
                        </PaginationItem>

                        {Array.from({ length: paginacion.total_paginas }).map((_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    isActive={page === i + 1}
                                    onClick={() => setPage(i + 1)}
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                className={paginacion.tiene_siguiente ? "cursor-pointer" : "cursor-not-allowed opacity-40"}
                                onClick={() =>
                                    paginacion.tiene_siguiente && setPage(page + 1)
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
