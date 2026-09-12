import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI } from '../api';
import { useCartStore } from '../store/cartStore';
import { LoadingSpinner } from '../components';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, setCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setIsUpdating(cartItemId);
    try {
      await cartAPI.updateCartItem(cartItemId, quantity);
      await loadCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    setIsUpdating(cartItemId);
    try {
      await cartAPI.removeFromCart(cartItemId);
      await loadCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-navy-900 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Your Cart</h1>
          <p className="text-gray-400 mb-8">Your cart is empty</p>
          <Link
            to="/products"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-navy-800 border border-blue-600/20 rounded-xl p-6"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link to={`/products/${item.product.id}`}>
                    <img
                      src={item.product.front_package_image_url}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link to={`/products/${item.product.id}`}>
                      <h3 className="text-white font-semibold hover:text-blue-400 transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-400 mt-1">
                      {item.product.brand} {item.product.series && `• ${item.product.series}`}
                    </p>
                    <p className="text-white font-bold mt-2">
                      ₹{item.product.price.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating === item.id || item.quantity <= 1}
                        className="w-8 h-8 bg-navy-900 border border-blue-600/30 rounded text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-white font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={
                          isUpdating === item.id ||
                          item.quantity >= item.product.stock_quantity
                        }
                        className="w-8 h-8 bg-navy-900 border border-blue-600/30 rounded text-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-white font-bold">
                        ₹{item.subtotal.toLocaleString('en-IN')}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={isUpdating === item.id}
                        className="text-red-400 hover:text-red-300 text-sm mt-2 disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-navy-800 border border-blue-600/20 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>₹{cart.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-blue-600/20 pt-3">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span>₹{cart.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block text-center text-blue-400 hover:text-blue-300 mt-4 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
