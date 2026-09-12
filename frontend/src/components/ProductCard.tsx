import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [showBackImage, setShowBackImage] = useState(false);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02]"
    >
      {/* Image Container */}
      <div
        className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900"
        onMouseEnter={() => setShowBackImage(true)}
        onMouseLeave={() => setShowBackImage(false)}
      >
        {/* Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
        
        <img
          src={showBackImage ? product.back_package_image_url : product.front_package_image_url}
          alt={`${product.name} - ${showBackImage ? 'Back' : 'Front'}`}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
        />
        
        {/* Stock Badge */}
        <div className="absolute top-4 right-4 z-20">
          {product.stock_quantity === 0 ? (
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
              OUT OF STOCK
            </div>
          ) : product.stock_quantity <= 5 ? (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
              ONLY {product.stock_quantity} LEFT
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
              IN STOCK
            </div>
          )}
        </div>

        {/* Image Toggle Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          <div className={`w-2 h-2 rounded-full transition-all ${!showBackImage ? 'bg-blue-500 w-6' : 'bg-gray-500'}`}></div>
          <div className={`w-2 h-2 rounded-full transition-all ${showBackImage ? 'bg-blue-500 w-6' : 'bg-gray-500'}`}></div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Brand & Series */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
            {product.brand}
          </span>
          {product.series && (
            <>
              <span className="text-gray-600">•</span>
              <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">
                {product.series}
              </span>
            </>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-white font-bold text-base mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-blue-600 transition-all duration-300">
          {product.name}
        </h3>

        {/* Scale */}
        {product.scale && (
          <div className="text-xs text-gray-500 mb-3">
            Scale: <span className="text-gray-400 font-semibold">{product.scale}</span>
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              ₹{product.price.toLocaleString('en-IN')}
            </div>
          </div>
          
          {product.stock_quantity > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                // Cart functionality will be added
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Premium Border Glow on Hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-transparent to-orange-500/20"></div>
      </div>
    </Link>
  );
};
