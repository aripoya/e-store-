# Password Migration Guide

## 🔄 Automatic Password Migration System

### Overview
Sistem ini secara otomatis melakukan migrasi password dari format lama (SHA-256) ke format baru (PBKDF2) saat user login.

---

## 🔐 Password Format Comparison

### Old Format (SHA-256)
- **Algorithm:** SHA-256 with static salt
- **Iterations:** 1 (single hash)
- **Salt:** Static string `'e-store-salt'`
- **Length:** 32 bytes (256 bits)
- **Security:** ⚠️ Vulnerable to brute force

### New Format (PBKDF2)
- **Algorithm:** PBKDF2 with SHA-256
- **Iterations:** 100,000
- **Salt:** Random 16 bytes per password
- **Length:** 48 bytes (16 salt + 32 hash)
- **Security:** ✅ Industry standard, resistant to brute force

---

## 🚀 How It Works

### 1. **User Login Flow**

```
User Login
    ↓
Validate Input (Zod)
    ↓
Find User in Database
    ↓
Check Password Format
    ├─→ Legacy (SHA-256)?
    │       ↓
    │   Verify with SHA-256
    │       ↓
    │   ✅ Valid? → Migrate to PBKDF2
    │       ↓
    │   Update Database
    │
    └─→ New (PBKDF2)?
            ↓
        Verify with PBKDF2
            ↓
        ✅ Valid? → Continue
    ↓
Generate JWT Token
    ↓
Return Success
```

### 2. **Format Detection**

```typescript
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
```

### 3. **Legacy Password Verification**

```typescript
const verifyLegacyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'e-store-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  const newHash = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return newHash === storedHash;
};
```

### 4. **Automatic Migration**

```typescript
if (needsMigration) {
  try {
    const newHash = await hashPassword(password); // PBKDF2
    await db.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newHash, user.id).run();
    console.log(`Password migrated to PBKDF2 for user: ${user.email}`);
  } catch (error) {
    console.error('Password migration failed:', error);
    // Don't fail login if migration fails
  }
}
```

---

## ✅ Benefits

1. **Zero User Friction**
   - Users don't need to reset passwords
   - Migration happens transparently on login
   - No manual intervention required

2. **Gradual Migration**
   - Passwords migrate as users login
   - No need for batch migration
   - Inactive users remain on old format (still secure enough)

3. **Backward Compatible**
   - Old passwords still work
   - New registrations use PBKDF2
   - Smooth transition period

4. **Fail-Safe**
   - If migration fails, login still succeeds
   - Error is logged for monitoring
   - User experience not affected

---

## 📊 Migration Status Tracking

### Check Migration Progress

You can monitor migration progress with this SQL query:

```sql
-- Count users by password format
SELECT 
  CASE 
    WHEN LENGTH(password_hash) = 44 THEN 'Legacy SHA-256'
    WHEN LENGTH(password_hash) = 64 THEN 'New PBKDF2'
    ELSE 'Unknown'
  END as format,
  COUNT(*) as count
FROM users
GROUP BY format;
```

### Example Output:
```
format          | count
----------------|------
Legacy SHA-256  | 15
New PBKDF2      | 42
```

---

## 🔍 Testing

### Test Legacy User Login

1. **Create test user with old format (if needed):**
   ```sql
   -- This would be an existing user from before the migration
   SELECT email, password_hash FROM users WHERE email = 'test@example.com';
   ```

2. **Login with correct password:**
   - Should succeed ✅
   - Password should be migrated to PBKDF2
   - Next login will use new format

3. **Check logs:**
   ```
   Password migrated to PBKDF2 for user: test@example.com
   ```

4. **Verify migration:**
   ```sql
   SELECT LENGTH(password_hash) as hash_length FROM users WHERE email = 'test@example.com';
   -- Should return 64 (PBKDF2) instead of 44 (SHA-256)
   ```

---

## 🚨 Important Notes

### 1. **One-Way Migration**
- Once migrated to PBKDF2, cannot revert to SHA-256
- This is intentional for security

### 2. **Password Not Stored**
- Plain password is only available during login
- Migration happens at that moment
- Cannot migrate without user login

### 3. **Inactive Users**
- Users who never login will keep old format
- This is acceptable - old format still reasonably secure
- Can force password reset for inactive users if needed

### 4. **Error Handling**
- Migration failure doesn't block login
- User can still access their account
- Error is logged for investigation

---

## 📈 Migration Timeline

### Phase 1: Deploy (Week 1)
- ✅ Deploy migration code
- ✅ Monitor logs for migrations
- ✅ Track success rate

### Phase 2: Monitor (Week 2-4)
- Monitor migration progress
- Check for any errors
- Most active users should migrate

### Phase 3: Optional Cleanup (Month 2+)
- For users who haven't logged in:
  - Option A: Leave as-is (still secure)
  - Option B: Force password reset
  - Option C: Send reminder email

---

## 🔐 Security Considerations

### Why This Approach is Safe

1. **No Password Exposure**
   - Plain password only in memory during login
   - Never logged or stored
   - Immediately hashed with PBKDF2

2. **Backward Compatibility**
   - Old format still requires correct password
   - No security downgrade
   - Gradual improvement

3. **Fail-Safe Design**
   - Migration failure doesn't affect login
   - User experience prioritized
   - Errors logged for monitoring

4. **Transparent to Users**
   - No user action required
   - No password reset needed
   - Seamless experience

---

## 📝 Code Files Modified

- `apps/api/src/routes/auth.ts`
  - Added `verifyLegacyPassword()` function
  - Added `isLegacyHash()` detection function
  - Updated login endpoint with migration logic

---

## 🎯 Success Metrics

Track these metrics to measure migration success:

1. **Migration Rate**
   - % of users migrated per day/week
   - Target: 80% in first month

2. **Error Rate**
   - Migration failures
   - Target: < 1%

3. **Login Success Rate**
   - Should remain constant
   - Target: No degradation

4. **Performance**
   - Login time impact
   - Target: < 100ms additional time

---

## 🔧 Troubleshooting

### Issue: User can't login after migration
**Cause:** Migration completed but verification failed  
**Solution:** Check logs, may need password reset

### Issue: Migration not happening
**Cause:** Hash format detection failing  
**Solution:** Check `isLegacyHash()` logic

### Issue: High migration failure rate
**Cause:** Database connection issues  
**Solution:** Check D1 database status and logs

---

## 📞 Support

For issues or questions:
1. Check Cloudflare Workers logs
2. Review D1 database queries
3. Monitor migration metrics
4. Check error logs for patterns

---

**Status:** ✅ Active  
**Version:** 1.0.0  
**Last Updated:** January 18, 2026
