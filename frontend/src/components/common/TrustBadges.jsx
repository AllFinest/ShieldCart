/**
 * Trust Badges Component
 *
 * Displays customer-facing trust indicators that reinforce secure browsing,
 * privacy protection, and payment confidence.
 */

import { FiShield, FiLock, FiCreditCard, FiCheck, FiBell, FiFileText } from 'react-icons/fi';

const badgeSets = {
  default: [
    { icon: <FiLock />, label: 'HTTPS Secure', detail: 'encrypted connection' },
    { icon: <FiShield />, label: 'Security Badges', detail: 'visible protections' },
    { icon: <FiFileText />, label: 'Privacy Policy', detail: 'clear data practices' },
    { icon: <FiBell />, label: 'Auth Alerts', detail: 'login notifications' },
    { icon: <FiCreditCard />, label: 'Safe Payments', detail: 'secure confirmation' },
    { icon: <FiCheck />, label: 'Trust Checked', detail: 'device signals' },
  ],
  checkout: [
    { icon: <FiLock />, label: 'HTTPS Secure', detail: 'checkout traffic is encrypted' },
    { icon: <FiCreditCard />, label: 'Secure Payment', detail: 'Stripe handles confirmation' },
    { icon: <FiShield />, label: 'Privacy First', detail: 'card data stays tokenized' },
  ],
  auth: [
    { icon: <FiShield />, label: 'Trusted Login', detail: 'device and session checks' },
    { icon: <FiBell />, label: 'Auth Notifications', detail: 'clear sign-in alerts' },
    { icon: <FiLock />, label: 'HTTPS Secure', detail: 'every login is encrypted' },
  ],
};

function TrustBadges({ variant = 'horizontal', set = 'default' }) {
  const badges = badgeSets[set] || badgeSets.default;

  return (
    <div className={`trust-badges-container trust-badges-${variant}`}>
      {badges.map((badge) => (
        <div key={`${badge.label}-${badge.detail}`} className="trust-badge-item">
          <span className="trust-badge-icon">{badge.icon}</span>
          <div className="trust-badge-text">
            <span className="trust-badge-label">{badge.label}</span>
            <span className="trust-badge-detail">{badge.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TrustBadges;
