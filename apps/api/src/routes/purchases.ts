import { Hono } from 'hono';
import { verify } from 'hono/jwt';

type Bindings = {
  e_store_db: D1Database;
  JWT_SECRET: string;
};

const purchases = new Hono<{ Bindings: Bindings }>();

// Middleware to verify JWT and extract user
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = await verify(token, c.env.JWT_SECRET);
    c.set('userId', decoded.userId);
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
};

// GET /api/my-purchases - Get user's purchased products
purchases.get('/my-purchases', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.e_store_db;

    // Get all orders for this user with their items and product details
    const query = `
      SELECT 
        o.id as order_id,
        o.midtrans_order_id,
        o.total_price,
        o.status,
        o.created_at as order_date,
        oi.product_id,
        oi.price as paid_price,
        p.title,
        p.slug,
        p.description,
        p.preview_image,
        p.file_url,
        d.download_count,
        d.last_downloaded_at
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN downloads d ON d.order_id = o.id AND d.product_id = p.id AND d.user_id = ?
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;

    const { results } = await db.prepare(query).bind(userId, userId).all();

    // Group by order
    const orders = results.reduce((acc: any[], row: any) => {
      let order = acc.find((o: any) => o.order_id === row.order_id);
      
      if (!order) {
        order = {
          order_id: row.order_id,
          midtrans_order_id: row.midtrans_order_id,
          total_price: row.total_price,
          status: row.status,
          order_date: row.order_date,
          products: [],
        };
        acc.push(order);
      }

      order.products.push({
        product_id: row.product_id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        preview_image: row.preview_image,
        file_url: row.file_url,
        paid_price: row.paid_price,
        download_count: row.download_count || 0,
        last_downloaded_at: row.last_downloaded_at,
      });

      return acc;
    }, []);

    return c.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Get purchases error:', error);
    return c.json({ success: false, error: 'Failed to fetch purchases' }, 500);
  }
});

// GET /api/download/:productId - Download a purchased product
purchases.get('/download/:productId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const productId = parseInt(c.req.param('productId'));
    const db = c.env.e_store_db;

    // Verify user has purchased this product and order is paid
    const purchaseCheck = `
      SELECT 
        o.id as order_id,
        o.status,
        p.file_url,
        p.title
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'paid'
      LIMIT 1
    `;

    const purchase = await db.prepare(purchaseCheck).bind(userId, productId).first();

    if (!purchase) {
      return c.json({ 
        success: false, 
        error: 'Product not found or not purchased. Please complete payment first.' 
      }, 403);
    }

    // Check if download record exists
    const downloadRecord = await db
      .prepare('SELECT * FROM downloads WHERE user_id = ? AND product_id = ? AND order_id = ?')
      .bind(userId, productId, purchase.order_id)
      .first();

    if (downloadRecord) {
      // Update existing download record
      await db
        .prepare(`
          UPDATE downloads 
          SET download_count = download_count + 1, 
              last_downloaded_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `)
        .bind(downloadRecord.id)
        .run();
    } else {
      // Create new download record
      await db
        .prepare(`
          INSERT INTO downloads (user_id, product_id, order_id, download_count, last_downloaded_at)
          VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
        `)
        .bind(userId, productId, purchase.order_id)
        .run();
    }

    // Return download URL
    return c.json({
      success: true,
      data: {
        download_url: purchase.file_url,
        title: purchase.title,
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return c.json({ success: false, error: 'Failed to process download' }, 500);
  }
});

export default purchases;
