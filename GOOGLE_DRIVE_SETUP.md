# Google Drive Integration Setup Guide

Panduan lengkap untuk mengintegrasikan Google Drive sebagai storage alternatif untuk file produk digital di E-Store.

## 📋 Prerequisites

- Google Cloud Platform account
- Akses ke Google Cloud Console
- Cloudflare Workers account (sudah ada)

---

## 🚀 Setup Steps

### 1. Create Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **"Select a project"** → **"New Project"**
3. Nama project: `e-store-files` (atau nama lain)
4. Klik **"Create"**

### 2. Enable Google Drive API

1. Di Google Cloud Console, pilih project yang baru dibuat
2. Buka **"APIs & Services"** → **"Library"**
3. Cari **"Google Drive API"**
4. Klik **"Enable"**

### 3. Create Service Account

1. Buka **"APIs & Services"** → **"Credentials"**
2. Klik **"Create Credentials"** → **"Service Account"**
3. Isi form:
   - **Service account name:** `e-store-uploader`
   - **Service account ID:** (auto-generated)
   - **Description:** "Service account for uploading files to Google Drive"
4. Klik **"Create and Continue"**
5. **Grant this service account access to project:**
   - Skip (klik "Continue")
6. **Grant users access to this service account:**
   - Skip (klik "Done")

### 4. Create Service Account Key

1. Di halaman **"Credentials"**, klik service account yang baru dibuat
2. Tab **"Keys"** → **"Add Key"** → **"Create new key"**
3. Pilih **"JSON"**
4. Klik **"Create"**
5. File JSON akan terdownload otomatis
6. **SIMPAN FILE INI DENGAN AMAN!** File ini berisi credentials yang sensitif

### 5. Create Google Drive Folder (Optional)

Untuk mengorganisir file, buat folder khusus di Google Drive:

