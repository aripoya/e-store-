import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export default function Cart() {
  const { items, removeItem, clearCart, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">Keranjang Kosong</h2>
          <p className="text-gray-600 mb-6">Belum ada produk di keranjang kamu</p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Lihat Produk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Keranjang Belanja</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
                <img
                  src={item.preview_image || '/placeholder.png'}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <Link
                    to={`/products/${item.slug}`}
                    className="font-semibold hover:text-blue-600"
                  >
                    {item.title}
                  </Link>
                  <p className="text-blue-600 font-bold mt-1">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 self-start"
                >
                  ✕ Hapus
                </button>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Kosongkan Keranjang
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Ringkasan</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah Produk</span>
                  <span>{items.length} item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                </div>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="text-blue-600">Rp {getTotalPrice().toLocaleString('id-ID')}</span>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}