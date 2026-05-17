import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RiderDashboard from './pages/RiderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrderSuccess from './pages/OrderSuccess';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/restaurant/:id" element={<RestaurantDetail />} />
      <Route path="/cart" element={
        <ProtectedRoute roles={['CUSTOMER']}><Cart /></ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute roles={['CUSTOMER']}><Orders /></ProtectedRoute>
      } />
      <Route path="/restaurant-dashboard" element={
        <ProtectedRoute roles={['RESTAURANT']}><RestaurantDashboard /></ProtectedRoute>
      } />
      <Route path="/rider-dashboard" element={
        <ProtectedRoute roles={['RIDER']}><RiderDashboard /></ProtectedRoute>
      } />
      <Route path="/admin-dashboard" element={
        <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/order-success/:id" element={
  <ProtectedRoute roles={['CUSTOMER']}>
    <OrderSuccess />
  </ProtectedRoute>
} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}