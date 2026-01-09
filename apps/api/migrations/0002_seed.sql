-- Insert sample products
INSERT INTO products (title, slug, description, price, preview_image, file_url) VALUES
('Panduan Belajar JavaScript', 'panduan-belajar-javascript', 'Ebook lengkap untuk belajar JavaScript dari dasar hingga mahir. Cocok untuk pemula!', 99000, 'https://picsum.photos/seed/js/400/300', '/files/javascript-guide.pdf'),
('Template Notion Produktivitas', 'template-notion-produktivitas', 'Template Notion lengkap untuk meningkatkan produktivitas kerja dan kehidupan sehari-hari.', 49000, 'https://picsum.photos/seed/notion/400/300', '/files/notion-template.zip'),
('Workbook Financial Planning', 'workbook-financial-planning', 'Workbook PDF untuk merencanakan keuangan pribadi. Dilengkapi dengan worksheet dan kalkulator.', 79000, 'https://picsum.photos/seed/finance/400/300', '/files/financial-workbook.pdf'),
('Ebook Copywriting Mastery', 'ebook-copywriting-mastery', 'Pelajari teknik copywriting yang terbukti meningkatkan konversi penjualan hingga 300%.', 149000, 'https://picsum.photos/seed/copy/400/300', '/files/copywriting-ebook.pdf'),
('Panduan SEO 2026', 'panduan-seo-2026', 'Strategi SEO terbaru untuk mendominasi Google di tahun 2026. Update dengan algoritma terbaru!', 129000, 'https://picsum.photos/seed/seo/400/300', '/files/seo-guide.pdf'),
('Template CV ATS-Friendly', 'template-cv-ats-friendly', 'Paket 10 template CV yang lolos ATS. Tersedia dalam format Word dan Google Docs.', 39000, 'https://picsum.photos/seed/cv/400/300', '/files/cv-templates.zip');

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@estore.com', '$2a$10$XQxBtJXKQZPHJZJZJZJZJeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Admin', 'admin');
