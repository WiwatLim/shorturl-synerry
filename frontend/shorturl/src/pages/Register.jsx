import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.register(formData);
      alert('✅ Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{pageStyles}</style>
      <div className="register-page-container">
        <div className="register-left-section">
          <div className="register-logo-section">
            <div className="register-logo-icon">🔗</div>
            <h1 className="register-logo-text">ShortURL</h1>
          </div>
          
          <div className="register-welcome-section">
            <h2 className="register-welcome-title">Join Us Today!</h2>
            <p className="register-welcome-subtitle">
              Create an account to start shortening links and tracking your analytics
            </p>
          </div>

          <div className="register-features">
            <div className="register-feature">
              <span className="register-feature-icon">🚀</span>
              <span className="register-feature-text">Quick Setup</span>
            </div>
            <div className="register-feature">
              <span className="register-feature-icon">💯</span>
              <span className="register-feature-text">Free Forever</span>
            </div>
            <div className="register-feature">
              <span className="register-feature-icon">🎯</span>
              <span className="register-feature-text">Unlimited Links</span>
            </div>
          </div>
        </div>

        <div className="register-right-section">
          <div className="register-form-container">
            <div className="register-form-header">
              <h2 className="register-form-title">Create Account</h2>
              <p className="register-form-subtitle">Fill in your details to get started</p>
            </div>

            {error && (
              <div className="register-error-box">
                <span className="register-error-icon">⚠️</span>
                <span className="register-error-text">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="register-input-group">
                <label className="register-label">
                  Username <span className="register-required">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="register-input"
                  placeholder="Choose a username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="register-input-group">
                <label className="register-label">
                  Email <span className="register-required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="register-input"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="register-input-group">
                <label className="register-label">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="register-input"
                  placeholder="John Doe (optional)"
                  autoComplete="name"
                />
              </div>

              <div className="register-input-group">
                <label className="register-label">
                  Password <span className="register-required">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="register-input"
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                  minLength="6"
                />
                <span className="register-hint">At least 6 characters</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`register-submit-button ${loading ? 'register-submit-disabled' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="register-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="register-footer">
              <p className="register-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="register-footer-link">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const pageStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .register-page-container {
    display: flex;
    min-height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .register-left-section {
    flex: 1;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    padding: 4rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: white;
    overflow-y: auto;
  }

  .register-logo-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 3rem;
  }

  .register-logo-icon {
    font-size: 3rem;
    animation: bounce 2s infinite;
  }

  .register-logo-text {
    font-size: 2.5rem;
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .register-welcome-section {
    margin-bottom: 3rem;
  }

  .register-welcome-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .register-welcome-subtitle {
    font-size: 1.25rem;
    opacity: 0.9;
    line-height: 1.6;
  }

  .register-features {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: auto;
  }

  .register-feature {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.15);
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
  }

  .register-feature-icon {
    font-size: 2rem;
  }

  .register-feature-text {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .register-right-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: #f9fafb;
    overflow-y: auto;
  }

  .register-form-container {
    width: 100%;
    max-width: 480px;
    background: white;
    padding: 3rem;
    border-radius: 1.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .register-form-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .register-form-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .register-form-subtitle {
    font-size: 1rem;
    color: #6b7280;
  }

  .register-error-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .register-error-icon {
    font-size: 1.25rem;
  }

  .register-error-text {
    color: #dc2626;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .register-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .register-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .register-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
  }

  .register-required {
    color: #dc2626;
  }

  .register-input {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    transition: all 0.2s;
    background-color: white;
    color: #1f2937;
  }

  .register-input::placeholder {
    color: #9ca3af;
  }

  .register-input:focus {
    outline: none;
    border-color: #f5576c;
    box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.1);
  }

  .register-hint {
    font-size: 0.875rem;
    color: #9ca3af;
  }

  .register-submit-button {
    width: 100%;
    padding: 1rem;
    margin-top: 0.5rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .register-submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
  }

  .register-submit-disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .register-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
  }

  .register-footer {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }

  .register-footer-text {
    color: #6b7280;
    font-size: 0.95rem;
  }

  .register-footer-link {
    color: #f5576c;
    font-weight: 600;
    text-decoration: none;
  }

  .register-footer-link:hover {
    text-decoration: underline;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @media (max-width: 768px) {
    .register-page-container {
      flex-direction: column;
      overflow-y: auto;
      position: relative;
    }

    .register-left-section,
    .register-right-section {
      min-height: 50vh;
    }

    .register-left-section {
      padding: 2rem;
    }

    .register-welcome-title {
      font-size: 2rem;
    }

    .register-form-container {
      padding: 2rem;
    }
  }
`;

export default Register;