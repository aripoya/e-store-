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

    console.log('Fetching purchases for user:', userId);

    // First, get all orders for this user
    const ordersQuery = `
      SELECT 
        id as order_id,
        midtrans_order_id,
        total_price,
        status,
        created_at as order_date
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const { results: ordersResults } = await db.prepare(ordersQuery).bind(userId).all();
    console.log('Found orders:', ordersResults?.length || 0);

    if (!ordersResults || ordersResults.length === 0) {
      return c.json({
        success: true,
        data: [],
      });
    }

    // For each order, get the items and product details
    const orders = await Promise.all(
      ordersResults.map(async (order: any) => {
        const itemsQuery = `
          SELECT 
            oi.product_id,
            oi.price as paid_price,
            p.title,
            p.slug,
            p.description,
            p.preview_image,
            p.file_url,
            d.download_count,
            d.last_downloaded_at
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          LEFT JOIN downloads d ON d.order_id = ? AND d.product_id = p.id AND d.user_id = ?
          WHERE oi.order_id = ?
        `;

        const { results: itemsResults } = await db
          .prepare(itemsQuery)
          .bind(order.order_id, userId, order.order_id)
          .all();

        return {
          order_id: order.order_id,
          midtrans_order_id: order.midtrans_order_id,
          total_price: order.total_price,
          status: order.status,
          order_date: order.order_date,
          products: itemsResults || [],
        };
      })
    );

    console.log('Processed orders:', orders.length);

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
