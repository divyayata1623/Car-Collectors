import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, productsAPI } from '../../api';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalSales: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        adminAPI.getAllOrders({ page: 1, limit: 5 }),
        productsAPI.getProducts({ page: 1, limit: 100 }),
      ]);
      const recentOrders = ordersResponse.data.orders || [];
      const products = productsResponse.data.products || [];

      setRecentOrders(recentOrders);
      setStats({
        totalProducts: productsResponse.data.pagination?.total || products.length,
        totalOrders: ordersResponse.data.pagination?.total || 0,
        totalSales: recentOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0),
        lowStock: products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= 10).length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, link }: any) => (
    <Link 
      to={link} 
      className="bg-[#121923] rounded-xl p-6 border border-[#242D38] hover:border-[#FF5A00]/50 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#64748B] text-xs uppercase tracking-wider font-semibold mb-3">
            {title}
          </p>
          <p className="text-3xl font-bold text-[#F5F7FA]">
            {value}
          </p>
        </div>
        <div className="text-gray-600 group-hover:text-[#FF5A00] transition-colors duration-200">
          {icon}
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5A00] mb-4"></div>
          <div className="text-[#F5F7FA] text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F5F7FA] mb-2 tracking-tight">Dashboard</h1>
        <p className="text-[#94A3B8]">Store overview and performance at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          link="/admin/products" 
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          link="/admin/orders" 
        />
        <StatCard 
          title="Recent Sales" 
          value={'₹' + stats.totalSales.toLocaleString('en-IN')} 
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          link="/admin/orders" 
        />
        <StatCard 
          title="Low Stock Alert" 
          value={stats.lowStock} 
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          link="/admin/inventory" 
        />
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#0D121A] rounded-xl border border-[#242D38] overflow-hidden">
        <div className="p-6 border-b border-[#242D38]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#F5F7FA]">Recent Orders</h2>
            <Link 
              to="/admin/orders" 
              className="text-[#FF5A00] hover:text-[#E94D00] font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <span>View All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-6">
              <svg className="w-20 h-20 text-[#242D38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#F5F7FA] mb-2">No Orders Yet</h3>
            <p className="text-[#94A3B8] max-w-sm mx-auto">
              Orders from customers will appear here. Your first order is just around the corner.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#121923]">
                <tr>
                  <th className="text-left px-6 py-4 text-[#64748B] font-semibold text-xs uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="text-left px-6 py-4 text-[#64748B] font-semibold text-xs uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-4 text-[#64748B] font-semibold text-xs uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-4 text-[#64748B] font-semibold text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-[#64748B] font-semibold text-xs uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-t border-[#242D38] hover:bg-[#121923]/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-[#F5F7FA] font-mono text-sm font-medium">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8]">
                      {order.delivery_address?.full_name || order.user?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-[#F5F7FA] font-semibold">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={
                          'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ' + 
                          (order.status === 'DELIVERED' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : order.status === 'CANCELLED' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/20')
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#64748B] text-sm">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
