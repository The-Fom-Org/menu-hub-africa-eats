import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from '@/components/ui/toaster';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EditMenu from './pages/EditMenu';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import ManageSubscription from './pages/ManageSubscription';
import QRCodePage from './pages/QRCodePage';
import Orders from './pages/Orders';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/edit-menu" element={<EditMenu />} />
          <Route path="/menu/:restaurantId" element={<Menu />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/manage-subscription" element={<ManageSubscription />} />
          <Route path="/qr-code" element={<QRCodePage />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
