/**
 * About Us Page
 *
 * Company overview, mission, vision, security commitment,
 * payment security explanation, and contact information.
 */

import {
  FiShield,
  FiTarget,
  FiEye,
  FiLock,
  FiCreditCard,
  FiSmartphone,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
} from 'react-icons/fi';

function About() {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <h1>Inside ShieldCart</h1>
        <p>
          We are shaping online shopping to feel clear, protected, and
          refreshingly easy to trust.
        </p>
      </section>

      {/* Company Overview */}
      <section className="about-section">
        <div className="about-grid-2">
          <div>
            <h2><FiShield className="about-icon" /> What we are building</h2>
            <p>
              ShieldCart began as a university research build focused on secure
              commerce, trusted device signals, and passkey-style authentication.
              The project demonstrates how stronger safeguards can blend into
              a familiar retail experience.
            </p>
            <p>
              Our stance is simple: protection should lower friction, not add
              chores. Each interaction is designed to feel useful, approachable,
              and grounded in Technology Acceptance Model (TAM) thinking.
            </p>
          </div>
          <div className="about-stats">
            <div className="stat-card">
              <span className="stat-number">256-bit</span>
              <span className="stat-label">TLS Encryption</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">FIDO2</span>
              <span className="stat-label">Passkey Standard</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">PCI DSS</span>
              <span className="stat-label">Checkout Compliance</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">12</span>
              <span className="stat-label">bcrypt Work Factor</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-section about-section-alt">
        <div className="about-grid-2">
          <div className="mission-card">
            <FiTarget className="mission-icon" />
            <h3>Our Purpose</h3>
            <p>
              To make online buying feel straightforward and trustworthy by pairing
              device-aware security, passkey-ready access, and layered defenses
              with a store people can use without hesitation.
            </p>
          </div>
          <div className="mission-card">
            <FiEye className="mission-icon" />
            <h3>Where We Are Headed</h3>
            <p>
              To show a version of e-commerce where safety feels natural: identity,
              payment details, and personal data stay guarded while the customer
              journey remains clean and convenient.
            </p>
          </div>
        </div>
      </section>

      {/* Security Commitment */}
      <section className="about-section">
        <h2 className="section-center-title">
          <FiLock className="about-icon" /> How we keep the store safer
        </h2>
        <div className="security-features">
          <div className="security-feature">
            <FiSmartphone className="sf-icon" />
            <h4>Passkey-Friendly Sign-In</h4>
            <p>
              WebAuthn/FIDO2 support lets compatible devices prove identity without
              sending biometric data away. The server receives cryptographic
              confirmation, not your fingerprint.
            </p>
          </div>
          <div className="security-feature">
            <FiCreditCard className="sf-icon" />
            <h4>Checkout Protection</h4>
            <p>
              Stripe manages card processing under PCI DSS Level 1 controls. Card
              details are tokenized and encrypted by Stripe rather than stored
              in this application.
            </p>
          </div>
          <div className="security-feature">
            <FiShield className="sf-icon" />
            <h4>Device Confidence</h4>
            <p>
              Device signals and trust scores help recognize familiar sessions.
              Unusual patterns can prompt extra checks before access continues.
            </p>
          </div>
          <div className="security-feature">
            <FiLock className="sf-icon" />
            <h4>Data Safeguards</h4>
            <p>
              Passwords are protected with bcrypt using a 12-round work factor,
              traffic runs over HTTPS, and defensive query handling plus input
              cleanup reduce injection and scripting risks.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="about-section about-section-alt">
        <h2 className="section-center-title">Our privacy baseline</h2>
        <div className="privacy-list">
          {[
            'Your personal information is not sold to outside companies',
            'Stored records and network traffic are both encrypted',
            'You may ask us to remove your account data whenever needed',
            'We keep collection limited to what the store actually needs',
            'CSRF defenses help block unwanted actions from other sites',
            'Rate limits slow repeated attempts against account access',
          ].map((item, i) => (
            <div key={i} className="privacy-item">
              <FiCheckCircle className="privacy-check" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="about-section" id="contact">
        <h2 className="section-center-title">Get in touch</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <FiMail className="contact-icon" />
            <h4>Inbox</h4>
            <p>hello@shieldcart.com</p>
          </div>
          <div className="contact-card">
            <FiPhone className="contact-icon" />
            <h4>Call</h4>
            <p>+1 (555) 123-4567</p>
          </div>
          <div className="contact-card">
            <FiMapPin className="contact-icon" />
            <h4>Visit</h4>
            <p>42 Cipher Lane, Digital City</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
