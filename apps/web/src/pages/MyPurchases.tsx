import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyPurchases, downloadProduct } from '../services/api';
import api from '../services/api';

interface Product {
  product_id: number;
  title: string;
  slug: string;
  description: string;
  preview_image: string;
  file_url: string;
  paid_price: number;
  download_count: number;
  last_downloaded_at: string | null;
}

interface Order {
  order_id: number;
  midtrans_order_id: string;
  total_price: number;
  status: string;
  order_date: string;
  products: Product[];
}

export default function MyPurchases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchPurchases();
  }, [user, navigate]);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const response = await getMyPurchases();
      setOrders(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch purchases:', error);
      alert(error.response?.data?.error || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (productId: number, title: string) => {
    try {
      setDownloadingId(productId);
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const response = await downloadProduct(productId);
      const downloadUrl = response.data.data.download_url;

      // Open download URL in new tab
      window.open(downloadUrl, '_blank');
      
      // Refresh purchases to update download count
      await fetchPurchases();
      
      alert(`Download started for "${title}"!`);
    } catch (error: any) {
      console.error('Download error:', error);
      alert(error.response?.data?.error || 'Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">✅ Lunas</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">⏳ Menunggu Pembayaran</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">❌ Gagal</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pembelian Saya</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Pembelian</h2>
          <p className="text-gray-600 mb-6">Anda belum melakukan pembelian apapun.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Lihat Produk
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Order ID: {order.midtrans_order_id}</p>
                  <p className="text-sm text-gray-600">Tanggal: {formatDate(order.order_date)}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-lg font-bold mt-2">{formatPrice(order.total_price)}</p>
                </div>
              </div>

              {/* Products */}
              <div className="divide-y">
                {order.products.map((product) => (
                  <div key={product.product_id} className="p-6 flex gap-4">
                    {/* Product Image */}
                    <img
                      src={product.preview_image}
                      alt={product.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                      <p className="text-blue-600 font-semibold">{formatPrice(product.paid_price)}</p>
                      {product.download_count > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Downloaded {product.download_count} time{product.download_count > 1 ? 's' : ''}
                          {product.last_downloaded_at && ` • Last: ${formatDate(product.last_downloaded_at)}`}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center">
                      {order.status === 'paid' ? (
                        <button
                          onClick={() => handleDownload(product.product_id, product.title)}
                          disabled={downloadingId === product.product_id}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {downloadingId === product.product_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              📥 Download
                            </>
                          )}
                        </button>
                      ) : order.status === 'pending' ? (
                        <button
                          onClick={() => navigate('/checkout')}
                          className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition"
                        >
                          Bayar Sekarang
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-600 px-6 py-2 rounded-lg cursor-not-allowed"
                        >
                          Tidak Tersedia
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
