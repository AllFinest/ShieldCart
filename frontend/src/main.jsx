/**
 * Application Entry Point
 *
 * Renders the root React component into the DOM.
 * StrictMode enables additional development checks for:
 * - Detecting unsafe lifecycle methods
 * - Warning about deprecated API usage
 * - Detecting unexpected side effects
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
