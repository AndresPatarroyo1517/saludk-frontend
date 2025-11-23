"use client";

import { useEffect, useState } from "react";
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function DirectorPlanesPage() {
  const { toast } = useToast();
  const [planes, setPlanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // form state
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioMensual, setPrecioMensual] = useState("");
  const [duracionMeses, setDuracionMeses] = useState("");
  const [beneficiosText, setBeneficiosText] = useState("");
  const [consultasVirtuales, setConsultasVirtuales] = useState("");
  const [consultasPresenciales, setConsultasPresenciales] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const ctrl = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('http://localhost:3000/planes', { credentials: 'include', signal: ctrl.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const list = data?.data ?? data ?? [];
        if (mounted) setPlanes(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('Error cargando planes:', e);
        if (mounted) setError(e?.message ?? 'Error cargando planes');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; ctrl.abort(); };
  }, []);

  function openCreate() {
    setEditingPlan(null);
    setNombre(''); setCodigo(''); setDescripcion(''); setPrecioMensual(''); setDuracionMeses(''); setBeneficiosText(''); setConsultasVirtuales(''); setConsultasPresenciales('');
    setModalOpen(true);
  }

  function openEdit(plan: any) {
    setEditingPlan(plan);
    setNombre(plan.nombre ?? '');
    setCodigo(plan.codigo ?? '');
    setDescripcion(plan.descripcion ?? '');
    setPrecioMensual(String(plan.precio_mensual ?? ''));
    setDuracionMeses(String(plan.duracion_meses ?? ''));
    setBeneficiosText((plan.beneficios ?? []).join('\n'));
    setConsultasVirtuales(String(plan.consultas_virtuales_incluidas ?? ''));
    setConsultasPresenciales(String(plan.consultas_presenciales_incluidas ?? ''));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPlan(null);
  }

  async function submitForm() {
    const beneficios = beneficiosText.split('\n').map(s => s.trim()).filter(Boolean);

    if (!nombre || !codigo) {
      toast({ title: 'Campos faltantes', description: 'Nombre y código son obligatorios', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre,
        codigo,
        descripcion,
        precio_mensual: precioMensual,
        duracion_meses: duracionMeses,
        beneficios,
        consultas_virtuales_incluidas: consultasVirtuales,
        consultas_presenciales_incluidas: consultasPresenciales,
      } as any;

      if (editingPlan) {
        // PUT /planes/{id}
        const resp = await fetch(`http://localhost:3000/planes/${editingPlan.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt || `HTTP ${resp.status}`);
        }

        const updated = await resp.json().catch(() => null);
        const planResp = updated?.data ?? updated ?? null;
        // update local list
        setPlanes(prev => prev.map(p => p.id === editingPlan.id ? (planResp ?? { ...p, ...payload }) : p));
        toast({ title: 'Actualizado', description: 'Plan actualizado correctamente.', className: 'bg-emerald-50 border-emerald-200 text-emerald-900' });
      } else {
        // POST /planes
        const resp = await fetch('http://localhost:3000/planes', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt || `HTTP ${resp.status}`);
        }

        const created = await resp.json().catch(() => null);
        const planResp = created?.data ?? created ?? null;
        const newPlan = planResp ?? { id: crypto?.randomUUID?.() ?? String(Date.now()), ...payload };
        setPlanes(prev => [newPlan, ...prev]);
        toast({ title: 'Creado', description: 'Plan creado correctamente.', className: 'bg-emerald-50 border-emerald-200 text-emerald-900' });
      }

      closeModal();
    } catch (e: any) {
      console.error('Error guardando plan:', e);
      toast({ title: 'Error', description: e?.message || 'No se pudo guardar el plan', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
      
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Planes (Director)</h1>
              <p className="text-slate-600 mt-1">Ver y administrar los planes disponibles en el sistema</p>
            </div>
            <div>
              <Button onClick={openCreate}>Crear Plan</Button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            {loading && <div>Cargando planes...</div>}
            {error && <div className="text-rose-600">{error}</div>}

            {!loading && planes.length === 0 && (
              <div className="text-center text-slate-600 py-8">No hay planes disponibles.</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planes.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                    <CardDescription className="text-sm">{plan.codigo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-700 mb-2">{plan.descripcion}</div>
                    <div className="text-sm text-slate-600">Precio mensual: ${Number(plan.precio_mensual ?? 0).toLocaleString('es-CO')}</div>
                    <div className="text-sm text-slate-600">Duración: {plan.duracion_meses} meses</div>
                    <div className="text-sm text-slate-600 mt-2">Consultas virtuales: {plan.consultas_virtuales_incluidas}</div>
                    <div className="text-sm text-slate-600">Consultas presenciales: {plan.consultas_presenciales_incluidas}</div>
                    <div className="mt-3">
                      <div className="text-sm font-semibold">Beneficios</div>
                      <ul className="list-disc list-inside text-sm text-slate-700 mt-1">
                        {(plan.beneficios ?? []).map((b: string, i: number) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button onClick={() => openEdit(plan)}>Editar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Modal crear/editar */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Editar Plan' : 'Crear Plan'}</DialogTitle>
                <DialogDescription>{editingPlan ? 'Modifica los datos del plan.' : 'Rellena los datos para crear un nuevo plan.'}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input value={nombre} onChange={(e:any) => setNombre(e.target.value)} placeholder="Nombre" />
                  <Input value={codigo} onChange={(e:any) => setCodigo(e.target.value)} placeholder="Código" />
                </div>

                <Textarea value={descripcion} onChange={(e:any) => setDescripcion(e.target.value)} placeholder="Descripción" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input value={precioMensual} onChange={(e:any) => setPrecioMensual(e.target.value)} placeholder="Precio mensual" />
                  <Input value={duracionMeses} onChange={(e:any) => setDuracionMeses(e.target.value)} placeholder="Duración (meses)" />
                  <Input value={consultasVirtuales} onChange={(e:any) => setConsultasVirtuales(e.target.value)} placeholder="Consultas virtuales incluidas" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input value={consultasPresenciales} onChange={(e:any) => setConsultasPresenciales(e.target.value)} placeholder="Consultas presenciales incluidas" />
                </div>

                <div>
                  <div className="text-sm text-slate-600 mb-1">Beneficios (uno por línea)</div>
                  <Textarea value={beneficiosText} onChange={(e:any) => setBeneficiosText(e.target.value)} placeholder={"Beneficio 1\nBeneficio 2"} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={submitForm}>{editingPlan ? 'Guardar cambios' : 'Crear plan'}</Button>
                <DialogClose asChild>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
     
  );
}
