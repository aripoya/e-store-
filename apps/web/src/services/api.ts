import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? 'https://api.wahwooh.workers.dev/api' 
    : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (slug: string) => api.get(`/products/${slug}`);

// Auth
export const login = (email: string, password: string) => 
  api.post('/auth/login', { email, password });
export const register = (name: string, email: string, password: string) => 
  api.post('/auth/register', { name, email, password });

// Orders
export const createOrder = (items: any[], couponCode?: string) => 
  api.post('/orders', { items, couponCode });
export const getMyOrders = () => api.get('/orders/my');

// Reviews
export const getProductReviews = (productId: number) => 
  api.get(`/reviews/product/${productId}`);
export const createReview = (productId: number, rating: number, comment: string) => 
  api.post('/reviews', { productId, rating, comment });

// Payment
export const createTransaction = (items: any[], customerDetails: any) => 
  api.post('/payment/create-transaction', { items, customerDetails });
export const getClientKey = () => api.get('/payment/client-key');

// Purchases
export const getMyPurchases = () => api.get('/my-purchases');
export const downloadProduct = (productId: number) => api.get(`/download/${productId}`);

// Admin - Products
export const adminGetProducts = () => api.get('/admin/products');
export const adminCreateProduct = (data: any) => api.post('/admin/products', data);
export const adminUpdateProduct = (id: number, data: any) => api.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id: number) => api.delete(`/admin/products/${id}`);

// Admin - Upload
export const adminUploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const adminUploadFileToGoogleDrive = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/admin/upload-gdrive', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Admin - Orders
export const adminGetOrders = () => api.get('/admin/orders');

// Admin - Stats
export const adminGetStats = () => api.get('/admin/stats');

export default api;
