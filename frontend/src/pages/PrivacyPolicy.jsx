/**
 * Privacy Policy Page
 */

import { FiShield, FiLock, FiEye, FiDatabase, FiBell, FiCreditCard } from 'react-icons/fi';

function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <div className="policy-header">
        <FiShield size={48} />
        <h1>Privacy notes</h1>
        <p>A plain-language look at what ShieldCart collects, protects, and lets you control.</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <h2><FiDatabase /> What we collect</h2>
          <p>We ask for the details required to run the shop, such as your name, email, delivery address, and payment information. We do not package up personal data for sale.</p>
        </section>

        <section className="policy-section">
          <h2><FiLock /> How we protect it</h2>
          <p>Stored information and network traffic are encrypted, passwords are hashed with bcrypt using a 12-round work factor, and Stripe processes payment details outside our servers.</p>
        </section>

        <section className="policy-section">
          <h2><FiEye /> Your choices</h2>
          <p>You can ask to view, update, or delete your personal information. Message support and we will respond to privacy requests within 72 hours.</p>
        </section>

        <section className="policy-section">
          <h2><FiShield /> Security practices</h2>
          <ul>
            <li>Encrypted HTTPS connections across the app</li>
            <li>Security badges and trust indicators on key pages</li>
            <li>Authentication notifications for trusted logins and device changes</li>
            <li>Secure payment confirmation messages during checkout</li>
            <li>PCI DSS-aligned payment handling through Stripe</li>
            <li>FIDO2/WebAuthn support for passkey-style access</li>
            <li>Ongoing security reviews and penetration testing</li>
            <li>JWT-backed session handling</li>
            <li>Controls for CSRF, XSS, and SQL injection risks</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2><FiCreditCard /> Digital payment trust</h2>
          <p>
            We show confirmation steps before a payment is finalized so you can review
            what is happening, where it is happening, and which protections are in place.
            Payment details are tokenized by Stripe, which reduces exposure of card data.
          </p>
        </section>

        <section className="policy-section">
          <h2><FiBell /> Trust notifications</h2>
          <p>
            When we recognize a new device, a suspicious login pattern, or a successful
            protected checkout, we surface that information clearly so you understand the
            status of your account and transaction.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
