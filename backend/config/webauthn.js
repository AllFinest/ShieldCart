/**
 * WebAuthn / FIDO2 Configuration
 *
 * Defines Relying Party (RP) identity for biometric authentication.
 * The RP ID must match the domain where the application is hosted.
 * In development this is "localhost"; in production it is your domain name.
 */

const webauthnConfig = {
  rpName: process.env.WEBAUTHN_RP_NAME || 'SecureEcommerce',
  rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
  origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
};

module.exports = webauthnConfig;
