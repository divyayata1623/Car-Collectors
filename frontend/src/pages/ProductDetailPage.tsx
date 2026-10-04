import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../api';
import { resolveImageUrl } from '../api/client';
import { useCartStore } from '../store/cartStore';
import { LoadingSpinner } from '../components';
import type { Product } from '../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackImage, setShowBackImage] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await productsAPI.getProduct(id!);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      addItem({
        id: product!.id,
        product: product!,
        quantity,
        subtotal: product!.price * quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      navigate('/cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!product) return <div className="text-white">Product not found</div>;

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-navy-800 rounded-xl overflow-hidden border border-blue-600/20">
              <img
                src={resolveImageUrl(showBackImage ? product.back_package_image_url : product.front_package_image_url)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowBackImage(false)}
                className={`aspect-square bg-navy-800 rounded-lg overflow-hidden border-2 transition-colors ${
                  !showBackImage ? 'border-blue-500' : 'border-blue-600/20'
                }`}
              >
                <img
                  src={resolveImageUrl(product.front_package_image_url)}
                  alt="Front"
                  className="w-full h-full object-cover"
                />
              </button>
              <button
                onClick={() => setShowBackImage(true)}
                className={`aspect-square bg-navy-800 rounded-lg overflow-hidden border-2 transition-colors ${
                  showBackImage ? 'border-blue-500' : 'border-blue-600/20'
                }`}
              >
                <img
                  src={resolveImageUrl(product.back_package_image_url)}
                  alt="Back"
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Category */}
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <span>{product.brand}</span>
              {product.series && (
                <>
                  <span>•</span>
                  <span>{product.series}</span>
                </>
              )}
              {product.category && (
                <>
                  <span>•</span>
                  <span>{product.category.name}</span>
                </>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl font-bold text-white">{product.name}</h1>

            {/* Price */}
            <div className="text-4xl font-bold text-white">
              ₹{product.price.toLocaleString('en-IN')}
            </div>

            {/* Stock Status */}
            {product.stock_quantity === 0 ? (
              <div className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                OUT OF STOCK
              </div>
            ) : product.stock_quantity <= 5 ? (
              <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
                ONLY {product.stock_quantity} LEFT IN STOCK
              </div>
            ) : (
              <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
                IN STOCK
              </div>
            )}

            {/* Specifications */}
            <div className="bg-navy-800 border border-blue-600/20 rounded-lg p-6 space-y-3">
              <h3 className="text-white font-semibold mb-4">Specifications</h3>
              {product.scale && (
                <div className="flex justify-between text-gray-300">
                  <span>Scale:</span>
                  <span className="font-semibold">{product.scale}</span>
                </div>
              )}
              {product.material && (
                <div className="flex justify-between text-gray-300">
                  <span>Material:</span>
                  <span className="font-semibold">{product.material}</span>
                </div>
              )}
              {product.model && (
                <div className="flex justify-between text-gray-300">
                  <span>Model:</span>
                  <span className="font-semibold">{product.model}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-gray-300">{product.description}</p>
              </div>
            )}

            {/* Add to Cart */}
            {product.stock_quantity > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-gray-300">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-navy-800 border border-blue-600/30 rounded-lg text-white hover:border-blue-500 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-white font-semibold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="w-10 h-10 bg-navy-800 border border-blue-600/30 rounded-lg text-white hover:border-blue-500 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  {isAdding ? 'Adding to Cart...' : 'Add to Cart'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
