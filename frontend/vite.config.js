import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

/**
 * Vite Configuration
 *
 * - Proxy API requests to the backend server (avoids CORS during development)
 * - React plugin for JSX transformation and Fast Refresh
 * - HTTPS support for WebAuthn/FIDO2 biometric authentication (optional)
 */
const keyPath = path.resolve(__dirname, 'localhost+1-key.pem');
const certPath = path.resolve(__dirname, 'localhost+1.pem');

const httpsConfig = fs.existsSync(keyPath) && fs.existsSync(certPath) ? {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
} : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: httpsConfig,
    // Allow ngrok (and any) tunnel hostnames to reach the Vite dev server.
    // Without this, Vite rejects requests from unrecognized hostnames,
    // which surfaces to ngrok as a broken/incomplete response (ERR_NGROK_3004).
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
