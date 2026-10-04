import React, { useState, useEffect } from 'react';
import { productsAPI, adminAPI } from '../../api';
import { resolveImageUrl } from '../../api/client';
import type { Product } from '../../types';

type FilterTab = 'all' | 'low' | 'out';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState('');
  const [isSavingStock, setIsSavingStock] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [activeTab, products]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Load all products (we'll paginate in a real app)
      const response = await productsAPI.getProducts({ limit: 100 });
      const normalizedProducts = response.data.products.map((product) => ({
        ...product,
        price: Number(product.price),
        stock_quantity: Number(product.stock_quantity),
      }));
      setProducts(normalizedProducts);
      setFilteredProducts(normalizedProducts);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    switch (activeTab) {
      case 'low':
        filtered = filtered.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10);
        break;
      case 'out':
        filtered = filtered.filter(p => p.stock_quantity === 0);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-400' };
    } else if (quantity <= 5) {
      return { label: 'Critical', color: 'bg-red-500/20 text-red-400' };
    } else if (quantity <= 10) {
      return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-400' };
    } else {
      return { label: 'In Stock', color: 'bg-green-500/20 text-green-400' };
    }
  };

  const saveStock = async (product: Product) => {
    const stockQuantity = Number(stockDraft);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError('Stock quantity must be a whole number of 0 or more.');
      return;
    }

    setIsSavingStock(true);
    setError('');
    try {
      await adminAPI.updateProduct(product.id, { stock_quantity: stockQuantity });
      setProducts((current) => current.map((item) =>
        item.id === product.id ? { ...item, stock_quantity: stockQuantity } : item
      ));
      setEditingStockId(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update stock.');
    } finally {
      setIsSavingStock(false);
    }
  };

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock_quantity, 0),
    lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading inventory...</div>
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F5F7FA] mb-2 tracking-tight">Inventory</h1>
        <p className="text-[#94A3B8]">Monitor stock levels and collection value.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Products */}
        <div className="bg-[#121923] rounded-xl p-6 border border-[#2E5BB4]/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8390A5] text-xs uppercase tracking-wider font-semibold mb-2">Total Products</p>
              <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
            </div>
            <svg className="w-10 h-10 text-[#4F86F7]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-[#121923] rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8390A5] text-xs uppercase tracking-wider font-semibold mb-2">Total Stock</p>
              <p className="text-3xl font-bold text-white">{stats.totalStock}</p>
            </div>
            <svg className="w-10 h-10 text-green-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-9" /></svg>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-[#121923] rounded-xl p-6 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8390A5] text-xs uppercase tracking-wider font-semibold mb-2">Low Stock</p>
              <p className="text-3xl font-bold text-white">{stats.lowStock}</p>
            </div>
            <svg className="w-10 h-10 text-yellow-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-[#121923] rounded-xl p-6 border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8390A5] text-xs uppercase tracking-wider font-semibold mb-2">Out of Stock</p>
              <p className="text-3xl font-bold text-white">{stats.outOfStock}</p>
            </div>
            <svg className="w-10 h-10 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.5} /><path strokeLinecap="round" strokeWidth={1.5} d="M8 8l8 8" /></svg>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-[#121923] rounded-xl p-6 border border-[#F26A21]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8390A5] text-xs uppercase tracking-wider font-semibold mb-2">Inventory Value</p>
              <p className="text-3xl font-bold text-white">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
            </div>
            <svg className="w-10 h-10 text-[#F26A21]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m4-14.5c-.6-.9-1.8-1.5-4-1.5-2.5 0-4 1.1-4 2.8 0 4.2 8 2.1 8 6.2 0 1.7-1.5 3-4 3-2.1 0-3.5-.6-4.2-1.7" /></svg>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-2 border border-gray-700/50 inline-flex space-x-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('low')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'low'
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Low Stock ({stats.lowStock})
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'out'
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Out of Stock ({stats.outOfStock})
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No products in this category</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Product</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Brand</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Price</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Stock Quantity</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Stock Value</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Status</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock_quantity);
                  const stockValue = product.price * product.stock_quantity;

                  return (
                    <tr key={product.id} className="border-t border-gray-700/30 hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={resolveImageUrl(product.front_package_image_url)}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <div className="text-white font-semibold">{product.name}</div>
                            <div className="text-gray-400 text-sm">{product.series || 'No series'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{product.brand}</td>
                      <td className="px-6 py-4 text-white font-semibold">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xl font-bold ${
                          product.stock_quantity === 0
                            ? 'text-red-400'
                            : product.stock_quantity <= 5
                            ? 'text-red-400'
                            : product.stock_quantity <= 10
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        ₹{stockValue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {editingStockId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={stockDraft}
                              onChange={(event) => setStockDraft(event.target.value)}
                              className="w-20 bg-[#080D16] border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#4F86F7]"
                            />
                            <button onClick={() => saveStock(product)} disabled={isSavingStock} className="text-green-300 hover:text-green-200 text-sm font-semibold disabled:opacity-50">Save</button>
                            <button onClick={() => setEditingStockId(null)} disabled={isSavingStock} className="text-[#94A3B8] hover:text-white text-sm">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingStockId(product.id); setStockDraft(String(product.stock_quantity)); }}
                            className="text-[#4F86F7] hover:text-blue-300 font-semibold text-sm"
                          >
                            Update Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
