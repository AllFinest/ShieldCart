/**
 * Cart Page
 *
 * Displays cart items with quantity controls, removal, totals,
 * and secure checkout button.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShield, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';

function Cart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { refreshCartCount } = useCart();

  useEffect(() => {
    let cancelled = false;
    async function loadCart() {
      try {
        const response = await api.get(API_ENDPOINTS.CART.GET);
        if (cancelled) return;
        const data = response.data.data;
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch {
        if (!cancelled) toast.error('We could not open your bag just now');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCart();
    return () => { cancelled = true; };
  }, []);

  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await api.put(API_ENDPOINTS.CART.UPDATE, { productId, quantity });
      const data = response.data.data;
      setItems(data.items);
      setTotal(data.total);
      refreshCartCount();
    } catch {
      toast.error('Quantity update did not go through');
    }
  };

  const removeItem = async (productId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.CART.REMOVE(productId));
      const data = response.data.data;
      setItems(data.items);
      setTotal(data.total);
      refreshCartCount();
      toast.success('Item removed from your bag');
    } catch {
      toast.error('We could not remove that item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete(API_ENDPOINTS.CART.CLEAR);
      setItems([]);
      setTotal(0);
      refreshCartCount();
      toast.success('Your bag is empty now');
    } catch {
      toast.error('We could not empty your bag');
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">
          <div className="loading-spinner" />
          <p>Loading your bag...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <FiShoppingCart size={64} className="cart-empty-icon" />
          <h2>Your bag is waiting</h2>
          <p>Browse the catalog and tuck away anything that catches your eye.</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            <FiArrowLeft /> Keep browsing
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = total >= 50 ? 0 : 5.99;
  const tax = Number((total * 0.08).toFixed(2));
  const grandTotal = Number((total + shippingCost + tax).toFixed(2));

  return (
    <div className="cart-page">
      <h1>Your shopping bag</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.product_id} className="cart-item">
              <div
                className="cart-item-image"
                style={{ backgroundColor: '#b45309' }}
              >
                <span>{item.name.charAt(0)}</span>
              </div>
              <div className="cart-item-info">
                <Link to={`/products/${item.product_id}`} className="cart-item-name">
                  {item.name}
                </Link>
                <span className="cart-item-price">${Number(item.price).toFixed(2)}</span>
              </div>
              <div className="cart-item-quantity">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <FiMinus />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                  <FiPlus />
                </button>
              </div>
              <span className="cart-item-total">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button className="cart-item-remove" onClick={() => removeItem(item.product_id)}>
                <FiTrash2 />
              </button>
            </div>
          ))}
          <div className="cart-actions">
            <Link to="/products" className="btn btn-outline">
              <FiArrowLeft /> Keep browsing
            </Link>
            <button className="btn btn-outline btn-danger" onClick={clearCart}>
              Empty bag
            </button>
          </div>
        </div>

        <div className="cart-summary">
          <h3>Bag summary</h3>
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
          <Link to="/checkout" className="btn btn-primary btn-lg btn-checkout">
            Go to protected checkout
          </Link>
          <div className="cart-trust">
            <FiShield />
            <span>Encrypted transport helps protect checkout.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