1. Buka [Google Drive](https://drive.google.com/)
2. Klik **"New"** → **"Folder"**
3. Nama folder: `E-Store Products`
4. Klik kanan folder → **"Share"**
5. **Share dengan service account email:**
   - Copy email dari file JSON: `client_email`
   - Paste di share dialog
   - Role: **"Editor"**
   - Klik **"Send"**
6. **Copy Folder ID** dari URL:
   - URL format: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy `FOLDER_ID_HERE`

---

## 🔐 Configure Cloudflare Workers Secrets

### Extract dari JSON File

Buka file JSON yang didownload, cari:

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "e-store-uploader@PROJECT_ID.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

### Set Cloudflare Secrets

```bash
cd apps/api

# Set Client Email
pnpm wrangler secret put GOOGLE_DRIVE_CLIENT_EMAIL
# Paste: e-store-uploader@PROJECT_ID.iam.gserviceaccount.com

# Set Private Key (IMPORTANT: Copy entire key including BEGIN/END lines)
pnpm wrangler secret put GOOGLE_DRIVE_PRIVATE_KEY
# Paste: -----BEGIN PRIVATE KEY-----\nMIIE....\n-----END PRIVATE KEY-----\n

# Set Folder ID (Optional - jika tidak set, file akan di root Drive)
pnpm wrangler secret put GOOGLE_DRIVE_FOLDER_ID
# Paste: FOLDER_ID dari step 5
```

**PENTING:** 
- Private key harus include `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`
- Newlines (`\n`) harus tetap ada
- Jangan tambahkan quotes atau karakter extra

---

## 🧪 Testing

### 1. Deploy Backend

```bash
cd apps/api
pnpm wrangler deploy
```

### 2. Test Upload via Admin Dashboard

1. Login sebagai admin di `https://jogjabootcamp.com/admin`
2. Klik **"Manage Products"**
3. Klik **"Add New Product"**
4. Di form upload:
   - Klik toggle **"📁 Google Drive"**
   - Pilih file untuk upload
   - File akan otomatis terupload ke Google Drive
5. Verify di [Google Drive](https://drive.google.com/) - file harus muncul di folder yang di-share

### 3. Test Download

1. Create product dengan file dari Google Drive
2. Complete purchase untuk product tersebut
3. Klik **"Download"** di halaman **"My Purchases"**
4. File harus terdownload dengan direct link dari Google Drive

---

## 📊 How It Works

### Upload Flow

```
Admin Upload File
    ↓
Frontend: Select Storage (Google Drive / R2)
    ↓
POST /api/admin/upload-gdrive
    ↓
Backend: Generate JWT Token
    ↓
Google Drive API: Upload File
    ↓
Set File Permissions (Public)
    ↓
Return Download URL
    ↓
Save URL to Database
```

### Download Flow

```
User Click Download
    ↓
GET /api/download/:productId
    ↓
Validate Purchase & Status
    ↓
Return file_url (Google Drive direct link)
    ↓
Browser Download File
```

---

## 🔒 Security Features

1. **Service Account Authentication**
   - No OAuth flow required
   - Credentials stored as Cloudflare secrets
   - Never exposed to frontend

2. **Public File Access**
   - Files automatically set to "anyone with link can view"
   - Direct download links generated
   - No additional authentication needed for downloads

3. **Purchase Validation**
   - Backend validates user purchased product
   - Order status must be 'paid'
   - Download limit enforced (5x)
   - Expiry date enforced (30 days)

---

## 🎯 Storage Comparison

| Feature | Google Drive | Cloudflare R2 |
|---------|-------------|---------------|
| **Free Tier** | 15 GB | 10 GB |
| **Bandwidth** | Free (with limits) | Free (no egress fees) |
| **Setup** | Service Account required | Automatic |
| **Speed** | Good | Excellent (CDN) |
| **File Management** | Google Drive UI | Wrangler CLI / Dashboard |
| **Best For** | Easy management, familiar UI | High performance, scalability |

---

## 🐛 Troubleshooting

### Error: "Google Drive not configured"

**Cause:** Secrets belum di-set atau salah format

**Solution:**
```bash
# Verify secrets exist
pnpm wrangler secret list

# Re-set secrets dengan format yang benar
pnpm wrangler secret put GOOGLE_DRIVE_CLIENT_EMAIL
pnpm wrangler secret put GOOGLE_DRIVE_PRIVATE_KEY
```

### Error: "Failed to upload to Google Drive"

**Possible causes:**
1. **Private key format salah** - Pastikan include BEGIN/END lines dan \n
2. **Service account tidak punya akses** - Share folder dengan service account email
3. **API belum enabled** - Enable Google Drive API di Cloud Console

**Debug:**
```bash
# Check wrangler logs
pnpm wrangler tail

# Look for detailed error messages
```

### Error: "Invalid JWT signature"

**Cause:** Private key tidak valid atau corrupted

**Solution:**
1. Download ulang JSON key dari Google Cloud Console
2. Copy private key dengan hati-hati (include all newlines)
3. Re-set secret

---

## 📝 File Naming Convention

Files uploaded ke Google Drive menggunakan format:
```
{timestamp}-{sanitized_filename}
```

Example:
```
1736582400000-ebook-react-advanced.pdf
1736582450000-template-notion-productivity.zip
```

---

## 🔄 Switching Between Storage Types

Admin dapat memilih storage type untuk setiap product:

1. **Google Drive:**
   - Klik toggle "📁 Google Drive"
   - Upload file
   - URL format: `https://drive.google.com/uc?export=download&id=FILE_ID`

2. **Cloudflare R2:**
   - Klik toggle "☁️ Cloudflare R2"
   - Upload file
   - URL format: `filename-with-timestamp.ext`

File URL disimpan di database `products.file_url` dan digunakan untuk download.

---

## 🎉 Benefits

✅ **Dual Storage Options** - Fleksibilitas memilih storage per product
✅ **Easy Management** - Manage files via Google Drive UI
✅ **Familiar Interface** - Admin sudah familiar dengan Google Drive
✅ **Automatic Backups** - Google Drive automatic versioning
✅ **Scalable** - Support untuk file besar
✅ **Cost Effective** - Free tier 15GB

---

## 📚 Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Account Authentication](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

---

## ⚠️ Important Notes

1. **Keep JSON key file secure** - Never commit to git
2. **Rotate keys periodically** - Best practice untuk security
3. **Monitor quota** - Google Drive API has daily quotas
4. **Backup important files** - Always maintain backups
5. **Test thoroughly** - Test upload/download before production use

---

**Setup complete! Anda sekarang bisa upload file produk digital ke Google Drive!** 🚀
