'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ProductsContext = createContext<any>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const BASE_API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL;


  useEffect(() => {
    async function fetchProducts() {
      try {
        // 👇 Ajusta esta URL según tu backend o API Route real
        const res = await fetch(`${BASE_API_URL}/productos`);
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
