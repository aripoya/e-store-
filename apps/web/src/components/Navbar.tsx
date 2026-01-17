import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-600">
            Jogjabootcamp E-Store
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/products" className="text-gray-600 hover:text-blue-600">
              Produk
            </Link>
            {user && user.role === 'admin' && (
              <Link to="/admin" className="text-gray-600 hover:text-blue-600">
                ⚙️ Admin
              </Link>
            )}
            {user && (
              <Link to="/my-purchases" className="text-gray-600 hover:text-blue-600">
                📦 Pembelian Saya
              </Link>
            )}
            <Link to="/cart" className="text-gray-600 hover:text-blue-600 relative">
              🛒 Keranjang
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Halo, {user.name}</span>
                <button 
                  onClick={logout}
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}