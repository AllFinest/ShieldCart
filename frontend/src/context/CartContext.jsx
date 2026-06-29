/**
 * Cart Context
 *
 * Global cart state with count tracking for the navbar badge.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const CartContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    try {
      const response = await api.get('/cart/count');
      setCartCount(Number(response.data.data.count) || 0);
    } catch {
      // Not authenticated or server unavailable
    }
  }, []);

  const updateCartCount = useCallback((count) => {
    setCartCount(count);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
