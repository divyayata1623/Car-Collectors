export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PACKED' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED';

export interface DeliveryAddress {
  id?: string;
  order_id?: string;
  full_name: string;
  mobile: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    brand: string;
    front_package_image_url: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  items: OrderItem[];
  delivery_address: DeliveryAddress;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  delivery_address: Omit<DeliveryAddress, 'id' | 'order_id' | 'created_at'>;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
