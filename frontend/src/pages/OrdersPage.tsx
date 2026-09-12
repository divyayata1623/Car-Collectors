import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import { LoadingSpinner } from '../components';
import type { Order } from '../types';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      CONFIRMED: 'bg-blue-500',
      PACKED: 'bg-purple-500',
      OUT_FOR_DELIVERY: 'bg-orange-500',
      DELIVERED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">You haven't placed any orders yet</p>
            <Link
              to="/products"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-navy-800 border border-blue-600/20 rounded-xl p-6"
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <span
                      className={`${getStatusColor(
                        order.status
                      )} text-white px-3 py-1 rounded-full text-sm font-semibold`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                    <p className="text-white font-bold">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="text-gray-400">
                        {item.quantity}x {item.product.name}
                      </div>
                      <div className="text-gray-500">
                        ₹{item.subtotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Address */}
                <div className="border-t border-blue-600/20 pt-4 text-sm">
                  <p className="text-gray-400 mb-2">Delivery Address:</p>
                  <p className="text-white">
                    {order.delivery_address.full_name}
                  </p>
                  <p className="text-gray-300">
                    {order.delivery_address.address_line}, {order.delivery_address.city}
                  </p>
                  <p className="text-gray-300">
                    {order.delivery_address.state} - {order.delivery_address.pincode}
                  </p>
                  <p className="text-gray-300">
                    Mobile: {order.delivery_address.mobile}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
