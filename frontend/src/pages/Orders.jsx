/**
 * Orders Page
 *
 * Displays user order history with status tracking.
 */

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiPackage, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

function Orders() {
  const [orders] = useState([]);
  const location = useLocation();
  const redirectStatus = new URLSearchParams(location.search).get('redirect_status');
  const paymentStatus = location.state?.paymentStatus || (redirectStatus ? (redirectStatus === 'succeeded' ? 'success' : 'failed') : null);

  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success('Payment completed successfully.');
    } else if (paymentStatus === 'failed') {
      toast.error('Payment did not complete.');
    }
  }, [paymentStatus]);

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <h1>Your purchases</h1>
        {paymentStatus === 'success' && (
          <div className="payment-success-banner">
            <strong>Transaction successful.</strong>
            <span>Your test checkout completed and the cart was cleared.</span>
          </div>
        )}
        {paymentStatus === 'failed' && (
          <div className="payment-success-banner" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
            <strong>Transaction incomplete.</strong>
            <span>Please return to checkout and try again.</span>
          </div>
        )}
        <div className="orders-empty">
          <FiPackage size={64} className="orders-empty-icon" />
          <h2>No purchase history yet</h2>
          <p>Once you check out, order updates and tracking notes will live here.</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            <FiShoppingCart /> Browse the catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>Your purchases</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <span className="order-number">Purchase #{order.order_number}</span>
              <span className={`order-status status-${order.status}`}>{order.status}</span>
            </div>
            <div className="order-details">
              <span>Paid: ${Number(order.total).toFixed(2)}</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
