'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ProductsContext = createContext<any>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // 👇 Ajusta esta URL según tu backend o API Route real
        const res = await fetch('https://saludk-backend.vercel.app/productos');
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Mapeamos los campos al formato esperado por tu ProductCard
          const mapped = data.data.map((item: any) => ({
            id: item.id,
            title: item.nombre,
            subtitle: item.descripcion,
            price: item.precio,
            image: item.imagen_url,
          }));
          setProducts(mapped);
        } else {
          console.error('Error al cargar productos:', data);
        }
      } catch (err) {
        console.error('Error en fetchProducts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
