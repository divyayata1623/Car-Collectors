import { create } from 'zustand';
import type { Cart, CartItem } from '../types';

interface CartState {
  cart: Cart | null;
  setCart: (cart: Cart) => void;
  addItem: (item: CartItem) => void;
  updateItem: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const persistCart = (cart: Cart | null) => {
  if (cart) {
    localStorage.setItem('car-collectors-cart', JSON.stringify(cart));
  } else {
    localStorage.removeItem('car-collectors-cart');
  }
  return cart;
};

const readStoredCart = (): Cart | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedCart = localStorage.getItem('car-collectors-cart');
    if (!storedCart) return null;

    const stored = JSON.parse(storedCart) as Cart;
    const items = stored.items.map((item) => ({
      ...item,
      product: { ...item.product, price: Number(item.product.price) },
      quantity: Number(item.quantity),
      subtotal: Number(item.product.price) * Number(item.quantity),
    }));
    const cart = { items, total: items.reduce((total, item) => total + item.subtotal, 0) };
    return persistCart(cart);
  } catch {
    return null;
  }
};

export const useCartStore = create<CartState>((set) => ({
  cart: readStoredCart(),
  setCart: (cart) => set({ cart: persistCart(cart) }),
  addItem: (item) => set((state) => {
    const itemPrice = Number(item.product.price);
    const itemQuantity = Number(item.quantity);
    const existingItem = state.cart?.items.find((cartItem) => cartItem.product.id === item.product.id);
    const items = existingItem
      ? state.cart!.items.map((cartItem) => cartItem.product.id === item.product.id
        ? { ...cartItem, quantity: Number(cartItem.quantity) + itemQuantity, subtotal: Number(cartItem.subtotal) + itemPrice * itemQuantity }
        : cartItem)
      : [...(state.cart?.items || []), { ...item, product: { ...item.product, price: itemPrice }, quantity: itemQuantity, subtotal: itemPrice * itemQuantity }];
    const cart = { items, total: items.reduce((total, cartItem) => total + cartItem.subtotal, 0) };
    return { cart: persistCart(cart) };
  }),
  updateItem: (itemId, quantity) => set((state) => {
    if (!state.cart) return state;
    const items = state.cart.items.map((item) => item.id === itemId
      ? { ...item, quantity: Number(quantity), subtotal: Number(item.product.price) * Number(quantity) }
      : item);
    const cart = { items, total: items.reduce((total, item) => total + item.subtotal, 0) };
    return { cart: persistCart(cart) };
  }),
  removeItem: (itemId) => set((state) => {
    if (!state.cart) return state;
    const items = state.cart.items.filter((item) => item.id !== itemId);
    const cart = items.length ? { items, total: items.reduce((total, item) => total + item.subtotal, 0) } : null;
    return { cart: persistCart(cart) };
  }),
  clearCart: () => set({ cart: persistCart(null) }),
}));
