import React, { useState, useEffect } from 'react';
import { productsAPI, adminAPI } from '../../api';
import { AdminProductForm } from '../../components/AdminProductForm';
import type { Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedBrand, stockFilter, products]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [productsResponse, brandsResponse] = await Promise.all([
        productsAPI.getProducts({ page, limit: 50 }),
        productsAPI.getBrands()
      ]);
      setProducts(productsResponse.data.products);
      setFilteredProducts(productsResponse.data.products);
      setTotalPages(productsResponse.data.pagination.total_pages);
      setBrands(brandsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.brand.toLowerCase().includes(query) ||
        p.series?.toLowerCase().includes(query)
      );
    }

    if (selectedBrand) {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(p => p.stock_quantity === 0);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10);
    } else if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => p.stock_quantity > 10);
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      await adminAPI.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5A00] mb-4"></div>
          <div className="text-[#F5F7FA] text-lg">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#F5F7FA] mb-2 tracking-tight">PRODUCTS</h1>
            <p className="text-[#94A3B8]">Manage your die-cast collection and store inventory.</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-gradient-to-r from-[#FF5A00] to-[#E94D00] hover:from-[#E94D00] hover:to-[#D44400] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>ADD NEW CAR</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#121923] rounded-xl p-6 border border-[#242D38]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                Search Products
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0D121A] border border-[#242D38] rounded-lg pl-10 pr-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-[#0D121A] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full bg-[#0D121A] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
              >
                <option value="all">All Products</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-[#242D38] text-sm text-[#64748B]">
            Showing <span className="text-[#F5F7FA] font-semibold">{filteredProducts.length}</span> of <span className="text-[#F5F7FA] font-semibold">{products.length}</span> products
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#0D121A] rounded-xl border border-[#242D38] p-20 text-center">
            <div className="flex justify-center mb-6">
              <svg className="w-24 h-24 text-[#242D38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#F5F7FA] mb-3">NO PRODUCTS YET</h3>
            <p className="text-[#94A3B8] mb-8 max-w-md mx-auto">
              Your collection is empty. Add your first die-cast car to start building the store.
            </p>
            <button
              onClick={handleAddProduct}
              className="bg-gradient-to-r from-[#FF5A00] to-[#E94D00] hover:from-[#E94D00] hover:to-[#D44400] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>ADD NEW CAR</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 bg-[#121923] hover:bg-[#161E29] text-[#F5F7FA] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-[#242D38] font-medium"
            >
              Previous
            </button>
            <span className="text-[#94A3B8] font-medium">
              Page <span className="text-[#F5F7FA]">{page}</span> of <span className="text-[#F5F7FA]">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 bg-[#121923] hover:bg-[#161E29] text-[#F5F7FA] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-[#242D38] font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <AdminProductForm
          product={editingProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const [showBack, setShowBack] = useState(false);

  const getStockDisplay = () => {
    if (product.stock_quantity === 0) {
      return { text: 'OUT OF STOCK', color: 'text-red-400' };
    } else if (product.stock_quantity <= 10) {
      return { text: `LOW STOCK (${product.stock_quantity})`, color: 'text-[#FF5A00]' };
    } else {
      return { text: `IN STOCK (${product.stock_quantity})`, color: 'text-[#64748B]' };
    }
  };

  const stockDisplay = getStockDisplay();

  return (
    <div className="bg-[#121923] rounded-xl border border-[#242D38] overflow-hidden hover:border-[#FF5A00]/50 transition-all duration-200 group">
      {/* Image Container */}
      <div className="relative aspect-square bg-[#0D121A] overflow-hidden">
        <img
          src={showBack ? product.back_package_image_url : product.front_package_image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            if (showBack) {
              e.currentTarget.src = product.front_package_image_url;
            }
          }}
        />
        
        {/* Image Toggle */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg overflow-hidden flex text-xs">
          <button
            onClick={() => setShowBack(false)}
            className={`px-3 py-1.5 font-medium transition-all ${
              !showBack ? 'bg-[#FF5A00] text-white' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setShowBack(true)}
            className={`px-3 py-1.5 font-medium transition-all ${
              showBack ? 'bg-[#FF5A00] text-white' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Back
          </button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
            product.is_active
              ? 'bg-[#FF5A00]/20 text-[#FF5A00] border border-[#FF5A00]/30'
              : 'bg-[#64748B]/20 text-[#64748B] border border-[#64748B]/30'
          }`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-[#F5F7FA] font-bold text-lg line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-[#64748B] text-sm">
            {product.series || product.brand}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[#F5F7FA] font-bold text-xl">
            ₹{product.price.toLocaleString('en-IN')}
          </div>
          <div className={`text-xs font-bold ${stockDisplay.color}`}>
            {stockDisplay.text}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[#242D38]">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
