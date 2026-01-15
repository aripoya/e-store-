import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, adminUploadFile, adminUploadFileToGoogleDrive } from '../../services/api';
import api from '../../services/api';

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  preview_image: string;
  file_url: string;
  total_sales: number;
  total_revenue: number;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storageType, setStorageType] = useState<'r2' | 'google-drive'>('r2');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    preview_image: '',
    file_url: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const response = await adminGetProducts();
      setProducts(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      alert(error.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      let response;
      if (storageType === 'google-drive') {
        response = await adminUploadFileToGoogleDrive(file);
      } else {
        response = await adminUploadFile(file);
      }
      
      const uploadedFile = response.data.data;

      setFormData({ ...formData, file_url: uploadedFile.url });
      alert(`File uploaded successfully to ${storageType === 'google-drive' ? 'Google Drive' : 'R2'}: ${uploadedFile.originalName}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug || !formData.price || !formData.file_url) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const data = {
        ...formData,
        price: parseInt(formData.price),
      };

      if (editingProduct) {
        await adminUpdateProduct(editingProduct.id, data);
        alert('Product updated successfully!');
      } else {
        await adminCreateProduct(data);
        alert('Product created successfully!');
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        title: '',
        slug: '',
        description: '',
        price: '',
        preview_image: '',
        file_url: '',
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      preview_image: product.preview_image,
      file_url: product.file_url,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      await adminDeleteProduct(id);
      alert('Product deleted successfully!');
      fetchProducts();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'Failed to delete product');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products Management</h1>
          <p className="text-gray-600">Manage your digital products and files</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              title: '',
              slug: '',
              description: '',
              price: '',
              preview_image: '',
              file_url: '',
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          ➕ Add New Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={product.preview_image || 'https://via.placeholder.com/50'}
                        alt={product.title}
                        className="w-12 h-12 rounded object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.total_sales || 0} sales
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(product.total_revenue || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No products found. Add your first product!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      title: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (IDR) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview Image URL
                </label>
                <input
                  type="url"
                  value={formData.preview_image}
                  onChange={(e) => setFormData({ ...formData, preview_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File *
                </label>
                
                {/* Storage Type Toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setStorageType('google-drive')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                      storageType === 'google-drive'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    📁 Google Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageType('r2')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                      storageType === 'r2'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    ☁️ Cloudflare R2
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {uploading && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  )}
                </div>
                {formData.file_url && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ File uploaded to {storageType === 'google-drive' ? 'Google Drive' : 'Cloudflare R2'}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
