"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function MisComprasPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const BASE_API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL;

  // Rating dialog state
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingProductoId, setRatingProductoId] = useState<string | null>(null);
  const [ratingCompraId, setRatingCompraId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComentario, setRatingComentario] = useState<string>('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingId, setRatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const ctrl = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${BASE_API_URL}/productos/mis-compras?limit=20&offset=0`, { credentials: 'include', signal: ctrl.signal });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt || `HTTP ${resp.status}`);
        }
        const data = await resp.json();
        // Normalize to a predictable shape: compras -> { id, fecha_creacion, total, productos: [ { id, compra_id, producto_id, cantidad, precio_unitario, producto } ] }
        const rawList = data?.data?.compras ?? data?.compras ?? data?.data ?? data ?? [];
        const normalized = (Array.isArray(rawList) ? rawList : []).map((c: any) => ({
          id: c.id ?? c.compra_id ?? null,
          fecha_creacion: c.fecha_creacion ?? c.fecha ?? c.created_at ?? null,
          total: c.total ?? c.subtotal ?? null,
          estado: c.estado ?? null,
          productos: Array.isArray(c.productos) ? c.productos.map((p: any) => ({
            id: p.id ?? null,
            compra_id: p.compra_id ?? c.id ?? null,
            producto_id: p.producto_id ?? p.producto?.id ?? null,
            cantidad: p.cantidad ?? null,
            precio_unitario: p.precio_unitario ?? p.precio ?? null,
            producto: p.producto ?? p.producto_data ?? null,
            // calificado and calificacion_value will be populated when the user rates or when we load ratings
            calificado: p.calificado ?? false,
            calificacion_value: p.calificacion_value ?? null,
            ratingId: p.ratingId ?? null,
          })) : [],
        }));
        // Try to also load existing product ratings and merge them into compras
        let ratings: any[] = [];
        try {
          const r = await fetch(`${BASE_API_URL}/calificaciones/mis-calificaciones?tipo=productos`, { credentials: 'include' });
          if (r.ok) {
            const rd = await r.json();
            ratings = rd?.data?.productos ?? rd?.data?.calificaciones ?? rd?.data ?? [];
            ratings = Array.isArray(ratings) ? ratings : [];
          }
        } catch (e) {
          // ignore ratings load errors; we'll still show compras
        }

        // merge ratings into normalized compras
        const merged = normalized.map((c: any) => ({
          ...c,
          productos: (c.productos || []).map((p: any) => {
            const match = ratings.find((rt: any) => {
              const ridPid = rt.producto_id ?? rt.producto?.id ?? rt.productoId ?? null;
              const ridCid = rt.compra_id ?? rt.compraId ?? rt.compra?.id ?? null;
              return ridPid && ridCid && String(ridPid) === String(p.producto_id) && String(ridCid) === String(c.id);
            });
            if (match) {
              return { ...p, calificado: true, calificacion_value: Number(match.puntuacion ?? match.puntuacion_value ?? match.valor ?? 0), ratingId: match.id ?? null, comentario: match.comentario ?? null };
            }
            return p;
          })
        }));

        // sort so that compras with estado === 'ENTREGADA' appear first
        const sorted = merged.sort((a: any, b: any) => {
          const aEnt = String(a.estado ?? '').toUpperCase() === 'ENTREGADA';
          const bEnt = String(b.estado ?? '').toUpperCase() === 'ENTREGADA';
          if (aEnt === bEnt) return 0;
          return aEnt ? -1 : 1;
        });

        if (mounted) setCompras(sorted);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('Error cargando compras:', e);
        if (mounted) setError(e?.message || 'Error cargando compras');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; ctrl.abort(); };
  }, [user?.id]);

  const loadExistingProductRating = async (productoId: string, compraId: string) => {
    try {
      const resp = await fetch(`${BASE_API_URL}/calificaciones/mis-calificaciones?tipo=productos`, { credentials: 'include' });
      if (!resp.ok) return null;
      const data = await resp.json();
      const list = data?.data?.productos ?? data?.data?.calificaciones ?? data?.data?.compras ?? data?.calificaciones ?? data?.data ?? [];
      const arr = Array.isArray(list) ? list : [];

      const found = arr.find((it: any) => {
        const pid = it.producto_id ?? it.producto?.id ?? it.productoId ?? null;
        const cid = it.compra_id ?? it.compraId ?? it.compra?.id ?? null;
        return (pid && String(pid) === String(productoId)) && (cid && String(cid) === String(compraId));
      });

      return found ?? null;
    } catch (e) {
      return null;
    }
  };

  const openRating = async (productoId: string, compraId: string) => {
    // only allow opening rating for compras that are ENTREGADA
    const compra = compras.find((c) => String(c.id) === String(compraId));
    if (!compra) {
      toast({ title: 'No encontrado', description: 'Compra no encontrada.', variant: 'destructive' });
      return;
    }
    // allow opening modal if compra is ENTREGADA or if we already have a rating for this product (to allow viewing/updating)
    const prodEntryLocal = compra.productos?.find((p: any) => String(p.producto_id ?? p.producto?.id ?? '') === String(productoId));
    const hasLocalRating = Boolean(prodEntryLocal && (prodEntryLocal.ratingId || prodEntryLocal.calificado));
    if (String(compra.estado ?? '').toUpperCase() !== 'ENTREGADA' && !hasLocalRating) {
      toast({ title: 'No permitido', description: 'Solo puedes calificar productos con estado ENTREGADA.', variant: 'destructive' });
      return;
    }
    setRatingProductoId(productoId);
    setRatingCompraId(compraId);
    setRatingValue(5);
    setRatingComentario('');
    setRatingId(null);

    // try to prefill from already-loaded compras/ratings
    try {
      const prodEntry = compra.productos?.find((p: any) => String(p.producto_id ?? p.producto?.id ?? '') === String(productoId));
      if (prodEntry && prodEntry.ratingId) {
        setRatingId(prodEntry.ratingId ?? null);
        setRatingValue(Number(prodEntry.calificacion_value ?? prodEntry.puntuacion ?? 5));
        setRatingComentario(prodEntry.comentario ?? prodEntry.commentario ?? '');
        setRatingOpen(true);
        return;
      }
    } catch (e) {
      // ignore and fallback to fetching existing rating
    }

    const existing = await loadExistingProductRating(productoId, compraId);
    if (existing) {
      setRatingId(existing.id ?? null);
      setRatingValue(Number(existing.puntuacion ?? existing.puntuacion_value ?? 5));
      setRatingComentario(existing.comentario ?? '');
    }

    setRatingOpen(true);
  };

  const submitRating = async () => {
    if (!ratingProductoId || !ratingCompraId) return;
    setRatingSubmitting(true);
    try {
      // Determine usedId for mapping after create/update
      let usedId = ratingId;
      if (ratingId) {
        // Update existing rating
        const resp = await fetch(`${BASE_API_URL}/calificaciones/productos/${ratingId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puntuacion: Number(ratingValue), comentario: ratingComentario || '' }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt || `HTTP ${resp.status}`);
        }
        toast({ title: 'Actualizado', description: 'Calificación actualizada correctamente.', className: 'bg-emerald-50 border-emerald-200 text-emerald-900' });
      } else {
        const payload = {
          productoId: String(ratingProductoId),
          compraId: String(ratingCompraId),
          puntuacion: Number(ratingValue),
          comentario: ratingComentario || ''
        };

        const resp = await fetch(`${BASE_API_URL}/calificaciones/productos`, {
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
        const createdId = created?.data?.id ?? created?.id ?? null;
        if (createdId) {
          setRatingId(createdId);
          usedId = createdId;
        }
        toast({ title: 'Gracias', description: 'Calificación enviada correctamente.', className: 'bg-emerald-50 border-emerald-200 text-emerald-900' });
      }

      // Mark specific producto in the compra as rated locally
      setCompras((prev) => prev.map((c) => {
        if (String(c.id) !== String(ratingCompraId)) return c;
        return {
          ...c,
          productos: (c.productos || []).map((p: any) => {
            const pid = p.producto_id ?? p.producto?.id ?? null;
            if (String(pid) === String(ratingProductoId)) {
              return { ...p, calificado: true, calificacion_value: ratingValue, ratingId: usedId ?? p.ratingId ?? null, comentario: ratingComentario ?? p.comentario ?? null };
            }
            return p;
          })
        };
      }));

      setRatingOpen(false);
    } catch (e: any) {
      console.error('Error enviando calificación producto:', e);
      toast({ title: 'Error', description: e?.message || 'No se pudo enviar la calificación', variant: 'destructive' });
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["paciente"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mis Compras</h1>
              <p className="text-slate-600 mt-1">Lista de compras de productos que has realizado</p>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            {loading && <div>Cargando compras...</div>}
            {error && <div className="text-rose-600">{error}</div>}

            {!loading && compras.length === 0 && (
              <div className="text-center text-slate-600 py-8">No has realizado compras de productos.</div>
            )}

            {/* Split compras into entregadas and others */}
            {(() => {
              const entregadas = compras.filter((c: any) => String(c.estado ?? '').toUpperCase() === 'ENTREGADA');
              const others = compras.filter((c: any) => String(c.estado ?? '').toUpperCase() !== 'ENTREGADA');
              return (
                <div className="space-y-6">
                  {entregadas.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold mb-3">Entregadas</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entregadas.map((comp: any) => {
                          const firstItem = (comp.productos && comp.productos[0]) ?? null;
                          const prod = firstItem?.producto ?? firstItem ?? {};
                          const title = prod?.nombre || prod?.titulo || prod?.name || 'Producto';
                          const img = prod?.imagen_url || prod?.imagen || prod?.image || prod?.images?.[0] || '/placeholder.png';
                          const fecha = comp.fecha_creacion || comp.fecha || comp.created_at || '';
                          const precio = firstItem?.precio_unitario ?? comp.total ?? comp.subtotal ?? null;
                          const compradoId = comp.id ?? comp.compra_id ?? comp.compraId ?? '';

                          const isRated = (firstItem && (firstItem.calificado || firstItem.calificacion_value != null));
                          const ratingVal = firstItem?.calificacion_value ?? null;

                          return (
                            <div key={String(compraIdFrom(comp) || compradoId)} className="border rounded-lg p-3 shadow-sm bg-white">
                              <div className="flex items-start gap-3">
                                <img src={img} alt={title} className="h-20 w-20 object-cover rounded-md" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="font-semibold text-slate-900">{title}</div>
                                    <div className="text-xs text-slate-500">{String(comp.estado ?? '').toUpperCase()}</div>
                                  </div>
                                  {precio != null && <div className="text-sm text-slate-600">Precio: ${precio}</div>}
                                  {fecha && <div className="text-sm text-slate-500">{new Date(fecha).toLocaleString('es-ES')}</div>}
                                          <div className="mt-2 flex items-center gap-2">
                                            {isRated ? (
                                              <button onClick={() => openRating(firstItem?.producto_id ?? firstItem?.producto?.id ?? firstItem?.producto_id, compradoId)} className="text-sm text-green-700">Cambiar calificación {ratingVal ? `— ${ratingVal}★` : ''}</button>
                                            ) : (
                                              <button onClick={() => openRating(firstItem?.producto_id ?? firstItem?.producto?.id ?? firstItem?.producto_id, compradoId)} className="text-sm text-amber-700">Calificar producto</button>
                                            )}
                                          </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {others.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold mb-3">Otras Compras</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {others.map((comp: any) => {
                          const firstItem = (comp.productos && comp.productos[0]) ?? null;
                          const prod = firstItem?.producto ?? firstItem ?? {};
                          const title = prod?.nombre || prod?.titulo || prod?.name || 'Producto';
                          const img = prod?.imagen_url || prod?.imagen || prod?.image || prod?.images?.[0] || '/placeholder.png';
                          const fecha = comp.fecha_creacion || comp.fecha || comp.created_at || '';
                          const precio = firstItem?.precio_unitario ?? comp.total ?? comp.subtotal ?? null;
                          const compradoId = comp.id ?? comp.compra_id ?? comp.compraId ?? '';

                          const isRated = (firstItem && (firstItem.calificado || firstItem.calificacion_value != null));
                          const ratingVal = firstItem?.calificacion_value ?? null;

                          return (
                            <div key={String(compraIdFrom(comp) || compradoId)} className="border rounded-lg p-3 shadow-sm bg-white">
                              <div className="flex items-start gap-3">
                                <img src={img} alt={title} className="h-20 w-20 object-cover rounded-md" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="font-semibold text-slate-900">{title}</div>
                                    <div className="text-xs text-amber-700">{String(comp.estado ?? '').toUpperCase()}</div>
                                  </div>
                                  {precio != null && <div className="text-sm text-slate-600">Precio: ${precio}</div>}
                                  {fecha && <div className="text-sm text-slate-500">{new Date(fecha).toLocaleString('es-ES')}</div>}
                                  <div className="mt-2 flex items-center gap-2">
                                    {isRated ? (
                                      <button onClick={() => openRating(firstItem?.producto_id ?? firstItem?.producto?.id ?? firstItem?.producto_id, compradoId)} className="text-sm text-amber-700">Ver calificación {ratingVal ? `— ${ratingVal}★` : ''}</button>
                                    ) : (
                                      <div className="text-sm text-slate-500">No disponible para calificar</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Dialog para calificar producto */}
          <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Calificar Producto</DialogTitle>
                <DialogDescription>Deja una puntuación y un comentario sobre el producto que compraste.</DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-3">
                <div className="text-xs text-slate-500">Puntuación</div>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} onClick={() => setRatingValue(n)} className={`px-3 py-1 rounded ${ratingValue >= n ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-700'}`}>{n} ★</button>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-slate-500">Comentario (opcional)</div>
                  <textarea value={ratingComentario} onChange={(e) => setRatingComentario(e.target.value)} className="w-full mt-1 p-2 border rounded-md" />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={submitRating} disabled={ratingSubmitting || !ratingProductoId || !ratingCompraId}>{ratingSubmitting ? (ratingId ? 'Actualizando...' : 'Enviando...') : (ratingId ? 'Actualizar Calificación' : 'Enviar Calificación')}</Button>
                <DialogClose asChild>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function compraIdFrom(c: any) {
  return c?.id ?? c?.compra_id ?? c?.compraId ?? null;
}
