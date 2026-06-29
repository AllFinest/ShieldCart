/**
 * Why Shop With Us Section
 *
 * Highlights the platform's security features and trust advantages.
 * Addresses TAM (Technology Acceptance Model) perceived usefulness.
 */

import { FiShield, FiCreditCard, FiSmartphone, FiLock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const features = [
  {
    icon: <FiSmartphone />,
    title: 'Passkey-Ready Login',
    description: 'Use WebAuthn/FIDO2 flows built for fingerprint or device-based access, keeping sign-in quick without leaning only on passwords.',
    color: '#c2410c',
  },
  {
    icon: <FiCreditCard />,
    title: 'Protected Checkout',
    description: 'Stripe handles payment details with tokenization and encryption, so sensitive card data stays outside our application servers.',
    color: '#be123c',
  },
  {
    icon: <FiShield />,
    title: 'Device Trust Checks',
    description: 'Known-device signals and trust scores help separate normal activity from sign-ins that deserve a closer look.',
    color: '#0891b2',
  },
  {
    icon: <FiLock />,
    title: 'Privacy by Default',
    description: 'Personal data travels through encrypted channels, and saved passwords are guarded with bcrypt-based hashing.',
    color: '#ca8a04',
  },
  {
    icon: <FiCheckCircle />,
    title: 'Cleaner Inputs',
    description: 'Forms check and clean incoming values to reduce injection, scripting, and other common web risks.',
    color: '#9333ea',
  },
  {
    icon: <FiAlertTriangle />,
    title: 'Abuse Slowdowns',
    description: 'Request throttles help cool down repeated attempts before they become account-level trouble.',
    color: '#db2777',
  },
];

function WhyShopWithUs() {
  return (
    <section className="why-section">
      <div className="section-header">
        <h2>Why ShieldCart feels different</h2>
        <p className="section-subtitle">
          Easy browsing up front, thoughtful security humming quietly underneath.
        </p>
      </div>
      <div className="why-grid">
        {features.map((feature, index) => (
          <div key={index} className="why-card">
            <div className="why-icon" style={{ color: feature.color, backgroundColor: `${feature.color}15` }}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WhyShopWithUs;
