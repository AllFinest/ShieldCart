/**
 * WebAuthn utility helpers
 *
 * @simplewebauthn/server encodes all binary fields (challenge, credential IDs,
 * user IDs) as base64url strings. The browser WebAuthn API expects raw
 * Uint8Array buffers. These helpers handle the conversion in both directions.
 */

/** Decode a base64url string → Uint8Array */
export function base64urlToUint8Array(base64url) {
  // Convert base64url → base64 standard
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode a Uint8Array → base64url string */
export function uint8ArrayToBase64url(bytes) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Build PublicKeyCredentialCreationOptions from the server response
 * for navigator.credentials.create()
 */
export function buildRegistrationOptions(serverOptions) {
  return {
    challenge: base64urlToUint8Array(serverOptions.challenge),
    rp: {
      id: serverOptions.rp?.id || serverOptions.rpId,
      name: serverOptions.rp?.name || serverOptions.rpName || 'ShieldCart',
    },
    user: {
      id: base64urlToUint8Array(serverOptions.user?.id || btoa(String(serverOptions.userId))),
      name: serverOptions.user?.name || serverOptions.userEmail,
      displayName: serverOptions.user?.displayName || serverOptions.userEmail,
    },
    pubKeyCredParams: serverOptions.pubKeyCredParams || [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 },  // RS256
    ],
    authenticatorSelection: serverOptions.authenticatorSelection || {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred',
      residentKey: 'preferred',
    },
    excludeCredentials: (serverOptions.excludeCredentials || []).map((cred) => ({
      id: base64urlToUint8Array(cred.id),
      type: 'public-key',
      transports: cred.transports || [],
    })),
    timeout: serverOptions.timeout || 60000,
    attestation: serverOptions.attestation || 'none',
  };
}

/**
 * Serialize a PublicKeyCredential from navigator.credentials.create()
 * into a plain object the server can verify
 */
export function serializeRegistrationResponse(credential) {
  return {
    id: credential.id,
    rawId: uint8ArrayToBase64url(credential.rawId),
    response: {
      clientDataJSON: uint8ArrayToBase64url(credential.response.clientDataJSON),
      attestationObject: uint8ArrayToBase64url(credential.response.attestationObject),
      transports: credential.response.getTransports?.() || [],
    },
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults?.() || {},
  };
}

/**
 * Build PublicKeyCredentialRequestOptions from the server response
 * for navigator.credentials.get()
 */
export function buildAuthenticationOptions(serverOptions) {
  return {
    challenge: base64urlToUint8Array(serverOptions.challenge),
    allowCredentials: (serverOptions.allowCredentials || []).map((cred) => ({
      id: base64urlToUint8Array(cred.id),
      type: 'public-key',
      transports: cred.transports || [],
    })),
    userVerification: serverOptions.userVerification || 'preferred',
    rpId: serverOptions.rpId || 'localhost',
    timeout: serverOptions.timeout || 60000,
  };
}

/**
 * Serialize a PublicKeyCredential from navigator.credentials.get()
 * into a plain object the server can verify
 */
export function serializeAuthenticationResponse(credential) {
  return {
    id: credential.id,
    rawId: uint8ArrayToBase64url(credential.rawId),
    response: {
      clientDataJSON: uint8ArrayToBase64url(credential.response.clientDataJSON),
      authenticatorData: uint8ArrayToBase64url(credential.response.authenticatorData),
      signature: uint8ArrayToBase64url(credential.response.signature),
      userHandle: credential.response.userHandle
        ? uint8ArrayToBase64url(credential.response.userHandle)
        : null,
    },
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults?.() || {},
  };
}
