import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth';

// Types
type Bindings = {
  e_store_db: D1Database;
  JWT_SECRET: string;
};

// Initialize app
const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'E-Store API is running!',
    version: '1.0.0'
  });
});

// Auth routes
app.route('/api/auth', auth);

// Get all products
app.get('/api/products', async (c) => {
  try {
    const db = c.env.e_store_db;
    const { results } = await db.prepare('SELECT * FROM products').all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch products' }, 500);
  }
});

// Get single product by slug
app.get('/api/products/:slug', async (c) => {
  try {
    const { slug } = c.req.param();
    const db = c.env.e_store_db;
    const product = await db.prepare('SELECT * FROM products WHERE slug = ?').bind(slug).first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    return c.json({ success: true, data: product });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch product' }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default app;