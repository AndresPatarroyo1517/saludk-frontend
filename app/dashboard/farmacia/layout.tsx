import "../../globals.css";
import { CartProvider } from '@/lib/cartContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ProductsProvider } from '@/lib/productsContext';

export const metadata = {
    title: 'Dashboard OROCRUZ',
    description: 'Gestión de farmacia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['paciente']}>
            <DashboardLayout>
                <CartProvider>
                    <ProductsProvider>
                        {children}
                    </ProductsProvider>
                </CartProvider>
            </DashboardLayout>
        </ProtectedRoute >
    );
}
