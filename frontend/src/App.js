import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import RestaurantMenu from './pages/RestaurantMenu';
import Cart from './pages/Cart';
import CheckoutPage from './pages/CheckoutPage';
import PaymentProcessingPage from './pages/PaymentProcessingPage';
import UPIPaymentPage from './pages/UPIPaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import OrderTracking from './pages/OrderTracking';
import Reviews from './pages/Reviews';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantOrders from './pages/RestaurantOrders';
import RestaurantReviews from './pages/RestaurantReviews';
import AddFoodItem from './pages/AddFoodItem';
import MenuManagement from './pages/MenuManagement';
import TrackOrder from './pages/TrackOrder';
import DeliveryDashboard from './pages/DeliveryDashboard';

// Components
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/restaurant/:id" element={<RestaurantMenu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/checkout" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <CheckoutPage />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/payment-processing/:orderId" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <PaymentProcessingPage />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/upi-payment/:orderId" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <UPIPaymentPage />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/payment-success/:orderId" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <PaymentSuccess />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/payment-failed/:orderId" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <PaymentFailed />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <OrderTracking />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/orders/:orderId" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <TrackOrder />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/reviews" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <Reviews />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/order-tracking/:orderId" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <OrderTracking />
                    </RoleBasedRoute>
                  } 
                />
                <Route 
                  path="/track-order/:orderId" 
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <TrackOrder />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Restaurant Dashboard */}
                <Route 
                  path="/restaurant/dashboard" 
                  element={
                    <RoleBasedRoute allowedRoles={['restaurant', 'admin']}>
                      <RestaurantDashboard />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Restaurant Orders */}
                <Route 
                  path="/restaurant/orders" 
                  element={
                    <RoleBasedRoute allowedRoles={['restaurant', 'admin']}>
                      <RestaurantOrders />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Add Food Item */}
                <Route 
                  path="/restaurant/add-item" 
                  element={
                    <RoleBasedRoute allowedRoles={['restaurant', 'admin']}>
                      <AddFoodItem />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Menu Management */}
                <Route 
                  path="/restaurant/menu" 
                  element={
                    <RoleBasedRoute allowedRoles={['restaurant', 'admin']}>
                      <MenuManagement />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Restaurant Reviews */}
                <Route 
                  path="/restaurant/reviews" 
                  element={
                    <RoleBasedRoute allowedRoles={['restaurant', 'admin']}>
                      <RestaurantReviews />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Delivery Dashboard */}
                <Route 
                  path="/delivery/dashboard" 
                  element={
                    <RoleBasedRoute allowedRoles={['delivery', 'admin']}>
                      <DeliveryDashboard />
                    </RoleBasedRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
