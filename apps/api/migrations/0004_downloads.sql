-- Create downloads table for tracking file downloads
CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_downloads_user_product ON downloads(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_downloads_order ON downloads(order_id);
