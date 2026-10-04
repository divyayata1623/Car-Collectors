export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  product_count?: number;
  created_at?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  series?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort_by?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';
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
