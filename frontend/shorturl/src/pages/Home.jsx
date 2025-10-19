import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { urlAPI } from '../services/api';
import QRCode from 'react-qr-code';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('shortlink');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleCreateLink = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Check if user is logged in
      if (!isAuthenticated()) {
        // For non-logged in users, save URL and redirect to login
        sessionStorage.setItem('pendingUrl', url);
        navigate('/login');
        return;
      }

      // Create short URL
      const response = await urlAPI.createUrl({ original_url: url });
      const shortCode = response.data.url.short_code;
      setShortUrl(`${window.location.origin}/r/${shortCode}`);
      setShowResult(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create short link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert('Copied to clipboard!');
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🔗</span>
            <span className="logo-text">ShortURL</span>
          </div>
          <button className="btn-login" onClick={handleLogin}>
            Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        <div className="hero-section">
          <h1 className="hero-title">Shorten Your Links</h1>
          <p className="hero-subtitle">Create short links and QR codes in seconds</p>
        </div>

        {/* Form Card */}
        <div className="url-form-card">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'shortlink' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortlink')}
            >
              Short link
            </button>
            <button
              className={`tab-button ${activeTab === 'qrcode' ? 'active' : ''}`}
              onClick={() => setActiveTab('qrcode')}
            >
              QR Code
            </button>
          </div>

          {/* Form Content */}
          <div className="form-content">
            {!showResult ? (
              <>
                <label className="input-label">Enter your destination URL</label>
                <input
                  type="text"
                  className="url-input"
                  placeholder="https://example.com/my-long-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateLink()}
                />
                
                {error && <p className="error-message">{error}</p>}

                <button
                  className="btn-create"
                  onClick={handleCreateLink}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'create your link'}
                </button>
              </>
            ) : (
              <div className="result-section">
                {activeTab === 'shortlink' ? (
                  <>
                    <h3 className="result-title">Your Short Link</h3>
                    <div className="short-url-display">
                      <input
                        type="text"
                        value={shortUrl}
                        readOnly
                        className="short-url-input"
                      />
                      <button className="btn-copy" onClick={copyToClipboard}>
                        📋 Copy
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="result-title">Your QR Code</h3>
                    <div className="qr-display">
                      <QRCode
                        id="qr-code"
                        value={shortUrl}
                        size={200}
                        level="H"
                      />
                    </div>
                    <button className="btn-download" onClick={downloadQR}>
                      ⬇️ Download QR Code
                    </button>
                  </>
                )}
                
                <button
                  className="btn-create-another"
                  onClick={() => {
                    setShowResult(false);
                    setUrl('');
                    setShortUrl('');
                  }}
                >
                  Create Another Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast & Easy</h3>
            <p>Create short links in seconds</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Analytics</h3>
            <p>Monitor clicks and performance</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure</h3>
            <p>Your links are safe with us</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; 2025 ShortURL. Made for Synergy Developer Test</p>
      </footer>
    </div>
  );
};

export default Home;