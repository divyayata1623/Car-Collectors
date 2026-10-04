// API Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  mobile?: string;
  role: 'ADMIN' | 'CUSTOMER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  series?: string;
  model?: string;
  category?: Category | null;
  description?: string;
  price: number;
  stock_quantity: number;
  scale?: string;
  color?: string;
  year?: number;
  condition?: string;
  material?: string;
  front_package_image_url: string;
  back_package_image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface DeliveryAddress {
  full_name: string;
  mobile: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  items: OrderItem[];
  delivery_address: DeliveryAddress & { id: string; created_at: string };
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    brand: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  mobile?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: PaginationMeta;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: PaginationMeta;
}
