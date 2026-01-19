import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import HomeLanding from './pages/HomeLanding';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyPurchases from './pages/MyPurchases';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentPending from './pages/PaymentPending';
import PaymentFailed from './pages/PaymentFailed';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomeLanding />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="my-purchases" element={<MyPurchases />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/products" element={<AdminProducts />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="payment/pending" element={<PaymentPending />} />
            <Route path="payment/failed" element={<PaymentFailed />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;