import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#080B10]">
      {/* Top Header */}
      <div className="bg-[#0B1018] border-b border-[#242D38] sticky top-0 z-50 backdrop-blur-xl">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-[#F5F7FA]">CAR COLLECTORS</span>
                <span className="text-[#64748B] font-normal text-lg ml-3">/ Admin</span>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs text-[#64748B] uppercase tracking-wider mb-0.5">Store Admin</div>
                <div className="text-[#F5F7FA] font-medium">{user?.full_name}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-[#121923] hover:bg-[#FF5A00] text-[#F5F7FA] px-5 py-2.5 rounded-lg transition-all duration-200 border border-[#242D38] hover:border-[#FF5A00] text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-72 bg-[#0B1018] border-r border-[#242D38] min-h-screen">
          <nav className="p-6 space-y-8">
            {/* Overview Section */}
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 px-3">
                Overview
              </div>
              <Link
                to="/admin/dashboard"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 border-l-2 ${
                  isActive('/admin/dashboard')
                    ? 'border-[#FF5A00] bg-[#161E29] text-[#F5F7FA]'
                    : 'border-transparent text-[#94A3B8] hover:bg-[#161E29] hover:text-[#FF5A00] hover:border-[#FF5A00]/50'
                }`}
              >
                <svg className={`w-5 h-5 ${isActive('/admin/dashboard') ? 'text-[#FF5A00]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </Link>
            </div>

            {/* Catalog Section */}
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 px-3">
                Catalog
              </div>
              <div className="space-y-1">
                <Link
                  to="/admin/products"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 border-l-2 ${
                    isActive('/admin/products')
                      ? 'border-[#FF5A00] bg-[#161E29] text-[#F5F7FA]'
                      : 'border-transparent text-[#94A3B8] hover:bg-[#161E29] hover:text-[#FF5A00] hover:border-[#FF5A00]/50'
                  }`}
                >
                  <svg className={`w-5 h-5 ${isActive('/admin/products') ? 'text-[#FF5A00]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="font-medium">Products</span>
                </Link>
                <Link
                  to="/admin/inventory"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 border-l-2 ${
                    isActive('/admin/inventory')
                      ? 'border-[#FF5A00] bg-[#161E29] text-[#F5F7FA]'
                      : 'border-transparent text-[#94A3B8] hover:bg-[#161E29] hover:text-[#FF5A00] hover:border-[#FF5A00]/50'
                  }`}
                >
                  <svg className={`w-5 h-5 ${isActive('/admin/inventory') ? 'text-[#FF5A00]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span className="font-medium">Inventory</span>
                </Link>
              </div>
            </div>

            {/* Orders Section */}
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 px-3">
                Orders
              </div>
              <Link
                to="/admin/orders"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 border-l-2 ${
                  isActive('/admin/orders')
                    ? 'border-[#FF5A00] bg-[#161E29] text-[#F5F7FA]'
                    : 'border-transparent text-[#94A3B8] hover:bg-[#161E29] hover:text-[#FF5A00] hover:border-[#FF5A00]/50'
                }`}
              >
                <svg className={`w-5 h-5 ${isActive('/admin/orders') ? 'text-[#FF5A00]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="font-medium">Orders</span>
              </Link>
            </div>

            {/* Store Section */}
            <div className="pt-4 border-t border-[#242D38]">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 px-3">
                Store
              </div>
              <Link
                to="/"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[#94A3B8] hover:bg-[#161E29] hover:text-[#FF5A00] transition-all duration-200 border-l-2 border-transparent hover:border-[#FF5A00]/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">View Website</span>
              </Link>
            </div>
          </nav>

          {/* Admin Info Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#242D38] bg-[#0B1018]">
            <div className="text-xs text-[#64748B]">
              <div className="mb-1">Store Management System</div>
              <div className="text-[#64748B]">v1.0.0</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
