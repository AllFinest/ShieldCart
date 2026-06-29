import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const initialMockCard = {
  nameOnCard: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

function MockStripePaymentForm({ grandTotal }) {
  const [loading, setLoading] = useState(false);
  const [mockCard, setMockCard] = useState(initialMockCard);
  const navigate = useNavigate();

  const updateMockCard = (field) => (e) => {
    setMockCard((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!mockCard.nameOnCard || !mockCard.cardNumber || !mockCard.expiry || !mockCard.cvc) {
      toast.error('Please fill in the mock card details to continue.');
      return;
    }
    setLoading(true);
    try {
      await api.delete('/cart/clear');
    } catch (err) {
      console.error('Failed to clear cart', err);
    }
    toast.success('Transaction successful in test mode!');
    navigate('/orders', { state: { paymentStatus: 'success', paymentMode: 'test' } });
  };

  return (
    <form onSubmit={handlePayment} className="stripe-payment-form">
      <div className="mock-payment-panel">
        <div className="payment-instructions">
          <strong>Mock test checkout</strong>
          <p>Use any Stripe test card details here. A common demo card is <code>4242 4242 4242 4242</code> with any future expiry and any 3-digit CVC.</p>
        </div>
        <div className="mock-card-grid">
          <div className="form-group">
            <label htmlFor="mock-name">Name on card</label>
            <input id="mock-name" type="text" value={mockCard.nameOnCard} onChange={updateMockCard('nameOnCard')} placeholder="Alex Rivera" />
          </div>
          <div className="form-group">
            <label htmlFor="mock-number">Card number</label>
            <input id="mock-number" type="text" inputMode="numeric" value={mockCard.cardNumber} onChange={updateMockCard('cardNumber')} placeholder="4242 4242 4242 4242" />
          </div>
          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="mock-expiry">Expiry</label>
              <input id="mock-expiry" type="text" value={mockCard.expiry} onChange={updateMockCard('expiry')} placeholder="12/34" />
            </div>
            <div className="form-group">
              <label htmlFor="mock-cvc">CVC</label>
              <input id="mock-cvc" type="text" inputMode="numeric" value={mockCard.cvc} onChange={updateMockCard('cvc')} placeholder="123" />
            </div>
          </div>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-place-order" style={{ marginTop: '1.5rem', width: '100%' }}>
        {loading ? 'Processing...' : `Complete Test Payment $${grandTotal.toFixed(2)}`}
      </button>
    </form>
  );
}

function RealStripePaymentForm({ grandTotal, clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async (e) => {
    e.preventDefault();

    // ---- DEBUG LOGS — check browser console ----
    console.log('[Stripe] Pay button clicked');
    console.log('[Stripe] stripe loaded:', !!stripe);
    console.log('[Stripe] elements loaded:', !!elements);
    console.log('[Stripe] clientSecret present:', !!clientSecret);
    console.log('[Stripe] clientSecret value:', clientSecret ? clientSecret.substring(0, 30) + '...' : 'MISSING');
    // -------------------------------------------

    if (!stripe) {
      toast.error('Stripe is still loading. Please wait a moment and try again.');
      return;
    }
    if (!elements) {
      toast.error('Payment fields are still loading. Please try again.');
      return;
    }
    if (!clientSecret) {
      toast.error('Payment session is missing. Please go back and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    console.log('[Stripe] cardElement found:', !!cardElement);

    if (!cardElement) {
      toast.error('Card field not found. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      console.log('[Stripe] Calling stripe.confirmCardPayment...');
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      console.log('[Stripe] Result:', JSON.stringify(result, null, 2));

      if (result.error) {
        console.error('[Stripe] Error:', result.error);
        toast.error(result.error.message || 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        console.log('[Stripe] SUCCESS! PaymentIntent ID:', result.paymentIntent.id);
        try { await api.delete('/cart/clear'); } catch (err) { console.error('Cart clear failed', err); }
        toast.success('Payment completed successfully.');
        navigate('/orders', { state: { paymentStatus: 'success', paymentMode: 'stripe' } });
        return;
      }

      console.warn('[Stripe] Unexpected status:', result.paymentIntent?.status);
      toast.error(`Payment did not complete (status: ${result.paymentIntent?.status || 'unknown'}).`);
      setLoading(false);
    } catch (err) {
      console.error('[Stripe] Exception thrown:', err);
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="stripe-payment-form">
      <div className="payment-instructions">
        <strong>Stripe payment details</strong>
        <p>Enter your card details below. For sandbox testing use <code>4242 4242 4242 4242</code>, any future expiry, and any 3-digit CVC.</p>
      </div>
      <div className="stripe-card-element" style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '12px', marginBottom: '8px' }}>
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
              invalid: { color: '#9e2146' },
            },
          }}
          onReady={() => {
            console.log('[Stripe] CardElement is ready');
            setCardReady(true);
          }}
          onChange={(e) => {
            console.log('[Stripe] Card input — complete:', e.complete, '| error:', e.error?.message || 'none');
          }}
        />
      </div>
      {!cardReady && <p style={{ fontSize: '0.85rem', color: '#666' }}>Loading card field...</p>}
      <button
        type="submit"
        disabled={loading || !stripe || !cardReady}
        className="btn btn-primary btn-lg btn-place-order"
        style={{ marginTop: '1rem', width: '100%' }}
      >
        {loading ? 'Processing payment...' : `Pay $${grandTotal.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function StripePaymentForm({ grandTotal, clientSecret, testMode = false }) {
  if (testMode) {
    return <MockStripePaymentForm grandTotal={grandTotal} />;
  }
  if (!clientSecret) {
    return (
      <div className="payment-instructions">
        <p style={{ color: '#dc2626' }}>Payment session missing. Please go back and try again.</p>
      </div>
    );
  }
  return <RealStripePaymentForm grandTotal={grandTotal} clientSecret={clientSecret} />;
}
