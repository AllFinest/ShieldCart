/**
 * Hero Section
 *
 * Landing page hero with headline, description, search bar, and CTAs.
 * Designed to immediately communicate trust and security.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShield, FiLock } from 'react-icons/fi';

function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-bg-pattern" />
      <div className="hero-content">
        <div className="hero-badge">
          <FiShield /> Private checkout, zero drama
        </div>
        <h1 className="hero-title">
          Find better goods with <span className="hero-highlight">peace of mind</span>
        </h1>
        <p className="hero-description">
          Browse useful products in a store that takes safety seriously.
          Passkey-ready login, device checks, and protected payments work quietly
          in the background while you shop.
        </p>

        <form className="hero-search" onSubmit={handleSearch}>
          <FiSearch className="hero-search-icon" />
          <input
            type="text"
            placeholder="Search by item, style, or collection"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hero-search-input"
          />
          <button type="submit" className="hero-search-btn">Start search</button>
        </form>

        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary btn-lg">
            Explore the catalog
          </Link>
          <Link to="/register" className="btn btn-outline btn-lg">
            Open your account
          </Link>
        </div>

        <div className="hero-trust-strip">
          <span><FiLock /> Bank-grade TLS encryption</span>
          <span><FiShield /> Passkey-ready access</span>
          <span><FiLock /> PCI-aligned checkout</span>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
