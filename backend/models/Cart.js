/**
 * Cart Model
 *
 * Handles shopping cart operations with in-memory fallback.
 */

const { pool } = require('../config/db');
const logger = require('../utils/logger');

const memoryCarts = new Map();
let useMemory = false;

async function initMemoryCheck() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    useMemory = false;
  } catch {
    useMemory = true;
    logger.info('Cart model: using in-memory store (MySQL unavailable)');
  }
}

initMemoryCheck();

function getMemoryCart(userId) {
  if (!memoryCarts.has(userId)) {
    memoryCarts.set(userId, []);
  }
  return memoryCarts.get(userId);
}

const seedProducts = [
  { id: 1, name: 'QuietWave Wireless Headset', price: 149.99, image_url: null, stock_quantity: 50 },
  { id: 2, name: 'Cloudsoft Cotton Tee', price: 29.99, image_url: null, stock_quantity: 200 },
  { id: 3, name: 'HomeWatch Indoor Camera', price: 79.99, image_url: null, stock_quantity: 75 },
  { id: 4, name: 'Botanical Glow Care Kit', price: 54.99, image_url: null, stock_quantity: 120 },
  { id: 5, name: 'StrideFlex Performance Trainers', price: 119.99, image_url: null, stock_quantity: 80 },
  { id: 6, name: 'Weekend Reads Box Set', price: 39.99, image_url: null, stock_quantity: 300 },
  { id: 7, name: 'PostureEase Desk Chair', price: 299.99, image_url: null, stock_quantity: 30 },
  { id: 8, name: 'RoamBeat Mini Speaker', price: 49.99, image_url: null, stock_quantity: 150 },
];

async function getItems(userId) {
  if (useMemory) {
    const cart = getMemoryCart(userId);
    return cart.map((item) => {
      const product = seedProducts.find((p) => p.id === item.product_id);
      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        name: product?.name || 'Unknown',
        price: product?.price || 0,
        image_url: product?.image_url || null,
        stock_quantity: product?.stock_quantity || 0,
      };
    });
  }

  const [rows] = await pool.execute(
    `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock_quantity
     FROM cart_items ci
     JOIN carts c ON ci.cart_id = c.id
     JOIN products p ON ci.product_id = p.id
     WHERE c.user_id = ?`,
    [userId]
  );
  return rows;
}

async function addItem(userId, productId, quantity = 1) {
  if (useMemory) {
    const cart = getMemoryCart(userId);
    const existing = cart.find((i) => i.product_id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id: Date.now(), product_id: productId, quantity });
    }
    return getItems(userId);
  }

  await pool.execute(
    'INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE updated_at = NOW()',
    [userId]
  );
  const [[cartRow]] = await pool.execute('SELECT id FROM carts WHERE user_id = ?', [userId]);

  await pool.execute(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [cartRow.id, productId, quantity, quantity]
  );
  return getItems(userId);
}

async function updateQuantity(userId, productId, quantity) {
  if (useMemory) {
    const cart = getMemoryCart(userId);
    const item = cart.find((i) => i.product_id === productId);
    if (item) item.quantity = quantity;
    return getItems(userId);
  }

  const [[cartRow]] = await pool.execute('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (!cartRow) return [];

  await pool.execute(
    'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
    [quantity, cartRow.id, productId]
  );
  return getItems(userId);
}

async function removeItem(userId, productId) {
  if (useMemory) {
    const cart = getMemoryCart(userId);
    const idx = cart.findIndex((i) => i.product_id === productId);
    if (idx !== -1) cart.splice(idx, 1);
    return getItems(userId);
  }

  const [[cartRow]] = await pool.execute('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (!cartRow) return [];

  await pool.execute(
    'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [cartRow.id, productId]
  );
  return getItems(userId);
}

async function clearCart(userId) {
  if (useMemory) {
    memoryCarts.set(userId, []);
    return [];
  }

  const [[cartRow]] = await pool.execute('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (cartRow) {
    await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartRow.id]);
  }
  return [];
}

async function getItemCount(userId) {
  if (useMemory) {
    const cart = getMemoryCart(userId);
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  const [[result]] = await pool.execute(
    `SELECT COALESCE(SUM(ci.quantity), 0) as count
     FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?`,
    [userId]
  );
  return result?.count || 0;
}

module.exports = {
  getItems,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  getItemCount,
};
