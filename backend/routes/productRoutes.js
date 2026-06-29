/**
 * Product Routes
 *
 * Public routes: product listing, detail retrieval, categories.
 * Protected routes: product creation, update, deletion (admin only).
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// GET /api/products — list with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const result = await Product.findAll({
      category,
      search,
      page: Number(page),
      limit: Number(limit),
    });
    successResponse(res, result, 'Catalog loaded.');
  } catch (error) {
    logger.error('Product list error:', { message: error.message });
    errorResponse(res, 'We could not load the catalog.', 500);
  }
});

// GET /api/products/categories
router.get('/categories', async (_req, res) => {
  try {
    const categories = await Product.getCategories();
    successResponse(res, categories, 'Aisles loaded.');
  } catch (error) {
    logger.error('Categories error:', { message: error.message });
    errorResponse(res, 'We could not load the aisles.', 500);
  }
});

// GET /api/products/:id — single product detail
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, 'That item is not available.', 404);
    }
    successResponse(res, product, 'Item loaded.');
  } catch (error) {
    logger.error('Product detail error:', { message: error.message });
    errorResponse(res, 'We could not load that item.', 500);
  }
});

module.exports = router;
