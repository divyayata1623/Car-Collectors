import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      const orders = response.data.orders.map((order) => ({
        ...order,
        total_amount: Number(order.total_amount),
        items: order.items.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
        })),
      }));
      setFilteredOrders(orders);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to load orders. Please sign in again.');
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
        <div className="text-center max-w-md">
          <div className="text-red-300 text-xl font-semibold mb-3">{error}</div>
          <p className="text-[#94A3B8] text-sm mb-5">Your admin session may have expired or does not have administrator permissions.</p>
          <Link to="/admin/login" className="inline-block bg-[#F26A21] hover:bg-[#FF7A31] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors">
            Sign in as admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F5F7FA] mb-2 tracking-tight">Orders</h1>
        <p className="text-[#94A3B8]">Review customer orders and move them through fulfillment.</p>
      </div>

      {/* Status Filter */}
      <div className="bg-[#121923] rounded-xl p-6 border border-[#242D38]">
        <label className="block text-xs font-semibold text-[#8390A5] uppercase tracking-[0.16em] mb-2">
          Filter by Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-64 bg-[#080D16] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#4F86F7]"
        >
          <option value="">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PACKED">Packed</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <div className="mt-4 text-sm text-[#94A3B8]">
          Showing {filteredOrders.length} orders
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#101827] rounded-xl p-12 border border-white/10 text-center text-[#94A3B8]">
            No orders found
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-[#101827] rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Order Header */}
              <div
                className="p-6 cursor-pointer hover:bg-white/[0.03] transition-all"
                onClick={() => toggleOrderExpansion(order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Order Number */}
                    <div>
                      <div className="text-xs text-[#8390A5] uppercase tracking-wider mb-1">Order Number</div>
                      <div className="text-white font-mono font-semibold">{order.order_number}</div>
                    </div>

                    {/* Customer */}
                    <div>
                      <div className="text-xs text-[#8390A5] uppercase tracking-wider mb-1">Customer</div>
                      <div className="text-white">{order.delivery_address.full_name}</div>
                    </div>

                    {/* Total */}
                    <div>
                      <div className="text-xs text-[#8390A5] uppercase tracking-wider mb-1">Total</div>
                      <div className="text-white font-semibold">₹{order.total_amount.toLocaleString('en-IN')}</div>
                    </div>

                    {/* Status */}
                    <div>
                      <div className="text-xs text-[#8390A5] uppercase tracking-wider mb-1">Status</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Date */}
                    <div>
                      <div className="text-xs text-[#8390A5] uppercase tracking-wider mb-1">Date</div>
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
                <div className="border-t border-white/10 p-6 space-y-6 bg-[#0C121D]/70">
                  {/* Status Actions */}
                  {STATUS_TRANSITIONS[order.status].length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-[#8390A5] uppercase tracking-wider mb-3">Update Status</div>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_TRANSITIONS[order.status].map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              nextStatus === 'CANCELLED'
                                ? 'bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-300'
                                : 'bg-[#4F86F7]/15 hover:bg-[#4F86F7]/25 border border-[#4F86F7]/30 text-blue-200'
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
                    <div className="text-xs font-semibold text-[#8390A5] uppercase tracking-wider mb-3">Order Items</div>
                    <div className="bg-[#080D16] border border-white/10 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-white/[0.04]">
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
                            <tr key={item.id} className="border-t border-white/10">
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
                    <div className="text-xs font-semibold text-[#8390A5] uppercase tracking-wider mb-3">Delivery Address</div>
                    <div className="bg-[#080D16] border border-white/10 rounded-lg p-4">
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
