import api from './client';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  Product,
  ProductListResponse,
  Cart,
  Order,
  OrderListResponse,
  DeliveryAddress,
} from '../types';

// Auth API
export const authAPI = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', data),
  
  register: (data: RegisterRequest) =>
    api.post<User>('/api/auth/register', data),
  
  getCurrentUser: () =>
    api.get<User>('/api/auth/me'),
};

// Products API
export const productsAPI = {
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category_id?: string;
    brand?: string;
    series?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
  }) => api.get<ProductListResponse>('/api/products', { params }),
  
  getProduct: (id: string) =>
    api.get<Product>(`/api/products/${id}`),
  
  getBrands: () =>
    api.get<string[]>('/api/products/filters/brands'),
  
  getSeries: (brand?: string) =>
    api.get<string[]>('/api/products/filters/series', { params: { brand } }),
  
  getCategories: () =>
    api.get('/api/products/categories/all'),
};

// Cart API
export const cartAPI = {
  getCart: () =>
    api.get<Cart>('/api/cart'),
  
  addToCart: (product_id: string, quantity: number) =>
    api.post('/api/cart/items', { product_id, quantity }),
  
  updateCartItem: (cart_item_id: string, quantity: number) =>
    api.put(`/api/cart/items/${cart_item_id}`, { quantity }),
  
  removeFromCart: (cart_item_id: string) =>
    api.delete(`/api/cart/items/${cart_item_id}`),
  
  clearCart: () =>
    api.delete('/api/cart'),
};

// Orders API
export const ordersAPI = {
  getShippingSettings: () =>
    api.get<{ flat_fee: number; free_shipping_threshold: number }>('/api/orders/shipping'),
  createGuestOrder: (data: {
    delivery_address: DeliveryAddress;
    items: { product_id: string; quantity: number }[];
  }) => api.post<Order>('/api/orders/guest', data),
  createOrder: (delivery_address: DeliveryAddress) =>
    api.post<Order>('/api/orders', { delivery_address }),
  
  getOrders: (params?: { page?: number; limit?: number }) =>
    api.get<OrderListResponse>('/api/orders', { params }),
  
  getOrder: (id: string) =>
    api.get<Order>(`/api/orders/${id}`),
};

// Admin API
export const adminAPI = {
  getShippingSettings: () =>
    api.get<{ flat_fee: number; free_shipping_threshold: number }>('/api/admin/shipping'),
  updateShippingSettings: (data: { flat_fee: number; free_shipping_threshold: number }) =>
    api.put('/api/admin/shipping', data),
  createProduct: (formData: FormData) =>
    api.post<Product>('/api/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  updateProduct: (id: string, data: FormData | Record<string, any>) => {
    const isFormData = data instanceof FormData;
    return api.put<Product>(`/api/admin/products/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' },
    });
  },
  
  deleteProduct: (id: string) =>
    api.delete(`/api/admin/products/${id}`),
  
  getAllOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<OrderListResponse>('/api/admin/orders', { params }),
  
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/api/admin/orders/${id}/status`, null, { params: { new_status: status } }),
};
