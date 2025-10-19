import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlAPI } from '../services/api';
import { getAuth, clearAuth } from '../utils/auth';
import QRCode from 'react-qr-code';
import '../styles/UrlList.css';

const UrlList = () => {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    original_url: '',
    custom_alias: '',
    title: '',
    expires_at: ''
  });
  const [selectedQR, setSelectedQR] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchUrls();
    
    // Check for pending URL from home page
    const pendingUrl = sessionStorage.getItem('pendingUrl');
    if (pendingUrl) {
      setFormData(prev => ({ ...prev, original_url: pendingUrl }));
      setShowForm(true);
      sessionStorage.removeItem('pendingUrl');
    }
  }, []);

  const fetchUrls = async () => {
  try {
    console.log('Fetching URLs...');
    const response = await urlAPI.getUrls();
    console.log('URLs Response:', response.data);
    setUrls(response.data.urls);
  } catch (error) {
    console.error('Failed to fetch URLs:', error);
    console.error('Error response:', error.response);
    showToast('Failed to load URLs', 'error');
  } finally {
    setLoading(false);
  }
};
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await urlAPI.createUrl(formData);
      showToast('Short link created successfully!', 'success');
      setShowForm(false);
      setFormData({
        original_url: '',
        custom_alias: '',
        title: '',
        expires_at: ''
      });
      fetchUrls();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this link?')) {
      return;
    }

    setDeleting(id);
    try {
      await urlAPI.deleteUrl(id);
      showToast('Link deleted successfully', 'success');
      fetchUrls();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete link', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const getShortUrl = (shortCode) => {
    return `${window.location.origin}/r/${shortCode}`;
  };

  const downloadQR = (shortCode) => {
    const svg = document.getElementById(`qr-${shortCode}`);
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
      downloadLink.download = `qr-${shortCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="url-list-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🔗</span>
            <span className="logo-text">ShortURL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button className="nav-item active" onClick={() => navigate('/urls')}>
            <span className="nav-icon">🔗</span>
            <span>My Links</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="url-list-content">
          <div className="url-list-header">
            <h1 className="url-list-title">My Links</h1>
            <button className="btn-create-new" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Close' : '+ Create New'}
            </button>
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="form-card">
              <div className="form-content">
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h2 className="form-section-title">Create Short Link</h2>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Destination URL *
                      </label>
                      <input
                        type="url"
                        name="original_url"
                        value={formData.original_url}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="https://example.com/my-long-url"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Custom Alias <span className="form-label-optional">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="custom_alias"
                        value={formData.custom_alias}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="my-custom-link"
                        pattern="[a-zA-Z0-9-_]+"
                      />
                      <p className="form-help-text">Only letters, numbers, hyphens and underscores</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Title <span className="form-label-optional">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="My Campaign Link"
                      />
                    </div>

                    <details className="advanced-settings">
                      <summary>Advanced Settings</summary>
                      <div className="form-group">
                        <label className="form-label">
                          Expiration Date <span className="form-label-optional">(optional)</span>
                        </label>
                        <input
                          type="datetime-local"
                          name="expires_at"
                          value={formData.expires_at}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </details>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-submit btn-submit-primary"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Short Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Links Table */}
          {loading && !showForm ? (
            <div className="loading">Loading...</div>
          ) : urls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔗</div>
              <h2 className="empty-state-title">No links yet</h2>
              <p className="empty-state-text">Create your first short link to get started</p>
              <button className="btn-create-new" onClick={() => setShowForm(true)}>
                + Create New Link
              </button>
            </div>
          ) : (
            <div className="links-table">
              <table>
                <thead>
                  <tr>
                    <th>Short Link</th>
                    <th>Title</th>
                    <th>Destination</th>
                    <th>Clicks</th>
                    <th>QR Code</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((url) => (
                    <tr key={url.id}>
                      <td>
                        <div className="short-link-cell">
                          <span className="short-link-code">{url.short_code}</span>
                          <button
                            className="btn-copy"
                            onClick={() => copyToClipboard(getShortUrl(url.short_code))}
                            title="Copy to clipboard"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td>{url.title || '-'}</td>
                      <td>
                        <a
                          href={url.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="destination-link"
                        >
                          {url.original_url.substring(0, 40)}...
                        </a>
                      </td>
                      <td>{url.url_analytics?.total_clicks || 0}</td>
                      <td>
                        <QRCode
                          id={`qr-${url.short_code}`}
                          value={getShortUrl(url.short_code)}
                          size={40}
                          level="H"
                          className="inline-qr"
                          onClick={() => setSelectedQR(url)}
                          title="Click to enlarge"
                        />
                      </td>
                      <td>{new Date(url.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(url.id)}
                            disabled={deleting === url.id}
                          >
                            {deleting === url.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="qr-modal-overlay" onClick={() => setSelectedQR(null)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setSelectedQR(null)}>
              ✕
            </button>
            <h3 className="qr-modal-title">QR Code</h3>
            <QRCode
              id={`qr-modal-${selectedQR.short_code}`}
              value={getShortUrl(selectedQR.short_code)}
              size={200}
              level="H"
              className="qr-modal-image"
            />
            <p className="qr-modal-url">{getShortUrl(selectedQR.short_code)}</p>
            <button
              className="btn-download-qr"
              onClick={() => downloadQR(selectedQR.short_code)}
            >
              ⬇️ Download QR Code
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default UrlList;