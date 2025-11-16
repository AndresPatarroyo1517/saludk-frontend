import { create } from 'zustand';
import { Producto } from '@/lib/api/services';

interface CartItem extends Producto {
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  addItem: (producto: Producto, cantidad?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (producto, cantidad = 1) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.id === producto.id);

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === producto.id
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { ...producto, cantidad }],
      };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  updateQuantity: (id, cantidad) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, cantidad } : item
      ),
    })),

  clearCart: () => set({ items: [] }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.cantidad, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0
    );
  },
}));
