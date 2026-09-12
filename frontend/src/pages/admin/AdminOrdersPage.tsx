import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import type { Order } from '../../types';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  PACKED: 'bg-purple-500/20 text-purple-400',
  OUT_FOR_DELIVERY: 'bg-orange-500/20 text-orange-400',
  DELIVERED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const AdminOrdersPage: React.FC = () => {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page, selectedStatus]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 20 };
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await adminAPI.getAllOrders(params);
      setFilteredOrders(response.data.orders);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (!confirm(`Are you sure you want to update this order to ${newStatus}?`)) return;

    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      setFilteredOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update order status');
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading orders...</div>
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
        <h1 className="text-4xl font-bold text-white mb-2">Orders Management</h1>
        <p className="text-gray-400">View and manage customer orders</p>
      </div>

      {/* Status Filter */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Filter by Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-64 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PACKED">Packed</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredOrders.length} orders
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700/50 text-center text-gray-400">
            No orders found
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden"
            >
              {/* Order Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-800/50 transition-all"
                onClick={() => toggleOrderExpansion(order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Order Number */}
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Order Number</div>
                      <div className="text-white font-mono font-semibold">{order.order_number}</div>
                    </div>

                    {/* Customer */}
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Customer</div>
                      <div className="text-white">{order.delivery_address.full_name}</div>
                    </div>

                    {/* Total */}
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Total</div>
                      <div className="text-white font-semibold">₹{order.total_amount.toLocaleString('en-IN')}</div>
                    </div>

                    {/* Status */}
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Status</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Date */}
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Date</div>
                      <div className="text-white">{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="ml-4 text-gray-400">
                    {expandedOrderId === order.id ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrderId === order.id && (
                <div className="border-t border-gray-700/50 p-6 space-y-6">
                  {/* Status Actions */}
                  {STATUS_TRANSITIONS[order.status].length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-400 mb-3">Update Status</div>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_TRANSITIONS[order.status].map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              nextStatus === 'CANCELLED'
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            Mark as {nextStatus.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <div className="text-sm font-semibold text-gray-400 mb-3">Order Items</div>
                    <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-semibold">Product</th>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-semibold">Brand</th>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-semibold">Quantity</th>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-semibold">Unit Price</th>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-semibold">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} className="border-t border-gray-700/30">
                              <td className="px-4 py-3 text-white">{item.product.name}</td>
                              <td className="px-4 py-3 text-gray-300">{item.product.brand}</td>
                              <td className="px-4 py-3 text-white">{item.quantity}</td>
                              <td className="px-4 py-3 text-white">₹{item.unit_price.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-white font-semibold">₹{item.subtotal.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <div className="text-sm font-semibold text-gray-400 mb-3">Delivery Address</div>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="text-white space-y-1">
                        <div className="font-semibold">{order.delivery_address.full_name}</div>
                        <div className="text-gray-300">{order.delivery_address.mobile}</div>
                        <div className="text-gray-300">{order.delivery_address.address_line}</div>
                        <div className="text-gray-300">
                          {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-all"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-white">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
