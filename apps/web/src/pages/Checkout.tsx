import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { createTransaction, getClientKey } from '../services/api';
import api from '../services/api';

declare global {
  interface Window {
    snap: any;
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone: '',
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    const loadMidtransScript = async () => {
      try {
        const response = await getClientKey();
        const clientKey = response.data.data.clientKey;
        
        // Remove existing script if any
        const existingScript = document.querySelector('script[src*="snap.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        // Create new script with client key
        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          console.log('Midtrans Snap loaded successfully');
        };

        script.onerror = () => {
          console.error('Failed to load Midtrans Snap');
        };
      } catch (error) {
        console.error('Failed to fetch client key:', error);
      }
    };

    loadMidtransScript();
  }, [items, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerDetails({
      ...customerDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to continue');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const transactionItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const response = await createTransaction(transactionItems, customerDetails);
      const snapToken = response.data.data.token;

      if (!window.snap) {
        alert('Payment system is loading. Please try again in a moment.');
        setLoading(false);
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          clearCart();
          navigate('/payment/success');
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          navigate('/payment/pending');
        },
        onError: function(result: any) {
          console.log('Payment error:', result);
          navigate('/payment/failed');
        },
        onClose: function() {
          console.log('Payment popup closed');
          setLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to process checkout. Please try again.';
      alert(errorMessage);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={customerDetails.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={customerDetails.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={customerDetails.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={customerDetails.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </p>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
