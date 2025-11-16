import Link from 'next/link';
import { useCart } from '@/lib/cartContext';
import { ShoppingCart } from 'lucide-react';

export default function Header() {
    const { items } = useCart();
    const count = items?.reduce((s: any, i: any) => s + (i.qty || 0), 0) || 0;

    return (
        <header className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Tienda de Farmacia</h1>
                <p className="text-sm text-slate-500">Encuentra productos para tu bienestar</p>
            </div>
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/farmacia/cart"
                    className="relative inline-flex items-center p-2 rounded-full hover:bg-slate-100"
                    aria-label="Ver carrito"
                >
                    <ShoppingCart className="w-5 h-5 text-slate-700" />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                            {count}
                        </span>
                    )}
                </Link>

            </div>
        </header>
    );
}