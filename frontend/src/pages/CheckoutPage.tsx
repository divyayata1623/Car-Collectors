import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ordersAPI } from '../api';
import { useCartStore } from '../store/cartStore';
import type { DeliveryAddress } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shipping, setShipping] = useState({ flat_fee: 0, free_shipping_threshold: 0 });

  React.useEffect(() => {
    ordersAPI.getShippingSettings().then(({ data }) => setShipping({
      flat_fee: Number(data.flat_fee),
      free_shipping_threshold: Number(data.free_shipping_threshold),
    })).catch(() => undefined);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryAddress>();

  const onSubmit = async (data: DeliveryAddress) => {
    if (!cart) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await ordersAPI.createGuestOrder({
        delivery_address: data,
        items: cart.items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      navigate('/order-success', { state: { order: response.data } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const shippingFee = shipping.free_shipping_threshold > 0 && cart.total >= shipping.free_shipping_threshold
    ? 0
    : shipping.flat_fee;

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-navy-800 border border-blue-600/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Delivery Information</h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register('full_name', { required: 'Full name is required' })}
                    className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="text-red-400 text-sm mt-1">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Mobile Number *
                  </label>
                  <input
                    {...register('mobile', { required: 'Mobile number is required' })}
                    className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="+91 1234567890"
                  />
                  {errors.mobile && (
                    <p className="text-red-400 text-sm mt-1">{errors.mobile.message}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Complete Address *
                  </label>
                  <textarea
                    {...register('address_line', { required: 'Address is required' })}
                    rows={3}
                    className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="House No, Building, Street, Landmark"
                  />
                  {errors.address_line && (
                    <p className="text-red-400 text-sm mt-1">{errors.address_line.message}</p>
                  )}
                </div>

                {/* City & State */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      City *
                    </label>
                    <input
                      {...register('city', { required: 'City is required' })}
                      className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Mumbai"
                    />
                    {errors.city && (
                      <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      State *
                    </label>
                    <input
                      {...register('state', { required: 'State is required' })}
                      className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Maharashtra"
                    />
                    {errors.state && (
                      <p className="text-red-400 text-sm mt-1">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Pincode *
                  </label>
                  <input
                    {...register('pincode', { required: 'Pincode is required' })}
                    className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="400001"
                  />
                  {errors.pincode && (
                    <p className="text-red-400 text-sm mt-1">{errors.pincode.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-navy-800 border border-blue-600/20 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-300 text-sm">
                    <span>
                      {item.quantity}x {item.product.name}
                    </span>
                    <span>₹{item.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-blue-600/20 pt-4 space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>₹{cart.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span>₹{shippingFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>₹{(cart.total + shippingFee).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
