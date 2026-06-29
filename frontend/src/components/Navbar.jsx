/**
 * Navigation Bar Component
 *
 * Responsive top navigation with:
 * - Brand logo with security indicator
 * - Navigation links (conditional on auth state)
 * - Search bar (expandable on mobile)
 * - Bag icon with item count badge
 * - User dropdown menu
 * - Mobile hamburger menu
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShoppingBag,
  FiUser,
  FiMenu,
  FiX,
  FiSearch,
  FiLogOut,
  FiPackage,
  FiShield,
  FiChevronDown,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <FiShield className="brand-icon" />
          <span className="brand-text">ShieldCart</span>
        </Link>

        {/* Desktop Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <FiSearch className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Find trusted picks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          <Link to="/products" className="nav-link">Catalog</Link>
          <Link to="/about" className="nav-link">Our Story</Link>

          {isAuthenticated ? (
            <>
              <Link to="/cart" className="nav-link cart-link">
                <FiShoppingBag />
                <span className="cart-badge">{cartCount}</span>
              </Link>

              <div className="user-dropdown-wrapper">
                <button
                  className="user-dropdown-trigger"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <div className="user-avatar">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <FiChevronDown className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <span className="dropdown-email">{user?.email}</span>
                      <span className="dropdown-role">{user?.role || 'Shopper'}</span>
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      to="/orders"
                      className="dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <FiPackage /> Order Hub
                    </Link>
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <FiUser /> Account Details
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      <FiLogOut /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm nav-register-btn">
                Start shopping
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open navigation menu"
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <form className="mobile-search" onSubmit={handleSearch}>
            <FiSearch className="navbar-search-icon" />
            <input
              type="text"
              placeholder="Find trusted picks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <Link to="/products" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Catalog
          </Link>
          <Link to="/about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Our Story
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/cart" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FiShoppingBag /> Bag
              </Link>
              <Link to="/orders" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FiPackage /> Purchases
              </Link>
              <Link to="/profile" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FiUser /> Account Details
              </Link>
              <div className="mobile-divider" />
              <button className="mobile-link mobile-logout" onClick={handleLogout}>
                <FiLogOut /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/register" className="mobile-link mobile-register" onClick={() => setMobileMenuOpen(false)}>
                Start shopping
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
