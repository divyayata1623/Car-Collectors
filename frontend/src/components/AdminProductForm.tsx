import React, { useState, useEffect } from 'react';
import { productsAPI, adminAPI } from '../api';
import type { Product, Category } from '../types';

interface AdminProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({ product, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    series: product?.series || '',
    brand: product?.brand || '',
    model: product?.model || '',
    category_id: product?.category?.id || '',
    price: product?.price || '',
    stock_quantity: product?.stock_quantity || '',
    scale: product?.scale || '',
    material: product?.material || '',
    description: product?.description || '',
    is_active: product?.is_active ?? true,
  });

  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string>(product?.front_package_image_url || '');
  const [backImagePreview, setBackImagePreview] = useState<string>(product?.back_package_image_url || '');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'front') {
        setFrontImage(file);
        setFrontImagePreview(URL.createObjectURL(file));
      } else {
        setBackImage(file);
        setBackImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const removeImage = (type: 'front' | 'back') => {
    if (type === 'front') {
      setFrontImage(null);
      setFrontImagePreview('');
    } else {
      setBackImage(null);
      setBackImagePreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (product) {
        // Update existing product
        await adminAPI.updateProduct(product.id, formData);
      } else {
        // Create new product
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataToSend.append(key, value.toString());
        });
        
        if (frontImage) formDataToSend.append('front_image', frontImage);
        if (backImage) formDataToSend.append('back_image', backImage);

        await adminAPI.createProduct(formDataToSend);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D121A] rounded-2xl border border-[#242D38] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0D121A] border-b border-[#242D38] px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#F5F7FA]">
              {product ? 'EDIT PRODUCT' : 'ADD NEW CAR'}
            </h2>
            <p className="text-[#94A3B8] mt-1">
              {product ? 'Update product information and inventory' : 'Add a new die-cast car to your collection'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#F5F7FA] transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400">
              {error}
            </div>
          )}

          {/* Product Information Section */}
          <div>
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">
              PRODUCT INFORMATION
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="e.g., 2023 Corvette Z06"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Series/Collection
                </label>
                <input
                  type="text"
                  name="series"
                  value={formData.series}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="e.g., Hot Wheels Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="e.g., Hot Wheels, Matchbox"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="e.g., Corvette C8"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Category *
                </label>
                <select
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  required
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Scale
                </label>
                <input
                  type="text"
                  name="scale"
                  value={formData.scale}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="e.g., 1:64"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all"
                  placeholder="e.g., Die-cast Metal"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 bg-[#121923] border-[#242D38] rounded text-[#FF5A00] focus:ring-2 focus:ring-[#FF5A00] focus:ring-offset-0"
                  />
                  <span className="text-sm font-semibold text-[#94A3B8]">Active Product</span>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full bg-[#121923] border border-[#242D38] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-transparent transition-all resize-none"
                placeholder="Detailed product description..."
              />
            </div>
          </div>

          {/* Product Images Section */}
          {!product && (
            <div>
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">
                PRODUCT IMAGES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Image */}
                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                    FRONT IMAGE *
                  </label>
                  <p className="text-xs text-[#64748B] mb-3">
                    Upload photograph showing car + card/package front
                  </p>
                  {frontImagePreview ? (
                    <div className="relative">
                      <img
                        src={frontImagePreview}
                        alt="Front preview"
                        className="w-full h-48 object-cover rounded-lg border border-[#242D38]"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('front')}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-[#242D38] rounded-lg p-8 text-center hover:border-[#FF5A00] transition-all">
                        <svg className="w-12 h-12 text-[#64748B] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-[#94A3B8] text-sm mb-1">Click to upload or drag and drop</p>
                        <p className="text-[#64748B] text-xs">PNG, JPG up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        required={!product}
                        onChange={(e) => handleImageChange(e, 'front')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Back Image */}
                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                    BACK IMAGE
                  </label>
                  <p className="text-xs text-[#64748B] mb-3">
                    Upload photograph showing car + card/package back
                  </p>
                  {backImagePreview ? (
                    <div className="relative">
                      <img
                        src={backImagePreview}
                        alt="Back preview"
                        className="w-full h-48 object-cover rounded-lg border border-[#242D38]"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('back')}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-[#242D38] rounded-lg p-8 text-center hover:border-[#FF5A00] transition-all">
                        <svg className="w-12 h-12 text-[#64748B] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-[#94A3B8] text-sm mb-1">Click to upload or drag and drop</p>
                        <p className="text-[#64748B] text-xs">PNG, JPG up to 10MB (Optional)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'back')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-[#242D38]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-[#121923] hover:bg-[#161E29] text-[#F5F7FA] rounded-lg font-semibold transition-all border border-[#242D38]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-[#FF5A00] to-[#E94D00] hover:from-[#E94D00] hover:to-[#D44400] text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
