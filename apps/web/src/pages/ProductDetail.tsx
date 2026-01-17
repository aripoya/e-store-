import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct } from '../services/api';
import { useCartStore } from '../store/cartStore';

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  preview_image: string;
  detail_image?: string;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  
  const { addItem, items } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProduct(slug!);
        setProduct(response.data.data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const isInCart = product ? items.some(item => item.id === product.id) : false;

  const handleAddToCart = () => {
    if (product && !isInCart) {
      addItem({
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        preview_image: product.preview_image,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Produk tidak ditemukan</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          ← Kembali ke Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <Link to="/products" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Kembali ke Produk
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div className="md:w-1/2">
              <img 
                src={product.detail_image || product.preview_image || '/placeholder.png'} 
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            </div>
            
            {/* Info */}
            <div className="md:w-1/2 p-8">
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              <p className="text-gray-600 mb-6">{product.description}</p>
              
              <div className="text-3xl font-bold text-blue-600 mb-6">
                Rp {product.price.toLocaleString('id-ID')}
              </div>
              
              {isInCart ? (
                <Link
                  to="/cart"
                  className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition text-center"
                >
                  ✓ Lihat Keranjang
                </Link>
              ) : (
                <button 
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  onClick={handleAddToCart}
                >
                  {added ? '✓ Ditambahkan!' : '🛒 Tambah ke Keranjang'}
                </button>
              )}
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Termasuk:</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• File digital (PDF/ZIP)</li>
                  <li>• Akses download selamanya</li>
                  <li>• Update gratis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
