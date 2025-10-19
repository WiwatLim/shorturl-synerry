import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const RedirectPage = () => {
  const { shortId } = useParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirect = async () => {
      try {
        // Redirect ไปยัง Backend โดยตรง
        // Backend จะจัดการ tracking และ redirect
        window.location.href = `http://localhost:3000/r/${shortId}`;
      } catch (err) {
        setLoading(false);
        setError('Failed to redirect');
      }
    };

    if (shortId) {
      redirect();
    }
  }, [shortId]);

  if (loading) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="redirect-container">
          <div className="redirect-spinner"></div>
          <p className="redirect-text">Redirecting...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="redirect-container">
          <div className="redirect-error-icon">❌</div>
          <h2 className="redirect-error-title">Failed to redirect</h2>
          <p className="redirect-error-text">The link you're looking for doesn't exist.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="redirect-home-button"
          >
            Go to Homepage
          </button>
        </div>
      </>
    );
  }

  return null;
};

const pageStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .redirect-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    text-align: center;
  }

  .redirect-spinner {
    width: 60px;
    height: 60px;
    border: 6px solid rgba(255, 255, 255, 0.3);
    border-top: 6px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .redirect-text {
    margin-top: 2rem;
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .redirect-error-icon {
    font-size: 5rem;
    margin-bottom: 1.5rem;
    animation: fadeIn 0.5s ease-out;
  }

  .redirect-error-title {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.6s ease-out;
  }

  .redirect-error-text {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.25rem;
    margin-bottom: 2.5rem;
    max-width: 600px;
    line-height: 1.6;
    animation: fadeIn 0.7s ease-out;
  }

  .redirect-home-button {
    padding: 1rem 2.5rem;
    background: white;
    color: #667eea;
    border-radius: 3rem;
    border: none;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.8s ease-out;
  }

  .redirect-home-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default RedirectPage;