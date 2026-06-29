/**
 * Featured Products Section
 *
 * Displays a grid of featured product cards on the homepage.
 * Uses mock data until the product API is implemented.
 */

import { Link } from 'react-router-dom';
import { FiStar, FiShoppingCart } from 'react-icons/fi';
import { featuredProducts } from '../../data/mockData';

function StarRating({ rating }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={star <= Math.floor(rating) ? 'star-filled' : 'star-empty'}
        />
      ))}
      <span className="rating-value">{rating}</span>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="product-card">
      {product.badge && (
        <span className={`product-badge badge-${product.badge.toLowerCase().replace(' ', '-')}`}>
          {product.badge}
        </span>
      )}
      <Link to={`/products/${product.id}`} className="product-image-link">
        <div
          className="product-image-placeholder"
          style={{ backgroundColor: product.color }}
        >
          <span className="product-image-text">{product.name.charAt(0)}</span>
        </div>
      </Link>
      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <Link to={`/products/${product.id}`} className="product-name">
          {product.name}
        </Link>
        <StarRating rating={product.rating} />
        <span className="review-count">({product.reviewCount} ratings)</span>
        <div className="product-price-row">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="product-original-price">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <button className="btn btn-primary btn-sm btn-add-cart">
          <FiShoppingCart /> Add to bag
        </button>
      </div>
    </div>
  );
}

function FeaturedProducts() {
  return (
    <section className="featured-products-section">
      <div className="section-header">
        <h2>Worth a closer look</h2>
        <p className="section-subtitle">Fresh picks selected for secure, everyday shopping</p>
        <Link to="/products" className="section-view-all">
          See the full catalog &rarr;
        </Link>
      </div>
      <div className="products-grid">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;
