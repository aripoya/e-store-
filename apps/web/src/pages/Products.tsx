import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  preview_image: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Semua Produk</h1>
        
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Belum ada produk tersedia</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((product) => (
              <Link 
                key={product.id} 
                to={`/products/${product.slug}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                <div className="relative w-full" style={{ paddingBottom: '133.33%' }}>
                  <img 
                    src={product.preview_image || '/placeholder.png'} 
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2 flex-1">{product.title}</h3>
                  <p className="text-blue-600 font-bold text-sm md:text-base">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
