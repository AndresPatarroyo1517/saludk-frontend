'use client';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/lib/productsContext';

export default function FarmaciaPage() {
  const { products, loading } = useProducts();

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex gap-4">
            <input placeholder="Buscar por nombre, marca o síntoma" className="flex-1 p-3 rounded border" />
            <button className="px-4 py-2 rounded border">Ordenar: Relevancia</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Cargando productos...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p :any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
