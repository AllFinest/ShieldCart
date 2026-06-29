/**
 * Loading Spinner
 *
 * Reusable loading indicator for async operations.
 */

function LoadingSpinner({ message = 'One moment...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
