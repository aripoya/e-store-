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
    let decoded;
    try {
      decoded = await verify(token, c.env.JWT_SECRET);
    } catch (err) {
      console.error('JWT verification failed:', err);
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    const userId = decoded.userId as number;

    const { items, customerDetails } = await c.req.json();
    console.log('Received items:', items);
    console.log('Customer details:', customerDetails);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, error: 'Items are required' }, 400);
    }

    const orderId = `ORDER-${Date.now()}-${userId}`;
    let grossAmount = 0;

    const itemDetails = await Promise.all(
      items.map(async (item: any) => {
        const db = c.env.e_store_db;
        console.log('Fetching product:', item.productId);
        const product = await db
          .prepare('SELECT * FROM products WHERE id = ?')
          .bind(item.productId)
          .first();

        if (!product) {
          console.error(`Product ${item.productId} not found`);
          throw new Error(`Product ${item.productId} not found`);
        }

        const price = Number(product.price);
        const quantity = Number(item.quantity);
        const subtotal = price * quantity;
        grossAmount += subtotal;

        console.log('Product details:', { id: product.id, title: product.title, price, quantity });

        return {
          id: String(product.id),
          price: price,
          quantity: quantity,
          name: String(product.title),
        };
      })
    );

    console.log('Item details:', itemDetails);
    console.log('Gross amount:', grossAmount);

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      item_details: itemDetails,
      customer_details: customerDetails || {
        first_name: 'Customer',
        email: 'customer@example.com',
      },
      callbacks: {
        finish: 'https://e-store-46d.pages.dev/payment/success',
        error: 'https://e-store-46d.pages.dev/payment/failed',
        pending: 'https://e-store-46d.pages.dev/payment/pending',
      },
    };

    const serverKey = c.env.MIDTRANS_SERVER_KEY;
    const authString = btoa(serverKey + ':');

    console.log('Calling Midtrans API with parameter:', JSON.stringify(parameter));

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(parameter),
    });

    const result = await response.json() as any;
    console.log('Midtrans response status:', response.status);
    console.log('Midtrans response:', JSON.stringify(result));

    if (!response.ok) {
      console.error('Midtrans API error status:', response.status);
      console.error('Midtrans API error details:', JSON.stringify(result));
      const errorMessage = result.error_messages?.join(', ') || result.message || 'Failed to create transaction';
      return c.json({ 
        success: false, 
        error: errorMessage,
        details: result,
        status: response.status
      }, 500);
    }

    const db = c.env.e_store_db;
    
    // Insert order
    const orderResult = await db
      .prepare(
        'INSERT INTO orders (user_id, midtrans_order_id, total_price, status) VALUES (?, ?, ?, ?)'
      )
      .bind(userId, orderId, Math.round(grossAmount), 'pending')
      .run();

    // Get the inserted order ID
    const insertedOrderId = orderResult.meta.last_row_id;

    // Insert order items
    for (const item of items) {
      const product = await db
        .prepare('SELECT * FROM products WHERE id = ?')
        .bind(item.productId)
        .first();

      if (product) {
        await db
          .prepare(
            'INSERT INTO order_items (order_id, product_id, price) VALUES (?, ?, ?)'
          )
          .bind(insertedOrderId, item.productId, Number(product.price))
          .run();
      }
    }

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
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error));
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to create transaction',
      details: error.toString()
    }, 500);
  }
});

payment.post('/notification', async (c) => {
  try {
    const notification = await c.req.json();
    
    console.log('Midtrans notification received:', JSON.stringify(notification));
    
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const grossAmount = notification.gross_amount;

    // Verify signature for security (ENABLED for production)
    const signatureKey = notification.signature_key;
    const serverKey = c.env.MIDTRANS_SERVER_KEY;
    
    // Create SHA512 hash for signature verification
    const encoder = new TextEncoder();
    const data = encoder.encode(`${orderId}${transactionStatus}${grossAmount}${serverKey}`);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (signatureKey !== expectedSignature) {
      console.error('Invalid signature - potential fraud attempt');
      return c.json({ success: false, error: 'Invalid signature' }, 401);
    }

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

    console.log(`Updating order ${orderId} to status: ${orderStatus}`);

    const db = c.env.e_store_db;
    const result = await db
      .prepare('UPDATE orders SET status = ? WHERE midtrans_order_id = ?')
      .bind(orderStatus, orderId)
      .run();

    console.log('Update result:', result);

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
