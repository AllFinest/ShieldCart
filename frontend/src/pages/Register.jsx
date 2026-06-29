/**
 * Register Page
 *
 * Modern split-screen registration with password strength indicator,
 * terms acceptance, and explicit biometric enrollment step.
 */

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiShield, FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import TrustBadges from '../components/common/TrustBadges';
import {
  buildRegistrationOptions,
  serializeRegistrationResponse,
} from '../utils/webauthnUtils';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (score <= 2) return { level: 'weak', label: 'Needs work', color: '#be123c', width: '25%' };
  if (score <= 3) return { level: 'fair', label: 'Getting there', color: '#ca8a04', width: '50%' };
  if (score <= 4) return { level: 'good', label: 'Solid', color: '#0891b2', width: '75%' };
  return { level: 'strong', label: 'Excellent', color: '#15803d', width: '100%' };
}

async function enrollPasskey(accessToken) {
  // Step 1 — get registration challenge from server
  const optionsRes = await api.post(
    API_ENDPOINTS.WEBAUTHN.REGISTER_OPTIONS,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const serverOptions = optionsRes.data?.data;
  if (!serverOptions?.challenge) throw new Error('No challenge returned from server');

  // Step 2 — ask device for fingerprint / biometric
  const publicKeyOptions = buildRegistrationOptions(serverOptions);
  const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
  if (!credential) throw new Error('No credential returned from device');

  // Step 3 — send attestation to server for verification
  const registrationResponse = serializeRegistrationResponse(credential);
  const verifyRes = await api.post(
    API_ENDPOINTS.WEBAUTHN.REGISTER_VERIFY,
    { credentialLabel: 'This device', registrationResponse },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return verifyRes.data?.data;
}

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [errors, setErrors] = useState({});
  const [registeredUser, setRegisteredUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Tell us your first name';
    if (!formData.lastName.trim()) newErrors.lastName = 'Tell us your last name';
    if (!formData.email.trim()) newErrors.email = 'Add an email for your account';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Use an email address that looks valid';
    if (!formData.password) newErrors.password = 'Create a password to continue';
    else if (formData.password.length < 8) newErrors.password = 'Use 8 characters or more';
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Add at least one uppercase letter';
    else if (!/[a-z]/.test(formData.password)) newErrors.password = 'Add at least one lowercase letter';
    else if (!/\d/.test(formData.password)) newErrors.password = 'Add at least one number';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) newErrors.password = 'Add one symbol or special character';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Those passwords are not the same yet';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'Please agree to the terms before joining';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      const { accessToken: token, user, trust } = response.data.data;

      // Store for passkey enrollment step
      setAccessToken(token);
      setRegisteredUser({ user, trust, token });

      toast.success('Your account is ready!');

      // If WebAuthn is supported, show enrollment prompt
      if (window.PublicKeyCredential) {
        setEnrolling(true);
      } else {
        // No WebAuthn support — go straight to app
        login(token, user, trust);
        navigate('/', { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'We could not create the account. Please try once more.';
      toast.error(message);
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFingerprint = async () => {
    if (!registeredUser) return;
    setLoading(true);
    try {
      const result = await enrollPasskey(registeredUser.token);
      if (result?.verified) {
        toast.success('Fingerprint registered! You can now sign in with your fingerprint.');
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Fingerprint prompt was cancelled. You can add it later from settings.');
      } else {
        console.error('Passkey enrollment error:', err);
        toast.error('Could not register fingerprint right now. You can add it later.');
      }
    } finally {
      setLoading(false);
      const { user, trust, token } = registeredUser;
      login(token, user, trust);
      navigate('/', { replace: true });
    }
  };

  const handleSkipEnrollment = () => {
    const { user, trust, token } = registeredUser;
    login(token, user, trust);
    navigate('/', { replace: true });
  };

  // --- Passkey enrollment step shown after registration ---
  if (enrolling) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ justifyContent: 'center' }}>
          <div className="auth-form-panel" style={{ maxWidth: '480px' }}>
            <div className="auth-form-wrapper">
              <div className="auth-brand-logo" style={{ marginBottom: '1rem' }}>
                <FiShield size={48} />
              </div>
              <div className="auth-form-header">
                <h2>Add fingerprint sign-in?</h2>
                <p>
                  Register your fingerprint now so you can sign in without a password next time.
                  This uses your device's built-in security chip — your fingerprint never leaves your device.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-auth"
                onClick={handleEnrollFingerprint}
                disabled={loading}
                style={{ marginBottom: '1rem' }}
              >
                {loading ? 'Waiting for fingerprint...' : (
                  <>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                      <path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4" />
                      <path d="M8 15s-2-2.9-2-4c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                      <path d="M4 19s-2-4.4-2-8c0-5.5 4.5-10 10-10s10 4.5 10 10c0 1.8-.3 3.4-.8 4.8" />
                    </svg>
                    Register fingerprint
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-lg btn-auth"
                onClick={handleSkipEnrollment}
                disabled={loading}
              >
                Skip for now
              </button>
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#6b7280', textAlign: 'center' }}>
                You can always add a fingerprint later from your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main registration form ---
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand-panel register-brand">
          <div className="auth-brand-content">
            <div className="auth-brand-logo"><FiShield size={48} /></div>
            <h1>Start with ShieldCart</h1>
            <p>Set up your account for a shopping experience built around privacy, calmer checkout, and smarter account protection.</p>
            <div className="auth-brand-features">
              <div className="auth-feature"><FiShield /><span>Passkey-ready access</span></div>
              <div className="auth-feature"><FiLock /><span>Protected checkout</span></div>
              <div className="auth-feature"><FiUser /><span>Privacy-minded by design</span></div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>Create your account</h2>
              <p>A few details are all we need to set up your profile.</p>
            </div>

            <div className="auth-trust-badges">
              <TrustBadges variant="horizontal" set="auth" />
            </div>

            {errors.form && <div className="auth-error-banner">{errors.form}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-row-grid">
                <div className={`form-group ${errors.firstName ? 'error' : ''}`}>
                  <label htmlFor="firstName">Given name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input id="firstName" type="text" placeholder="Alex" value={formData.firstName} onChange={handleChange('firstName')} disabled={loading} />
                  </div>
                  {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                </div>
                <div className={`form-group ${errors.lastName ? 'error' : ''}`}>
                  <label htmlFor="lastName">Family name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input id="lastName" type="text" placeholder="Rivera" value={formData.lastName} onChange={handleChange('lastName')} disabled={loading} />
                  </div>
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className={`form-group ${errors.email ? 'error' : ''}`}>
                <label htmlFor="reg-email">Email</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input id="reg-email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange('email')} autoComplete="email" disabled={loading} />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.password ? 'error' : ''}`}>
                <label htmlFor="reg-password">Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Choose a resilient password" value={formData.password} onChange={handleChange('password')} autoComplete="new-password" disabled={loading} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div className="strength-fill" style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }} />
                    </div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                )}
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
                <label htmlFor="confirmPassword">Repeat password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Type the same password again" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} autoComplete="new-password" disabled={loading} />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <div className={`form-group ${errors.acceptTerms ? 'error' : ''}`}>
                <label className="checkbox-label terms-label">
                  <input type="checkbox" checked={formData.acceptTerms} onChange={handleChange('acceptTerms')} />
                  <span>
                    I accept the{' '}
                    <Link to="/privacy-policy" className="auth-link" target="_blank">Service Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" className="auth-link" target="_blank">Privacy Notes</Link>
                  </span>
                </label>
                {errors.acceptTerms && <span className="field-error">{errors.acceptTerms}</span>}
              </div>

              <div className="auth-security-note">
                <FiShield />
                <span>Privacy notices and secure confirmation messages keep signup transparent.</span>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-auth" disabled={loading}>
                {loading ? <span className="btn-loading">Setting things up...</span> : <><FiUserPlus /> Create your account</>}
              </button>
            </form>

            <p className="auth-footer-text">
              Already shopping with us?{' '}
              <Link to="/login" className="auth-link-bold">Log in</Link>
            </p>

            <div className="auth-security-note">
              <FiShield />
              <span>Your details are encrypted from the moment you submit them.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
