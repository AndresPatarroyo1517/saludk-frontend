'use client';
import Header from '@/components/Header';
import { useCart, useDispatchCart } from '@/lib/cartContext';

export default function CartPage() {
  const { items } = useCart();
  const dispatch = useDispatchCart();
  const total = items.reduce((s: any, i: any) => s + Number(i.price) * i.qty, 0);

  // Función para formatear precios en COP sin decimales
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' COP';
  };

  async function handleCheckout() {
    const res = await fetch('/dashboard/farmacia/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (res.ok) {
      alert('Compra realizada correctamente (mock)');
      dispatch({ type: 'CLEAR' });
    } else {
      alert('Error: ' + data.message);
    }
  }

  return (
    <main className="p-6 bg-slate-50 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">Carrito</h2>
        {items.length === 0 ? (
          <div className="p-6 bg-white rounded shadow-sm text-slate-700">
            Tu carrito está vacío.
            <a href="/dashboard/farmacia" className="text-blue-600 ml-2">Ver productos</a>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((it: any) => (
              <div key={it.id} className="flex items-center gap-4 p-4 bg-white rounded shadow-sm">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt={it.title} className="w-20 h-20 object-cover rounded" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center text-slate-400">No image</div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{it.title}</p>
                  <p className="text-sm text-slate-600">
                    {formatPrice(Number(it.price))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch({ type: 'SET_QTY', payload: { id: it.id, qty: it.qty - 1 } })}
                    className="px-2 py-1 border rounded text-slate-700"
                  >
                    -
                  </button>
                  <div className="px-3 text-slate-800">{it.qty}</div>
                  <button
                    onClick={() => dispatch({ type: 'SET_QTY', payload: { id: it.id, qty: it.qty + 1 } })}
                    className="px-2 py-1 border rounded text-slate-700"
                  >
                    +
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: it.id })}
                    className="px-3 py-1 border rounded text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            <div className="p-4 bg-white rounded shadow-sm flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatPrice(total)}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Pagar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
