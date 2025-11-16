import Image from 'next/image';
import { useDispatchCart } from '@/lib/cartContext';

export default function ProductCard({ product }: { product: any }) {
  const dispatch = useDispatchCart();

  function addToCart() {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
      },
    });
  }

  // ✅ Función para formatear correctamente los precios en COP
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' COP';
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white border overflow-hidden shadow-sm">
      <div className="relative w-full aspect-square bg-slate-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No image
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="font-medium text-slate-800">{product.title}</p>
        <p className="text-sm text-slate-500 mb-3">{product.subtitle}</p>
        <div className="mt-auto flex justify-between items-center">
          <p className="font-bold text-lg text-slate-900">
            {formatPrice(Number(product.price))}
          </p>
          <button
            onClick={addToCart}
            className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center"
          >
            <span className="sr-only">Agregar al carrito</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4"
              />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
