/**
 * Products Catalog Page
 *
 * Product grid with search, category filtering, and add-to-cart.
 * Fetches from API with fallback to mock data.
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiStar, FiShoppingCart, FiFilter, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { featuredProducts, categories as fallbackCategories } from '../data/mockData';

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuth();
  const { refreshCartCount } = useCart();

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      setCategoriesLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.PRODUCTS.CATEGORIES);
        const data = response.data.data;
        if (isMounted && Array.isArray(data) && data.length) {
          setCategoryOptions(data);
        }
      } catch {
        if (isMounted) {
          setCategoryOptions(fallbackCategories);
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      setLoading(true);
      try {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        if (searchQuery) params.search = searchQuery;
        const response = await api.get(API_ENDPOINTS.PRODUCTS.LIST, { params });
        const data = response.data.data;
        if (isMounted) {
          setProducts(data.products?.length ? data.products : featuredProducts);
        }
      } catch {
        if (isMounted) {
          setProducts(featuredProducts);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [activeCategory, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchParams(q ? { search: q } : {});
  };

  const handleCategoryClick = (slug) => {
    const next = activeCategory === slug ? '' : slug;
    setActiveCategory(next);
    setSearchParams(next ? { category: next } : {});
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.error('Log in first so we can save this to your bag');
      return;
    }
    try {
      await api.post(API_ENDPOINTS.CART.ADD, { productId: product.id, quantity: 1 });
      toast.success(`${product.name} is now in your bag`);
      refreshCartCount();
    } catch {
      toast.error('That item did not make it into your bag. Please try again.');
    }
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="products-header-content">
          <h1>Catalog</h1>
          <p>Explore practical picks with safety-minded checkout built in</p>
        </div>
        <form className="products-search" onSubmit={handleSearch}>
          <FiSearch className="products-search-icon" />
          <input
            type="text"
            placeholder="Search items or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); setSearchParams({}); }}>
              <FiX />
            </button>
          )}
        </form>
      </div>

      <div className="products-layout">
        {/* Sidebar Filters */}
        <aside className={`products-sidebar ${showFilters ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Shop aisles</h3>
            <button className="sidebar-close" onClick={() => setShowFilters(false)}>
              <FiX />
            </button>
          </div>
          <ul className="category-list">
            <li>
              <button
                className={`category-btn ${!activeCategory ? 'active' : ''}`}
                onClick={() => handleCategoryClick('')}
              >
                Everything
              </button>
            </li>
            {categoriesLoading ? (
              <li>
                <button className="category-btn" disabled>
                  Loading aisles...
                </button>
              </li>
            ) : (
              categoryOptions.map((cat) => (
                <li key={cat.id}>
                  <button
                    className={`category-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat.slug)}
                  >
                    {cat.name}
                    <span className="cat-count">{cat.count}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        {/* Product Grid */}
        <div className="products-main">
          <div className="products-toolbar">
            <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <FiFilter /> Filter
            </button>
            <span className="product-count">{products.length} items</span>
          </div>

          {loading ? (
            <div className="products-loading">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card skeleton" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <h3>No matching items yet</h3>
              <p>Try a new keyword or hop into a different aisle.</p>
            </div>
          ) : (
            <div className="products-grid catalog-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  {product.badge && (
                    <span className={`product-badge badge-${product.badge.toLowerCase().replace(' ', '-')}`}>
                      {product.badge}
                    </span>
                  )}
                  <Link to={`/products/${product.id}`} className="product-image-link">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="product-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="product-image-placeholder"
                      style={{ backgroundColor: product.color || '#b45309', display: product.image_url ? 'none' : 'flex' }}
                    >
                      <span className="product-image-text">{product.name.charAt(0)}</span>
                    </div>
                  </Link>
                  <div className="product-card-body">
                    <span className="product-category">{product.category || product.category_name}</span>
                    <Link to={`/products/${product.id}`} className="product-name">
                      {product.name}
                    </Link>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar key={star} className={star <= Math.floor(product.rating) ? 'star-filled' : 'star-empty'} />
                      ))}
                      <span className="rating-value">{product.rating}</span>
                    </div>
                    <span className="review-count">({product.reviewCount || product.review_count} ratings)</span>
                    <div className="product-price-row">
                      <span className="product-price">${Number(product.price).toFixed(2)}</span>
                      {(product.originalPrice || product.original_price) && (
                        <span className="product-original-price">
                          ${Number(product.originalPrice || product.original_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-sm btn-add-cart"
                      onClick={() => handleAddToCart(product)}
                    >
                      <FiShoppingCart /> Add to bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
