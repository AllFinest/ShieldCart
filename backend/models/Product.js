/**
 * Product Model
 *
 * Handles all database operations for the products table.
 * Falls back to in-memory store when MySQL is unavailable.
 * Images sourced from Unsplash (free, no attribution required).
 */

const { pool } = require('../config/db');
const logger = require('../utils/logger');

const seedProducts = [
  {
    id: 1,
    name: 'QuietWave Wireless Headset',
    description: 'Wireless over-ear audio with adaptive quiet mode and battery life built for long listening days.',
    price: 149.99,
    original_price: 199.99,
    category_id: 1,
    category_name: 'Smart Tech',
    stock_quantity: 50,
    badge: 'Crowd Favorite',
    rating: 4.80,
    review_count: 234,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  },
  {
    id: 2,
    name: 'Cloudsoft Cotton Tee',
    description: 'Breathable cotton everyday tee with an easy fit and color options for simple rotation.',
    price: 29.99,
    original_price: null,
    category_id: 2,
    category_name: 'Everyday Wear',
    stock_quantity: 200,
    badge: null,
    rating: 4.50,
    review_count: 89,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
  },
  {
    id: 3,
    name: 'HomeWatch Indoor Camera',
    description: 'Compact 1080p camera with night visibility and motion alerts for home monitoring.',
    price: 79.99,
    original_price: 99.99,
    category_id: 1,
    category_name: 'Smart Tech',
    stock_quantity: 75,
    badge: 'Limited Deal',
    rating: 4.70,
    review_count: 156,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80',
  },
  {
    id: 4,
    name: 'Botanical Glow Care Kit',
    description: 'A four-step skincare bundle with cleanser, toner, moisturizer, and serum for daily routines.',
    price: 54.99,
    original_price: null,
    category_id: 6,
    category_name: 'Self Care',
    stock_quantity: 120,
    badge: 'Customer Pick',
    rating: 4.90,
    review_count: 312,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
  },
  {
    id: 5,
    name: 'StrideFlex Performance Trainers',
    description: 'Lightweight running shoes with springy cushioning and breathable support.',
    price: 119.99,
    original_price: 149.99,
    category_id: 4,
    category_name: 'Active Gear',
    stock_quantity: 80,
    badge: null,
    rating: 4.60,
    review_count: 178,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  },
  {
    id: 6,
    name: 'Weekend Reads Box Set',
    description: 'A curated fiction bundle for relaxed evenings, travel days, and book-club shelves.',
    price: 39.99,
    original_price: null,
    category_id: 5,
    category_name: 'Reads & Journals',
    stock_quantity: 300,
    badge: 'Just Added',
    rating: 4.40,
    review_count: 67,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
  },
  {
    id: 7,
    name: 'PostureEase Desk Chair',
    description: 'Adjustable work chair with lumbar support, a headrest, and flexible comfort settings.',
    price: 299.99,
    original_price: 399.99,
    category_id: 3,
    category_name: 'Living Spaces',
    stock_quantity: 30,
    badge: 'Crowd Favorite',
    rating: 4.70,
    review_count: 423,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80',
  },
  {
    id: 8,
    name: 'RoamBeat Mini Speaker',
    description: 'Portable waterproof speaker with room-filling sound for desks, patios, and weekend bags.',
    price: 49.99,
    original_price: 69.99,
    category_id: 1,
    category_name: 'Smart Tech',
    stock_quantity: 150,
    badge: 'Limited Deal',
    rating: 4.30,
    review_count: 198,
    is_active: 1,
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
  },
];

let useMemory = false;

async function initMemoryCheck() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    useMemory = false;
  } catch {
    useMemory = true;
    logger.info('Product model: using in-memory store (MySQL unavailable)');
  }
}

initMemoryCheck();

async function findAll({ category, search, page = 1, limit = 12 } = {}) {
  if (useMemory) {
    let filtered = [...seedProducts].filter((p) => p.is_active);
    if (category) {
      filtered = filtered.filter((p) => p.category_name.toLowerCase().replace(/\s&\s/g, '-').replace(/\s/g, '-') === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    const start = (page - 1) * limit;
    return { products: filtered.slice(start, start + limit), total: filtered.length };
  }

  let query = `SELECT p.*, pc.name as category_name FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.is_active = 1`;
  const params = [];

  if (category) {
    query += ' AND pc.slug = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const countQuery = query.replace('SELECT p.*, pc.name as category_name', 'SELECT COUNT(*) as total');
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(String(limit), String((page - 1) * limit));

  const [rows] = await pool.execute(query, params);
  const [countRows] = await pool.execute(countQuery, params.slice(0, -2));
  return { products: rows, total: countRows[0]?.total || 0 };
}

async function findById(id) {
  if (useMemory) {
    return seedProducts.find((p) => p.id === Number(id)) || null;
  }
  const [rows] = await pool.execute(
    `SELECT p.*, pc.name as category_name FROM products p
     LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getCategories() {
  if (useMemory) {
    return [
      { id: 1, name: 'Smart Tech', slug: 'electronics', icon: 'FiMonitor', count: 3 },
      { id: 2, name: 'Everyday Wear', slug: 'clothing', icon: 'FiShoppingBag', count: 1 },
      { id: 3, name: 'Living Spaces', slug: 'home-garden', icon: 'FiHome', count: 1 },
      { id: 4, name: 'Active Gear', slug: 'sports', icon: 'FiActivity', count: 1 },
      { id: 5, name: 'Reads & Journals', slug: 'books', icon: 'FiBook', count: 1 },
      { id: 6, name: 'Self Care', slug: 'beauty', icon: 'FiHeart', count: 1 },
    ];
  }
  const [rows] = await pool.execute(
    `SELECT pc.*, COUNT(p.id) as count FROM product_categories pc
     LEFT JOIN products p ON p.category_id = pc.id AND p.is_active = 1
     GROUP BY pc.id ORDER BY pc.name`
  );
  return rows;
}

module.exports = { findAll, findById, getCategories };
