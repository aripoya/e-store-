import { Hono } from 'hono';
import { sign } from 'hono/jwt';

type Bindings = {
  e_store_db: D1Database;
  JWT_SECRET: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Simple hash function (untuk development)
// Di production, gunakan bcrypt atau argon2
const simpleHash = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'e-store-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const newHash = await simpleHash(password);
  return newHash === hash;
};

// Register
auth.post('/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    // Validation
    if (!name || !email || !password) {
      return c.json({ success: false, error: 'Semua field harus diisi' }, 400);
    }

    if (password.length < 6) {
      return c.json({ success: false, error: 'Password minimal 6 karakter' }, 400);
    }

    const db = c.env.e_store_db;

    // Check if email already exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ success: false, error: 'Email sudah terdaftar' }, 400);
    }

    // Hash password
    const passwordHash = await simpleHash(password);

    // Insert user
    const result = await db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).bind(name, email, passwordHash, 'customer').run();

    const userId = result.meta.last_row_id;

    // Generate JWT
    const token = await sign(
      { userId, email, role: 'customer', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      c.env.JWT_SECRET || 'default-secret-key'
    );

    return c.json({
      success: true,
      data: {
        token,
        user: { id: userId, name, email, role: 'customer' }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ success: false, error: 'Registrasi gagal' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Validation
    if (!email || !password) {
      return c.json({ success: false, error: 'Email dan password harus diisi' }, 400);
    }

    const db = c.env.e_store_db;

    // Find user
    const user = await db.prepare(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?'
    ).bind(email).first<{ id: number; name: string; email: string; password_hash: string; role: string }>();

    if (!user) {
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    // Generate JWT
    const token = await sign(
      { userId: user.id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      c.env.JWT_SECRET || 'default-secret-key'
    );

    return c.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Login gagal' }, 500);
  }
});

export default auth;