import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { z } from 'zod';

type Bindings = {
  e_store_db: D1Database;
  JWT_SECRET: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100, 'Password maksimal 100 karakter'),
});

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
});

// PBKDF2 password hashing using Web Crypto API (Cloudflare Workers compatible)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordBuffer = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100k iterations for strong security
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  return btoa(String.fromCharCode(...combined));
};

const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const hash = combined.slice(16);
    
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    const newHash = new Uint8Array(derivedBits);
    
    if (hash.length !== newHash.length) return false;
    
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] !== newHash[i]) return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Legacy SHA-256 password verification (for existing users)
const verifyLegacyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'e-store-salt');
    const hash = await crypto.subtle.digest('SHA-256', data);
    const newHash = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return newHash === storedHash;
  } catch (error) {
    return false;
  }
};

// Detect if password hash is legacy format (SHA-256) or new format (PBKDF2)
const isLegacyHash = (hash: string): boolean => {
  try {
    const decoded = atob(hash);
    // PBKDF2 hash has 48 bytes (16 salt + 32 hash)
    // SHA-256 hash has 32 bytes
    return decoded.length === 32;
  } catch {
    return false;
  }
};

// Register
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: validation.error.issues[0].message 
      }, 400);
    }
    
    const { name, email, password } = validation.data;

    const db = c.env.e_store_db;

    // Check if email already exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ success: false, error: 'Email sudah terdaftar' }, 400);
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).bind(name, email, passwordHash, 'customer').run();

    const userId = result.meta.last_row_id;

    // Generate JWT
    const token = await sign(
      { userId, email, role: 'customer', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      c.env.JWT_SECRET
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
    const body = await c.req.json();
    
    // Validate input with Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: validation.error.issues[0].message 
      }, 400);
    }
    
    const { email, password } = validation.data;

    const db = c.env.e_store_db;

    // Find user
    const user = await db.prepare(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?'
    ).bind(email).first<{ id: number; name: string; email: string; password_hash: string; role: string }>();

    if (!user) {
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    // Check if password hash is legacy format and verify accordingly
    let isValid = false;
    let needsMigration = false;
    
    if (isLegacyHash(user.password_hash)) {
      // Try legacy SHA-256 verification
      isValid = await verifyLegacyPassword(password, user.password_hash);
      needsMigration = isValid; // If valid, we need to migrate to new format
    } else {
      // Try new PBKDF2 verification
      isValid = await verifyPassword(password, user.password_hash);
    }
    
    if (!isValid) {
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    // Auto-migrate legacy password to new PBKDF2 format
    if (needsMigration) {
      try {
        const newHash = await hashPassword(password);
        await db.prepare(
          'UPDATE users SET password_hash = ? WHERE id = ?'
        ).bind(newHash, user.id).run();
        console.log(`Password migrated to PBKDF2 for user: ${user.email}`);
      } catch (error) {
        console.error('Password migration failed:', error);
        // Don't fail login if migration fails, just log it
      }
    }

    // Generate JWT
    const token = await sign(
      { userId: user.id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      c.env.JWT_SECRET
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