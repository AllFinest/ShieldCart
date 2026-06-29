import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiShield, FiCreditCard, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import TrustBadges from '../components/common/TrustBadges';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/checkout/StripePaymentForm';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
const forceMockPayment = import.meta.env.VITE_FORCE_MOCK_PAYMENT === 'true';

function Checkout() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [shipping, setShipping] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCart() {
      try {
        const response = await api.get('/cart');
        const data = response.data.data;
        if (!data.items || data.items.length === 0) {
          navigate('/cart');
          return;
        }
        setItems(data.items);
        setTotal(data.total);
      } catch {
        toast.error('We could not open your bag just now');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, [navigate]);

  const handleShippingChange = (field) => (e) => {
    setShipping((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const shippingCost = total >= 50 ? 0 : 5.99;
  const tax = Number((total * 0.08).toFixed(2));
  const grandTotal = Number((total + shippingCost + tax).toFixed(2));

  const useMockPayment = Boolean(
    forceMockPayment || paymentIntent?.testMode || !stripePublishableKey
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shipping.fullName || !shipping.address || !shipping.city || !shipping.zip) {
      toast.error('Fill in the required delivery details first');
      return;
    }
    setProcessing(true);
    try {
      const response = await api.post(API_ENDPOINTS.PAYMENTS.CREATE_INTENT, {
        amount: grandTotal,
        shipping,
      });
      const intent = response.data?.data;
      if (!intent?.clientSecret) throw new Error('Payment response missing client secret');
      setPaymentIntent(intent);
      toast.success('Secure payment session created. Please enter your payment details.');
    } catch (error) {
      const message = error.response?.data?.message || 'The payment step did not finish. Please try again.';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  function renderPaymentForm() {
    if (!paymentIntent?.clientSecret) return null;
    if (useMockPayment) {
      return <StripePaymentForm grandTotal={grandTotal} testMode />;
    }
    // No options.clientSecret on Elements — CardElement API does not use it
    return (
      <Elements stripe={stripePromise}>
        <StripePaymentForm grandTotal={grandTotal} clientSecret={paymentIntent.clientSecret} />
      </Elements>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Setting up protected checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Protected checkout</h1>
      <div className="checkout-trust-badges">
        <TrustBadges variant="horizontal" set="checkout" />
      </div>
      <div className="checkout-layout">

        {/* Left column — shipping form and payment form are SEPARATE, never nested */}
        <div className="checkout-form">

          {/* STEP 1 — Shipping details (its own form, closes before payment renders) */}
          <form onSubmit={handleSubmit}>
            <div className="checkout-section">
              <h3>Delivery details</h3>
              <div className="form-group">
                <label htmlFor="fullName">Recipient name</label>
                <input id="fullName" type="text" value={shipping.fullName} onChange={handleShippingChange('fullName')} placeholder="Alex Rivera" required />
              </div>
              <div className="form-group">
                <label htmlFor="address">Street address</label>
                <input id="address" type="text" value={shipping.address} onChange={handleShippingChange('address')} placeholder="42 Market Street" required />
              </div>
              <div className="form-row-grid">
                <div className="form-group">
                  <label htmlFor="city">Town or city</label>
                  <input id="city" type="text" value={shipping.city} onChange={handleShippingChange('city')} placeholder="Seattle" required />
                </div>
                <div className="form-group">
                  <label htmlFor="state">State / region</label>
                  <input id="state" type="text" value={shipping.state} onChange={handleShippingChange('state')} placeholder="WA" />
                </div>
              </div>
              <div className="form-row-grid">
                <div className="form-group">
                  <label htmlFor="zip">Postal code</label>
                  <input id="zip" type="text" value={shipping.zip} onChange={handleShippingChange('zip')} placeholder="98101" required />
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country / region</label>
                  <select id="country" value={shipping.country} onChange={handleShippingChange('country')}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>
            {!paymentIntent?.clientSecret && (
              <button type="submit" className="btn btn-primary btn-lg btn-place-order" disabled={processing}>
                {processing ? 'Preparing...' : 'Continue to Payment'}
              </button>
            )}
          </form>
          {/* Shipping form ends here — payment form is completely outside it */}

          {/* STEP 2 — Payment (separate section, no nesting) */}
          <div className="checkout-section" style={{ marginTop: '1.5rem' }}>
            <h3><FiCreditCard /> Payment step</h3>
            {paymentIntent?.clientSecret ? (
              renderPaymentForm()
            ) : (
              <div className="payment-placeholder">
                <FiShield size={32} />
                <p>Complete delivery details to proceed to payment</p>
                <span className="payment-note">Nothing will be charged until you finalize the order.</span>
              </div>
            )}
          </div>

        </div>

        {/* Right column — order summary */}
        <div className="checkout-summary">
          <h3>Checkout summary</h3>
          <div className="checkout-items">
            {items.map((item) => (
              <div key={item.product_id} className="checkout-item">
                <span className="checkout-item-name">{item.name} × {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-divider" />
          <div className="summary-row">
            <span>Items total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{shippingCost === 0 ? 'Included' : `$${shippingCost.toFixed(2)}`}</span>
          </div>
          <div className="summary-row">
            <span>Estimated tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Amount due</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <div className="checkout-trust">
            <FiShield />
            <span>Encrypted transport protects this checkout and payment confirmation.</span>
          </div>
          <Link to="/cart" className="btn btn-outline btn-sm">
            <FiArrowLeft /> Back to bag
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Checkout;
