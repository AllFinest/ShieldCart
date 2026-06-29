/**
 * Product Detail Page
 *
 * Full product view with description, ratings, quantity selector,
 * add-to-cart, and trust badges.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiShield, FiTruck, FiRefreshCw, FiMinus, FiPlus, FiArrowLeft, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { featuredProducts } from '../data/mockData';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { isAuthenticated } = useAuth();
  const { refreshCartCount } = useCart();

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      setLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.PRODUCTS.DETAIL(id));
        const data = response.data.data;
        if (isMounted) {
          if (data && data.name) {
            setProduct(data);
          } else {
            setProduct(null);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        if (error.response?.status === 404) {
          setProduct(null);
          return;
        }

        const mock = featuredProducts.find((p) => p.id === Number(id));
        setProduct(mock || null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Log in first so we can save this to your bag');
      return;
    }
    setAddingToCart(true);
    try {
      await api.post(API_ENDPOINTS.CART.ADD, { productId: product.id, quantity });
      toast.success(`${product.name} is now in your bag`);
      refreshCartCount();
    } catch {
      toast.error('That item did not make it into your bag. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-loading">
          <div className="loading-spinner" />
          <p>Bringing up the item details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-not-found">
          <h2>Item slipped out of view</h2>
          <p>That product is not available right now.</p>
          <Link to="/products" className="btn btn-primary">
            <FiArrowLeft /> Return to catalog
          </Link>
        </div>
      </div>
    );
  }

  const stockQty = product.stock_quantity || product.stockQuantity || 50;
  const inStock = stockQty > 0;
  const rating = Number(product.rating);
  const reviewCount = product.review_count || product.reviewCount || 0;

  return (
    <div className="product-detail-page">
      <div className="product-detail-breadcrumb">
        <Link to="/">Start</Link>
        <span>/</span>
        <Link to="/products">Catalog</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-detail-content">
        <div className="product-detail-image">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="product-detail-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="product-detail-placeholder"
            style={{ backgroundColor: product.color || '#b45309', display: product.image_url ? 'none' : 'flex' }}
          >
            <span>{product.name.charAt(0)}</span>
          </div>
          {product.badge && (
            <span className={`product-badge badge-${product.badge.toLowerCase().replace(' ', '-')}`}>
              {product.badge}
            </span>
          )}
        </div>

        <div className="product-detail-info">
          <span className="product-detail-category">
            {product.category || product.category_name}
          </span>
          <h1>{product.name}</h1>

          {/* Verified & Trusted Seller badges */}
          <div className="product-trust-badges">
            <span className="product-trust-badge verified">
              <FiCheck /> Verified
            </span>
            <span className="product-trust-badge trusted-seller">
              <FiShield /> Trusted Seller
            </span>
          </div>

          <div className="product-detail-rating">
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar key={star} className={star <= Math.floor(rating) ? 'star-filled' : 'star-empty'} />
              ))}
            </div>
            <span className="rating-text">{rating} ({reviewCount} ratings)</span>
          </div>

          <div className="product-detail-price">
            <span className="detail-price">${Number(product.price).toFixed(2)}</span>
            {(product.originalPrice || product.original_price) && (
              <span className="detail-original-price">
                ${Number(product.originalPrice || product.original_price).toFixed(2)}
              </span>
            )}
          </div>

          <p className="product-detail-description">
            {product.description || 'A dependable everyday item designed with practical materials, careful finishing, and long-use comfort in mind.'}
          </p>

          <div className="product-detail-stock">
            {inStock ? (
              <span className="in-stock">Ready to ship ({stockQty} left)</span>
            ) : (
              <span className="out-of-stock">Currently unavailable</span>
            )}
          </div>

          <div className="product-detail-actions">
            <div className="quantity-selector">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <FiMinus />
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stockQty, quantity + 1))}
                disabled={quantity >= stockQty}
              >
                <FiPlus />
              </button>
            </div>
            <button
              className="btn btn-primary btn-lg btn-add-cart-detail"
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
            >
              {addingToCart ? 'Adding now...' : <><FiShoppingCart /> Add to bag</>}
            </button>
          </div>

          <div className="product-detail-trust">
            <div className="trust-item">
              <FiShield /> Protected payment
            </div>
            <div className="trust-item">
              <FiTruck /> Free delivery past $50
            </div>
            <div className="trust-item">
              <FiRefreshCw /> 30-day return window
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
