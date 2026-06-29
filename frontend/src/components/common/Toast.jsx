/**
 * Toast Notification Wrapper
 *
 * Re-exports react-hot-toast with preconfigured styling.
 * Centralizes toast configuration for consistent notifications.
 */

import { Toaster } from 'react-hot-toast';

function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#27150f',
          color: '#f8fafc',
          fontSize: '0.9rem',
          borderRadius: '0.5rem',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#15803d', secondary: '#f8fafc' },
        },
        error: {
          iconTheme: { primary: '#be123c', secondary: '#f8fafc' },
        },
      }}
    />
  );
}

export default ToastContainer;
