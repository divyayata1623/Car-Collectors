import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Order } from '../types';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-navy-900 to-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl text-center bg-navy-800 border border-blue-600/20 rounded-2xl p-8 sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-400 text-3xl">✓</div>
        <p className="text-orange-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Order confirmed</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Thanks for your order</h1>
        <p className="text-gray-400 mb-8">Your Car Collectors order has been received and will be prepared for delivery.</p>

        {order && (
          <div className="text-left bg-navy-900 border border-blue-600/20 rounded-xl p-5 mb-8 space-y-3">
            <div className="flex justify-between gap-4 text-gray-300">
              <span>Order number</span>
              <strong className="text-white font-mono">{order.order_number}</strong>
            </div>
            <div className="flex justify-between gap-4 text-gray-300">
              <span>Total</span>
              <strong className="text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        )}

        <Link to="/products" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};
