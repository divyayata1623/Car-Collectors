import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../../api';
import type { Product } from '../../types';

type FilterTab = 'all' | 'low' | 'out';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      const response = await productsAPI.getProducts({ limit: 1000 });
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
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
        <h1 className="text-4xl font-bold text-white mb-2">Inventory Management</h1>
        <p className="text-gray-400">Monitor stock levels and inventory value</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Products */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold mb-2">Total Products</p>
              <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
            </div>
            <div className="text-4xl opacity-50">📦</div>
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold mb-2">Total Stock</p>
              <p className="text-3xl font-bold text-white">{stats.totalStock}</p>
            </div>
            <div className="text-4xl opacity-50">📊</div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold mb-2">Low Stock</p>
              <p className="text-3xl font-bold text-white">{stats.lowStock}</p>
            </div>
            <div className="text-4xl opacity-50">⚠️</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold mb-2">Out of Stock</p>
              <p className="text-3xl font-bold text-white">{stats.outOfStock}</p>
            </div>
            <div className="text-4xl opacity-50">🚫</div>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold mb-2">Inventory Value</p>
              <p className="text-3xl font-bold text-white">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
            </div>
            <div className="text-4xl opacity-50">💰</div>
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
                            src={product.front_package_image_url}
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
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-blue-400 hover:text-blue-300 font-semibold text-sm"
                        >
                          Update Stock →
                        </Link>
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
