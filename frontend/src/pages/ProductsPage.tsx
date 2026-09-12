import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api';
import { ProductCard, LoadingSpinner } from '../components';
import type { Product } from '../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, selectedBrand, search]);

  const loadBrands = async () => {
    try {
      const response = await productsAPI.getBrands();
      setBrands(response.data);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productsAPI.getProducts({
        page,
        limit: 12,
        brand: selectedBrand || undefined,
        search: search || undefined,
      });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.total_pages);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-navy-900 to-black py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-6">
            Our Collection
          </h1>
          
          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for cars, brands, series..."
                  className="w-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 focus:border-blue-500 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 focus:border-blue-500 rounded-xl px-6 py-4 text-white focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          {!isLoading && products.length > 0 && (
            <div className="mt-6 text-gray-400">
              Showing <span className="text-white font-semibold">{products.length}</span> products
            </div>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🏎️</div>
            <p className="text-gray-400 text-xl">No products found</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedBrand('');
                setPage(1);
              }}
              className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-16">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-500 transition-all"
                >
                  Previous
                </button>
                
                <div className="flex gap-2">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-12 h-12 rounded-xl font-semibold transition-all ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                            : 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-400 border border-gray-700/50 hover:border-blue-500 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-500 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
