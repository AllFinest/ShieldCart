/**
 * Footer Component
 *
 * Multi-column footer with trust indicators, navigation,
 * contact information, and security badges.
 */

import { Link } from 'react-router-dom';
import {
  FiShield,
  FiLock,
  FiCreditCard,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGithub,
} from 'react-icons/fi';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col">
            <div className="footer-brand">
              <FiShield className="footer-brand-icon" />
              <span>ShieldCart</span>
            </div>
            <p className="footer-brand-desc">
              Shop with less second-guessing. Device-aware sign-in, layered
              safeguards, and encrypted checkout keep the experience calm.
            </p>
            <div className="footer-social">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FiGithub />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/products">Catalog</Link></li>
              <li><Link to="/about">Meet ShieldCart</Link></li>
              <li><Link to="/cart">Your Bag</Link></li>
              <li><Link to="/orders">Past Purchases</Link></li>
            </ul>
          </div>

          {/* Need Help? */}
          <div className="footer-col">
            <h4>Need Help?</h4>
            <ul>
              <li><Link to="/privacy-policy">Privacy Notes</Link></li>
              <li><Link to="/security">Safety Center</Link></li>
              <li><Link to="/about#contact">Talk to Support</Link></li>
              <li><Link to="/about#faq">Common Questions</Link></li>
            </ul>
          </div>

          {/* Reach Us Info */}
          <div className="footer-col">
            <h4>Reach Us</h4>
            <ul className="footer-contact">
              <li><FiMail /> hello@shieldcart.com</li>
              <li><FiPhone /> +1 (555) 123-4567</li>
              <li><FiMapPin /> 42 Cipher Lane, Digital City</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="footer-trust">
        <div className="footer-trust-inner">
          <div className="footer-trust-badge">
            <FiLock /> TLS Locked
          </div>
          <div className="footer-trust-badge">
            <FiCreditCard /> Payment Ready
          </div>
          <div className="footer-trust-badge">
            <FiShield /> Passkey Friendly
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ShieldCart. Built with care.</p>
        <p className="footer-bottom-note">
          Strong privacy controls for your sign-ins, purchases, and personal details.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
