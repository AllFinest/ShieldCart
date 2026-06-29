-- =============================================================================
-- SECURE E-COMMERCE DATABASE SCHEMA
-- =============================================================================
-- Complete schema with all tables for authentication, products, orders,
-- cart, audit logging, and security events.
-- All tables use InnoDB for transaction support and foreign key constraints.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS secure_ecommerce
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE secure_ecommerce;

-- =============================================================================
-- 1. USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer' NOT NULL,
  is_active TINYINT(1) DEFAULT 1 NOT NULL,
  email_verified TINYINT(1) DEFAULT 0 NOT NULL,
  last_login DATETIME NULL,
  login_attempts INT DEFAULT 0 NOT NULL,
  locked_until DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- =============================================================================
-- 2. REFRESH TOKENS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  trust_level ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW' NOT NULL,
  device_fingerprint VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  revoked TINYINT(1) DEFAULT 0 NOT NULL,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_session (session_id),
  INDEX idx_refresh_expires (expires_at)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. WEBAUTHN CREDENTIALS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  credential_id VARCHAR(512) NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INT DEFAULT 0 NOT NULL,
  device_type VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_webauthn_user (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 4. PASSWORD RESET TOKENS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_user (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 5. DEVICE TRUST TABLE (TCP)
-- =============================================================================
CREATE TABLE IF NOT EXISTS device_trust (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  trust_score DECIMAL(5,2) DEFAULT 0.00,
  user_agent TEXT NULL,
  ip_address VARCHAR(45) NULL,
  is_trusted TINYINT(1) DEFAULT 0 NOT NULL,
  last_seen DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_device_user (user_id),
  UNIQUE INDEX idx_device_fingerprint (user_id, device_fingerprint)
) ENGINE=InnoDB;

-- =============================================================================
-- 6. PRODUCT CATEGORIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  icon VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- 7. PRODUCTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NULL,
  category_id INT NULL,
  stock_quantity INT DEFAULT 0 NOT NULL,
  image_url VARCHAR(500) NULL,
  badge VARCHAR(50) NULL,
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
  INDEX idx_products_category (category_id),
  INDEX idx_products_active (is_active)
) ENGINE=InnoDB;

-- =============================================================================
-- 8. CARTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 9. CART ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_cart_product (cart_id, product_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 10. ORDERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending' NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  tax DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSON NULL,
  payment_intent_id VARCHAR(255) NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' NOT NULL,
  estimated_delivery DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- =============================================================================
-- 11. ORDER ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 12. PRODUCT REVIEWS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_review_unique (product_id, user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 13. ACTIVITY LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_action (action),
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;

-- =============================================================================
-- 14. SECURITY EVENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  event_type VARCHAR(100) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low' NOT NULL,
  description TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_type (event_type),
  INDEX idx_security_severity (severity),
  INDEX idx_security_created (created_at)
) ENGINE=InnoDB;

-- =============================================================================
-- SEED DATA: Default categories
-- =============================================================================
INSERT IGNORE INTO product_categories (name, slug, icon) VALUES
  ('Electronics', 'electronics', 'FiMonitor'),
  ('Clothing', 'clothing', 'FiShoppingBag'),
  ('Home & Garden', 'home-garden', 'FiHome'),
  ('Sports', 'sports', 'FiActivity'),
  ('Books', 'books', 'FiBook'),
  ('Beauty', 'beauty', 'FiHeart');

-- =============================================================================
-- SEED DATA: Sample products
-- =============================================================================
INSERT IGNORE INTO products (name, description, price, original_price, category_id, stock_quantity, badge, rating, review_count) VALUES
  ('Wireless Noise-Cancelling Headphones', 'Premium wireless headphones with active noise cancellation and 30-hour battery life.', 149.99, 199.99, 1, 50, 'Best Seller', 4.80, 234),
  ('Premium Cotton T-Shirt', 'Soft organic cotton t-shirt available in multiple colors. Comfortable everyday wear.', 29.99, NULL, 2, 200, NULL, 4.50, 89),
  ('Smart Home Security Camera', '1080p HD security camera with night vision, motion detection, and two-way audio.', 79.99, 99.99, 1, 75, 'Sale', 4.70, 156),
  ('Organic Skincare Set', 'Complete skincare routine with cleanser, toner, moisturizer, and serum. All natural ingredients.', 54.99, NULL, 6, 120, 'Top Rated', 4.90, 312),
  ('Running Shoes Pro', 'Lightweight running shoes with responsive cushioning and breathable mesh upper.', 119.99, 149.99, 4, 80, NULL, 4.60, 178),
  ('Bestselling Novel Collection', 'Curated collection of this year''s top bestselling novels. Perfect for avid readers.', 39.99, NULL, 5, 300, 'New', 4.40, 67),
  ('Ergonomic Office Chair', 'Adjustable ergonomic chair with lumbar support, headrest, and breathable mesh back.', 299.99, 399.99, 3, 30, 'Best Seller', 4.70, 423),
  ('Bluetooth Portable Speaker', 'Waterproof portable speaker with 360-degree sound and 12-hour battery life.', 49.99, 69.99, 1, 150, 'Sale', 4.30, 198);

-- =============================================================================
-- SEED DATA: Default admin user (password: Admin@123456)
-- Hash generated with bcrypt 12 rounds
-- =============================================================================
-- Admin user will be created via API or seeder script to ensure proper bcrypt hashing
