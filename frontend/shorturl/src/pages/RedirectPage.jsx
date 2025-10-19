import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const RedirectPage = () => {
  const { shortId } = useParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirect = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/short/${shortId}`);
        
        if (response.data.originalUrl) {
          // Redirect to the original URL
          window.location.href = response.data.originalUrl;
        }
      } catch (err) {
        setLoading(false);
        if (err.response?.status === 404) {
          setError('Link not found');
        } else {
          setError('Failed to redirect');
        }
      }
    };

    redirect();
  }, [shortId]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}></div>
        <p style={styles.text}>Redirecting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorIcon}>❌</div>
        <h2 style={styles.errorTitle}>{error}</h2>
        <p style={styles.errorText}>The link you're looking for doesn't exist or has expired.</p>
        <a href="/" style={styles.homeLink}>Go to Homepage</a>
      </div>
    );
  }

  return null;
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(255, 255, 255, 0.3)',
    borderTop: '5px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  text: {
    marginTop: '1.5rem',
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  errorTitle: {
    color: 'white',
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1.125rem',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  homeLink: {
    padding: '0.75rem 2rem',
    background: 'white',
    color: '#667eea',
    borderRadius: '2rem',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default RedirectPage;