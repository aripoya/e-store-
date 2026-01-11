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

export default api;
