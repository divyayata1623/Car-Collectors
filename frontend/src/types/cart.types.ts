import { Product } from './product.types';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
  created_at?: string;
  updated_at?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
