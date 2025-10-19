import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setAuth } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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
      const response = await authAPI.login(formData);
      const { token, user } = response.data;
      
      setAuth(token, user);
      
      const pendingUrl = sessionStorage.getItem('pendingUrl');
      if (pendingUrl) {
        sessionStorage.removeItem('pendingUrl');
        navigate('/urls');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{pageStyles}</style>
      <div className="login-page-container">
        <div className="login-left-section">
          <div className="login-logo-section">
            <div className="login-logo-icon">🔗</div>
            <h1 className="login-logo-text">ShortURL</h1>
          </div>
          
          <div className="login-welcome-section">
            <h2 className="login-welcome-title">Welcome Back!</h2>
            <p className="login-welcome-subtitle">
              Log in to manage your short links and track analytics
            </p>
          </div>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">⚡</span>
              <span className="login-feature-text">Fast & Reliable</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <span className="login-feature-text">Detailed Analytics</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">🔒</span>
              <span className="login-feature-text">Secure & Private</span>
            </div>
          </div>
        </div>

        <div className="login-right-section">
          <div className="login-form-container">
            <div className="login-form-header">
              <h2 className="login-form-title">Login</h2>
              <p className="login-form-subtitle">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="login-error-box">
                <span className="login-error-icon">⚠️</span>
                <span className="login-error-text">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-input-group">
                <label className="login-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`login-submit-button ${loading ? 'login-submit-disabled' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p className="login-footer-text">
                Don't have an account?{' '}
                <Link to="/register" className="login-footer-link">
                  Create one
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
  /* Reset */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Full screen container */
  .login-page-container {
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

  /* Left Section */
  .login-left-section {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 4rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: white;
    overflow-y: auto;
  }

  .login-logo-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 3rem;
  }

  .login-logo-icon {
    font-size: 3rem;
    animation: bounce 2s infinite;
  }

  .login-logo-text {
    font-size: 2.5rem;
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .login-welcome-section {
    margin-bottom: 3rem;
  }

  .login-welcome-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .login-welcome-subtitle {
    font-size: 1.25rem;
    opacity: 0.9;
    line-height: 1.6;
  }

  .login-features {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: auto;
  }

  .login-feature {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
  }

  .login-feature-icon {
    font-size: 2rem;
  }

  .login-feature-text {
    font-size: 1.125rem;
    font-weight: 600;
  }

  /* Right Section */
  .login-right-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: #f9fafb;
    overflow-y: auto;
  }

  .login-form-container {
    width: 100%;
    max-width: 480px;
    background: white;
    padding: 3rem;
    border-radius: 1.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .login-form-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .login-form-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .login-form-subtitle {
    font-size: 1rem;
    color: #6b7280;
  }

  .login-error-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .login-error-icon {
    font-size: 1.25rem;
  }

  .login-error-text {
    color: #dc2626;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .login-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .login-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
  }

  .login-input {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    transition: all 0.2s;
    background-color: white;
    color: #1f2937;
  }

  .login-input::placeholder {
    color: #9ca3af;
  }

  .login-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .login-submit-button {
    width: 100%;
    padding: 1rem;
    margin-top: 0.5rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .login-submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .login-submit-disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .login-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
  }

  .login-footer {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }

  .login-footer-text {
    color: #6b7280;
    font-size: 0.95rem;
  }

  .login-footer-link {
    color: #667eea;
    font-weight: 600;
    text-decoration: none;
  }

  .login-footer-link:hover {
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
    .login-page-container {
      flex-direction: column;
      overflow-y: auto;
      position: relative;
    }

    .login-left-section,
    .login-right-section {
      min-height: 50vh;
    }

    .login-left-section {
      padding: 2rem;
    }

    .login-welcome-title {
      font-size: 2rem;
    }

    .login-form-container {
      padding: 2rem;
    }
  }
`;

export default Login;