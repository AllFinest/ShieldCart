/**
 * Login Page
 *
 * Supports email/password and fingerprint (WebAuthn passkey) authentication.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiLogIn } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import TrustBadges from '../components/common/TrustBadges';
import {
  buildAuthenticationOptions,
  serializeAuthenticationResponse,
} from '../utils/webauthnUtils';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Add your email to continue';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Use an email address that looks valid';
    if (!password) newErrors.password = 'Type your password to keep going';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user, trust } = response.data.data;
      login(accessToken, user, trust);
      toast.success(`Good to see you again, ${user.firstName}!`);
      if (trust?.statusMessage) toast(trust.statusMessage);
      navigate(from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'We could not log you in. Give it another try.';
      toast.error(message);
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email first so we know which passkey to look for' });
      return;
    }

    if (!window.PublicKeyCredential) {
      toast.error('Your browser does not support WebAuthn. Try Chrome or Firefox.');
      return;
    }

    setLoading(true);
    try {
      // Step 1 — get challenge and allowed credentials from server
      const optionsRes = await api.post(API_ENDPOINTS.WEBAUTHN.LOGIN_OPTIONS, { email });
      const serverOptions = optionsRes.data?.data;

      if (!serverOptions?.challenge) {
        throw new Error('Server did not return a valid challenge');
      }

      if (serverOptions.credentialCount === 0) {
        toast.error('No passkey registered for this account. Register one first from the sign-up page.');
        setLoading(false);
        return;
      }

      // Step 2 — ask browser / device for fingerprint
      const publicKeyOptions = buildAuthenticationOptions(serverOptions);
      let credential;
      try {
        credential = await navigator.credentials.get({ publicKey: publicKeyOptions });
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          toast.error('Fingerprint was cancelled or timed out. Please try again.');
        } else if (err.name === 'NotSupportedError') {
          toast.error('Your device does not support fingerprint authentication.');
        } else if (err.name === 'SecurityError') {
          toast.error('Security error — make sure you are on https://localhost.');
        } else {
          toast.error(`Passkey error: ${err.message}`);
        }
        setLoading(false);
        return;
      }

      if (!credential) {
        toast.error('No credential was returned. Please try again.');
        setLoading(false);
        return;
      }

      // Step 3 — send response to server for verification
      const authenticationResponse = serializeAuthenticationResponse(credential);
      const verifyRes = await api.post(API_ENDPOINTS.WEBAUTHN.LOGIN_VERIFY, {
        email,
        credentialId: credential.id,
        authenticationResponse,
        credentialLabel: 'This device',
      });

      const { accessToken, user, trust } = verifyRes.data.data;
      login(accessToken, user, trust);
      toast.success(`Passkey sign-in verified for ${user.firstName}.`);
      if (trust?.statusMessage) toast(trust.statusMessage);
      navigate(from, { replace: true });

    } catch (error) {
      console.error('Passkey login error:', error);
      const message = error.response?.data?.message || 'We could not verify passkey sign-in right now.';
      toast.error(message);
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <FiShield size={48} />
            </div>
            <h1>Good to see you again</h1>
            <p>Log in and pick up where you left off. Quiet security checks help keep your account and checkout details protected.</p>
            <div className="auth-brand-features">
              <div className="auth-feature"><FiShield /><span>Encrypted connection</span></div>
              <div className="auth-feature"><FiLock /><span>Passkey-ready login</span></div>
              <div className="auth-feature"><FiShield /><span>Payment safeguards</span></div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>Log in</h2>
              <p>Use your email and password to open your shopping session.</p>
            </div>

            <div className="auth-trust-badges">
              <TrustBadges variant="horizontal" set="auth" />
            </div>

            {errors.form && <div className="auth-error-banner">{errors.form}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className={`form-group ${errors.email ? 'error' : ''}`}>
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.password ? 'error' : ''}`}>
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Type your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>Keep me signed in</span>
                </label>
                <Link to="/forgot-password" className="auth-link">Need a reset?</Link>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-auth" disabled={loading}>
                {loading ? <span className="btn-loading">Opening your account...</span> : <><FiLogIn /> Log in</>}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <button
              type="button"
              className="btn btn-outline btn-lg btn-biometric"
              onClick={handlePasskeyLogin}
              disabled={loading || !email.trim()}
              title={!email.trim() ? 'Enter your email above first' : 'Sign in with fingerprint'}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4" />
                <path d="M8 15s-2-2.9-2-4c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                <path d="M4 19s-2-4.4-2-8c0-5.5 4.5-10 10-10s10 4.5 10 10c0 1.8-.3 3.4-.8 4.8" />
              </svg>
              Use fingerprint sign-in
            </button>

            <p className="auth-footer-text">
              New around here?{' '}
              <Link to="/register" className="auth-link-bold">Create your account</Link>
            </p>

            <div className="auth-security-note">
              <FiShield />
              <span>Authentication notifications and trust checks help protect your account.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
