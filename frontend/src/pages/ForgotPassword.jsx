/**
 * Forgot Password Page
 *
 * Request a password reset link using the email associated with the account.
 * The endpoint intentionally returns a generic success message for privacy.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiShield, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../utils/constants';
import api from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Add the email tied to your account';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Use an email address that looks valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      toast.success(response.data.message || 'If that email is registered, reset instructions are on the way.');
      setSubmitted(true);
      setErrors({});
    } catch (error) {
      const message = error.response?.data?.message || 'We could not process the password reset request.';
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
            <h1>Reset access without the noise</h1>
            <p>
              We’ll queue a password reset request for the email you provide.
              The response stays generic so account details do not leak.
            </p>
            <div className="auth-brand-features">
              <div className="auth-feature">
                <FiShield />
                <span>Generic responses protect privacy</span>
              </div>
              <div className="auth-feature">
                <FiMail />
                <span>Reset instructions are sent securely</span>
              </div>
              <div className="auth-feature">
                <FiCheckCircle />
                <span>Rate limited against abuse</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>Forgot your password?</h2>
              <p>Enter your email and we’ll prepare the next step.</p>
            </div>

            {errors.form && (
              <div className="auth-error-banner">{errors.form}</div>
            )}

            {submitted ? (
              <div className="auth-form">
                <div className="auth-success-banner">
                  <FiCheckCircle />
                  <div>
                    <strong>Check your inbox</strong>
                    <p>
                      If the address exists, we’ve sent reset instructions. You can now return to sign in.
                    </p>
                  </div>
                </div>

                <Link to="/login" className="btn btn-primary btn-lg btn-auth">
                  <FiArrowLeft />
                  Back to log in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className={`form-group ${errors.email ? 'error' : ''}`}>
                  <label htmlFor="forgot-email">Email</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-auth"
                  disabled={loading}
                >
                  {loading ? 'Preparing reset...' : 'Send reset instructions'}
                </button>
              </form>
            )}

            <p className="auth-footer-text">
              Remembered it already?{' '}
              <Link to="/login" className="auth-link-bold">
                Return to log in
              </Link>
            </p>

            <div className="auth-security-note">
              <FiShield />
              <span>Reset requests use the same encrypted transport as sign-in.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
