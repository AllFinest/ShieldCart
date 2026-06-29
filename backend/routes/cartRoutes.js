/**
 * Cart Routes
 *
 * Handles shopping cart operations: add, remove, update quantity, view.
 * All cart routes require authentication.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Cart = require('../models/Cart');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// GET /api/cart — get cart items for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Cart.getItems(req.user.id);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    successResponse(res, { items, total: Number(total.toFixed(2)), count }, 'Bag loaded.');
  } catch (error) {
    logger.error('Cart fetch error:', { message: error.message });
    errorResponse(res, 'We could not open your bag.', 500);
  }
});

// POST /api/cart/add — add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || quantity < 1) {
      return errorResponse(res, 'Choose an item and a valid quantity first.', 400);
    }
    const items = await Cart.addItem(req.user.id, Number(productId), Number(quantity));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    successResponse(res, { items, total: Number(total.toFixed(2)), count }, 'Item added to your bag.');
  } catch (error) {
    logger.error('Cart add error:', { message: error.message });
    errorResponse(res, 'We could not add that item to your bag.', 500);
  }
});

// PUT /api/cart/update — update item quantity
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity < 1) {
      return errorResponse(res, 'Choose an item and a valid quantity first.', 400);
    }
    const items = await Cart.updateQuantity(req.user.id, Number(productId), Number(quantity));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    successResponse(res, { items, total: Number(total.toFixed(2)), count }, 'Bag updated.');
  } catch (error) {
    logger.error('Cart update error:', { message: error.message });
    errorResponse(res, 'We could not update your bag.', 500);
  }
});

// DELETE /api/cart/remove/:productId — remove item from cart
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const items = await Cart.removeItem(req.user.id, Number(req.params.productId));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    successResponse(res, { items, total: Number(total.toFixed(2)), count }, 'Item removed from your bag.');
  } catch (error) {
    logger.error('Cart remove error:', { message: error.message });
    errorResponse(res, 'We could not remove that item from your bag.', 500);
  }
});

// DELETE /api/cart/clear — clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    await Cart.clearCart(req.user.id);
    successResponse(res, { items: [], total: 0, count: 0 }, 'Bag emptied.');
  } catch (error) {
    logger.error('Cart clear error:', { message: error.message });
    errorResponse(res, 'We could not empty your bag.', 500);
  }
});

// GET /api/cart/count — get cart item count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const count = Number(await Cart.getItemCount(req.user.id));
    successResponse(res, { count }, 'Bag count loaded.');
  } catch (error) {
    logger.error('Cart count error:', { message: error.message });
    errorResponse(res, 'We could not load the bag count.', 500);
  }
});

module.exports = router;
