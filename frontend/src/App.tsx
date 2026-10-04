
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar, AdminRoute, AdminLayout, ProtectedRoute } from './components';
import {
  HomePage,
  ProductsPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  LoginPage,
  OrdersPage,
  RegisterPage,
} from './pages';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminShippingPage } from './pages/admin/AdminShippingPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';

const BrandsPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 via-navy-900 to-black py-20">
    <div className="container mx-auto px-6 text-center">
      <h1 className="text-5xl font-bold text-white mb-4">Brands</h1>
      <p className="text-gray-400 text-lg">Explore our premium brand collections</p>
    </div>
  </div>
);

const AboutPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 via-navy-900 to-black py-20">
    <div className="container mx-auto px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8 text-center">About Car Collectors</h1>
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-10 border border-gray-700/50">
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Welcome to Car Collectors, your premier destination for authentic die-cast model cars.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            We specialize in curating the finest collection of Hot Wheels, Matchbox, and premium collectible cars
            for enthusiasts and collectors worldwide.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Every model in our collection is carefully selected to ensure authenticity and quality,
            bringing you the best die-cast experiences.
          </p>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><Navbar /><HomePage /></>} />
        <Route path="/products" element={<><Navbar /><ProductsPage /></>} />
        <Route path="/products/:id" element={<><Navbar /><ProductDetailPage /></>} />
        <Route path="/brands" element={<><Navbar /><BrandsPage /></>} />
        <Route path="/about" element={<><Navbar /><AboutPage /></>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<><Navbar /><CartPage /></>} />
        <Route path="/checkout" element={<><Navbar /><CheckoutPage /></>} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Navbar />
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminProductsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminOrdersPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminInventoryPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/shipping"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminShippingPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
