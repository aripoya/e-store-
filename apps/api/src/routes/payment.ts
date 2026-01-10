import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';

type Bindings = {
  e_store_db: D1Database;
  JWT_SECRET: string;
  MIDTRANS_SERVER_KEY: string;
  MIDTRANS_CLIENT_KEY: string;
};

const payment = new Hono<{ Bindings: Bindings }>();

payment.post('/create-transaction', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verify(token, c.env.JWT_SECRET);
    const userId = decoded.userId as number;

    const { items, customerDetails } = await c.req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, error: 'Items are required' }, 400);
    }

    const orderId = `ORDER-${Date.now()}-${userId}`;
    let grossAmount = 0;

    const itemDetails = await Promise.all(
      items.map(async (item: any) => {
        const db = c.env.e_store_db;
        const product = await db
          .prepare('SELECT * FROM products WHERE id = ?')
          .bind(item.productId)
          .first();

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const price = Number(product.price);
        const quantity = Number(item.quantity);
        const subtotal = price * quantity;
        grossAmount += subtotal;

        return {
          id: product.id,
          price: price,
          quantity: quantity,
          name: product.title,
        };
      })
    );

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: customerDetails || {
        first_name: 'Customer',
        email: 'customer@example.com',
      },
    };

    const serverKey = c.env.MIDTRANS_SERVER_KEY;
    const authString = btoa(serverKey + ':');

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(parameter),
    });

    const result = await response.json() as any;

    if (!response.ok) {
      return c.json({ success: false, error: 'Failed to create transaction', details: result }, 500);
    }

    const db = c.env.e_store_db;
    await db
      .prepare(
        'INSERT INTO orders (user_id, order_id, total_amount, status) VALUES (?, ?, ?, ?)'
      )
      .bind(userId, orderId, grossAmount, 'pending')
      .run();

    return c.json({
      success: true,
      data: {
        token: result.token,
        redirect_url: result.redirect_url,
        order_id: orderId,
      },
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    return c.json({ success: false, error: error.message || 'Failed to create transaction' }, 500);
  }
});

payment.post('/notification', async (c) => {
  try {
    const notification = await c.req.json();
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let orderStatus = 'pending';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        orderStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      orderStatus = 'paid';
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      orderStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      orderStatus = 'pending';
    }

    const db = c.env.e_store_db;
    await db
      .prepare('UPDATE orders SET status = ? WHERE order_id = ?')
      .bind(orderStatus, orderId)
      .run();

    return c.json({ success: true, message: 'Notification processed' });
  } catch (error: any) {
    console.error('Notification error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

payment.get('/client-key', async (c) => {
  return c.json({
    success: true,
    data: {
      clientKey: c.env.MIDTRANS_CLIENT_KEY,
    },
  });
});

export default payment;
