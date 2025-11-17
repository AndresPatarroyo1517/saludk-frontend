"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect, useState } from "react";

export default function Home() {
    const router = useRouter();

    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fallbackImages = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA_7rcNuoTvGgS0DMnU4mYnmL54eL6kzVJSVm9RIpRlRIueaWlgnThIht-dTC5YhkAgz4rTg9ARA2kHH_MATyMkzsXEdPomhLm05hk6oY0TOiVjGNTba4N5gZdTUUYyR08wuHYBPPeek_rZTctZKw0bJ4UufIWs0DVPFiGJcCzdFjJlj1qHHKk2e_A9SYcIlMXioiSZPlrhmdiOwVApa2KylPNoEVuthkLe01vxQZH1mOdhQoE2yZg9RpfQqWWzElEj0zFWH3pyEv4",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBW7jg0cwhrNn78kZ1XZyp5hDzfhrEpu70BIvhD-km23YXEZaYyr7F5ZNEwYmZPIZ7d9sBICo16Y9zfNl92sVMfZi2nesUyvP_nBTgL54gfE8_AP2pB8b-T1Jk1rlG8GS3gsmo1yztWsV1TAmQA-oJUOIZsCCqAs9LB6A0b_wcrtYlWR2Xvfn_jrgXDhUGeTnuyR7XTXAEHibtczel6hSFRfKYsJVMIUrQ3cDktbKJHJU-rAwmRtoj1Zf1tZzIHGf7BhSizSDI4QpI",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAosWGiPKT_Jpb2DtL02PNjYVQhYpBRk750TG88jBV3GjLyJOHcgDMh9I2w1RYzmpJi8vdhe26DICIn3442-ccP3j1Ydjye4nGmC0z0vWVV30yPc6tqXkooluNLwC6xmWExo00TP4DxfdnzMRIzO5ouqYtUmPGePKqm5hga1Rj1VEaOCk7JoQDBz3DhxI7fSPtEvyW_VD7UNHrsdKoiAuDUOP8W3MOMXyb5dnsDK6pDdVey04PHm7qY_YaMnEsOafcrUgl0vFWmGG8",
    ];

    // fallback data in case the API fails (keeps UI usable)
    const fallbackDoctors = [
        { id: "1", name: "Dr. Alejandro Torres", specialty: "Cardiólogo", rating: 4.5, reviews: 123, image: fallbackImages[0] },
        { id: "2", name: "Dra. Isabel Gómez", specialty: "Dermatóloga", rating: 5.0, reviews: 98, image: fallbackImages[1] },
        { id: "3", name: "Dr. Carlos Nuñez", specialty: "Pediatra", rating: 4.0, reviews: 210, image: fallbackImages[2] },
    ];

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();
        const url = "http://localhost:3000/medicos?limit=50";

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const items = (json?.data?.medicos || []).map((m: any, idx: number) => ({
                    id: m.id,
                    name: m.nombre_completo || `${m.nombres || ""} ${m.apellidos || ""}`.trim(),
                    specialty: m.especialidad || "",
                    rating: m.calificacion_promedio ?? 0,
                    reviews: m.reseñas || 0,
                    image: m.imagen || fallbackImages[idx % fallbackImages.length],
                    raw: m,
                }));

                if (mounted) setDoctors(items.length ? items : fallbackDoctors);
            } catch (err: any) {
                if (mounted) {
                    setError(err?.message || "Error al cargar médicos");
                    setDoctors(fallbackDoctors);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, []);

    return (
        <ProtectedRoute allowedRoles={["paciente"]}>
            <DashboardLayout>
                <main className="flex-1 p-8 overflow-y-auto bg-white text-gray-900">
                    <div className="max-w-4xl mx-auto">
                        {/* Page Heading */}
                        <header className="mb-6">
                            <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-900">
                                Directorio de Médicos
                            </h1>
                        </header>

                        {/* Search & Filters */}
                        <div className="sticky top-0 z-10 bg-white py-4 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-grow">
                                    <label className="flex flex-col min-w-40 h-12 w-full">
                                        <div className="flex w-full items-stretch rounded-lg h-full">
                                            <div className="flex border border-r-0 border-gray-300 bg-white items-center justify-center pl-4 rounded-l-lg text-gray-500">
                                                <span className="material-symbols-outlined">search</span>
                                            </div>
                                            <input
                                                className="form-input flex w-full flex-1 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-l-0 border-gray-300 bg-white h-full placeholder:text-gray-500 px-4 rounded-l-none pl-2 text-base font-normal"
                                                placeholder="Buscar por nombre o especialidad..."
                                            />
                                        </div>
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    {["Especialidad", "Ubicación", "Aseguradora"].map((f) => (
                                        <button
                                            key={f}
                                            className="flex h-12 items-center gap-x-2 rounded-lg bg-white border border-gray-300 px-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <p className="text-gray-800 text-sm font-medium">{f}</p>
                                            <span className="material-symbols-outlined text-gray-600">expand_more</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Doctors List */}
                        <div className="grid grid-cols-1 gap-6 mt-6">
                            {loading ? (
                                <div className="py-12 text-center text-gray-600">Cargando médicos...</div>
                            ) : error ? (
                                <div className="py-12 text-center text-red-600">{error}</div>
                            ) : (
                                doctors.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex flex-col md:flex-row items-center gap-6 rounded-lg bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                                    >
                                        <div
                                            className="w-24 h-24 bg-center bg-no-repeat aspect-square bg-cover rounded-full shrink-0"
                                            style={{ backgroundImage: `url(${doc.image})` }}
                                        />
                                        <div className="flex flex-col gap-2 flex-grow text-center md:text-left">
                                            <p className="text-xl font-bold text-gray-900">{doc.name}</p>
                                            <p className="text-gray-600 text-base">{doc.specialty}</p>
                                            <div className="flex items-center gap-1.5 justify-center md:justify-start">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`material-symbols-outlined ${
                                                            i < Math.floor(doc.rating) ? "text-[#FFC107]" : "text-gray-300"
                                                        }`}
                                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                                    >
                                                        star
                                                    </span>
                                                ))}
                                                <p className="text-sm font-medium text-gray-700 ml-1">
                                                    {doc.rating} ({doc.reviews || 0} reseñas)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 mt-4 md:mt-0">
                                            <button
                                                onClick={() => router.push(`/perfil/${doc.id}`)}
                                                className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 transition-colors"
                                            >
                                                Ver Perfil
                                            </button>
                                            <button
                                                onClick={() => router.push(`/agendar-cita/${doc.id}`)}
                                                className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                                            >
                                                Agendar Cita
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
