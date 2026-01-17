import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { z } from 'zod';
import { GoogleDriveUploader } from '../utils/googleDrive';

type Bindings = {
  e_store_db: D1Database;
  JWT_SECRET: string;
  FILES_BUCKET: R2Bucket;
  GOOGLE_DRIVE_CLIENT_EMAIL?: string;
  GOOGLE_DRIVE_PRIVATE_KEY?: string;
  GOOGLE_DRIVE_FOLDER_ID?: string;
};

const admin = new Hono<{ Bindings: Bindings }>();

// Validation schemas
const productSchema = z.object({
  title: z.string().min(3, 'Title minimal 3 karakter').max(200, 'Title maksimal 200 karakter'),
  slug: z.string().min(3, 'Slug minimal 3 karakter').max(200, 'Slug maksimal 200 karakter'),
  description: z.string().min(10, 'Description minimal 10 karakter').max(5000, 'Description maksimal 5000 karakter').optional(),
  price: z.number().positive('Price harus lebih dari 0').max(1000000000, 'Price terlalu besar'),
  preview_image: z.string().url('Preview image harus URL valid').optional().or(z.literal('')),
  detail_image: z.string().url('Detail image harus URL valid').optional().or(z.literal('')),
  file_url: z.string().min(1, 'File URL harus diisi'),
});

// Admin auth middleware
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = await verify(token, c.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    
    c.set('userId', decoded.userId);
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
};

// GET /admin/products - Get all products with stats
admin.get('/products', adminAuth, async (c) => {
  try {
    const db = c.env.e_store_db;
    
    const query = `
      SELECT 
        p.*,
        COUNT(DISTINCT oi.order_id) as total_sales,
        COALESCE(SUM(oi.price), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    
    const { results } = await db.prepare(query).all();
    
    return c.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return c.json({ success: false, error: 'Failed to fetch products' }, 500);
  }
});

// POST /admin/products - Create new product
admin.post('/products', adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input with Zod
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: validation.error.issues[0].message 
      }, 400);
    }
    
    const { title, slug, description, price, preview_image, detail_image, file_url } = validation.data;
    const db = c.env.e_store_db;
    
    // Check if slug already exists
    const existing = await db
      .prepare('SELECT id FROM products WHERE slug = ?')
      .bind(slug)
      .first();
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Product with this slug already exists' 
      }, 400);
    }
    
    const result = await db
      .prepare(`
        INSERT INTO products (title, slug, description, price, preview_image, detail_image, file_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(title, slug, description || '', price, preview_image || '', detail_image || '', file_url)
      .run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        message: 'Product created successfully',
      },
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    return c.json({ success: false, error: 'Failed to create product' }, 500);
  }
});

// PUT /admin/products/:id - Update product
admin.put('/products/:id', adminAuth, async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    const { title, slug, description, price, preview_image, detail_image, file_url } = await c.req.json();
    
    const db = c.env.e_store_db;
    
    // Check if product exists
    const product = await db
      .prepare('SELECT * FROM products WHERE id = ?')
      .bind(productId)
      .first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    await db
      .prepare(`
        UPDATE products 
        SET title = ?, slug = ?, description = ?, price = ?, 
            preview_image = ?, detail_image = ?, file_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(title, slug, description, price, preview_image, detail_image, file_url, productId)
      .run();
    
    return c.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return c.json({ success: false, error: 'Failed to update product' }, 500);
  }
});

// DELETE /admin/products/:id - Delete product
admin.delete('/products/:id', adminAuth, async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    const db = c.env.e_store_db;
    
    // Check if product exists
    const product = await db
      .prepare('SELECT * FROM products WHERE id = ?')
      .bind(productId)
      .first();
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    // Delete from R2 if file exists
    if (product.file_url) {
      try {
        await c.env.FILES_BUCKET.delete(product.file_url);
      } catch (err) {
        console.error('Failed to delete file from R2:', err);
      }
    }
    
    await db
      .prepare('DELETE FROM products WHERE id = ?')
      .bind(productId)
      .run();
    
    return c.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return c.json({ success: false, error: 'Failed to delete product' }, 500);
  }
});

// POST /admin/upload - Upload file to R2
admin.post('/upload', adminAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${originalName}`;
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.FILES_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    return c.json({
      success: true,
      data: {
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: fileName, // This will be used as file_url in products table
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ success: false, error: 'Failed to upload file' }, 500);
  }
});

// POST /admin/upload-gdrive - Upload file to Google Drive
admin.post('/upload-gdrive', adminAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    // Check if Google Drive credentials are configured
    if (!c.env.GOOGLE_DRIVE_CLIENT_EMAIL || !c.env.GOOGLE_DRIVE_PRIVATE_KEY) {
      return c.json({ 
        success: false, 
        error: 'Google Drive not configured. Please set GOOGLE_DRIVE_CLIENT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY secrets.' 
      }, 400);
    }
    
    // Initialize Google Drive uploader
    const uploader = new GoogleDriveUploader({
      clientEmail: c.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      privateKey: c.env.GOOGLE_DRIVE_PRIVATE_KEY,
      folderId: c.env.GOOGLE_DRIVE_FOLDER_ID,
    });
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${originalName}`;
    
    // Upload to Google Drive
    const arrayBuffer = await file.arrayBuffer();
    const result = await uploader.uploadFile(arrayBuffer, fileName, file.type);
    
    return c.json({
      success: true,
      data: {
        fileId: result.fileId,
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: result.webContentLink, // Direct download link
        viewUrl: result.webViewLink, // View in browser link
        storage: 'google-drive',
      },
    });
  } catch (error: any) {
    console.error('Google Drive upload error:', error);
    return c.json({ success: false, error: error.message || 'Failed to upload to Google Drive' }, 500);
  }
});

// GET /admin/orders - Get all orders with details
admin.get('/orders', adminAuth, async (c) => {
  try {
    const db = c.env.e_store_db;
    
    const query = `
      SELECT 
        o.id,
        o.midtrans_order_id,
        o.user_id,
        o.total_price,
        o.status,
        o.created_at,
        u.name as customer_name,
        u.email as customer_email,
        GROUP_CONCAT(p.title) as products
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const { results } = await db.prepare(query).all();
    
    return c.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return c.json({ success: false, error: 'Failed to fetch orders' }, 500);
  }
});

// GET /admin/stats - Get dashboard statistics
admin.get('/stats', adminAuth, async (c) => {
  try {
    const db = c.env.e_store_db;
    
    // Total revenue
    const revenueResult = await db
      .prepare('SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = "paid"')
      .first();
    
    // Total orders
    const ordersResult = await db
      .prepare('SELECT COUNT(*) as total FROM orders')
      .first();
    
    // Total products
    const productsResult = await db
      .prepare('SELECT COUNT(*) as total FROM products')
      .first();
    
    // Total customers
    const customersResult = await db
      .prepare('SELECT COUNT(*) as total FROM users WHERE role = "customer"')
      .first();
    
    // Recent orders
    const recentOrders = await db
      .prepare(`
        SELECT o.*, u.name as customer_name 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC 
        LIMIT 5
      `)
      .all();
    
    return c.json({
      success: true,
      data: {
        totalRevenue: revenueResult?.total || 0,
        totalOrders: ordersResult?.total || 0,
        totalProducts: productsResult?.total || 0,
        totalCustomers: customersResult?.total || 0,
        recentOrders: recentOrders.results || [],
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch statistics' }, 500);
  }
});

export default admin;
