import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import { getAuth, clearAuth } from '../utils/auth';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🔗</span>
            <span className="logo-text">ShortURL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={() => navigate('/dashboard')}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/urls')}>
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
        <div className="dashboard-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.full_name || user?.username}!</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">🔗</div>
            <div className="stat-content">
              <div className="stat-label">Total Links</div>
              <div className="stat-value">{stats?.totalUrls || 0}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div className="stat-content">
              <div className="stat-label">Active Links</div>
              <div className="stat-value">{stats?.activeUrls || 0}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">👆</div>
            <div className="stat-content">
              <div className="stat-label">Total Clicks</div>
              <div className="stat-value">{stats?.totalClicks || 0}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">📈</div>
            <div className="stat-content">
              <div className="stat-label">Recent Clicks (7 days)</div>
              <div className="stat-value">{stats?.recentClicks || 0}</div>
            </div>
          </div>
        </div>

        {/* Top Links */}
        <div className="top-links-section">
          <h2 className="section-title">Top Performing Links</h2>
          <div className="links-table">
            <table>
              <thead>
                <tr>
                  <th>Short Code</th>
                  <th>Title</th>
                  <th>Destination</th>
                  <th>Clicks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topUrls && stats.topUrls.length > 0 ? (
                  stats.topUrls.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <span className="short-code">{link.short_code}</span>
                      </td>
                      <td>{link.title || '-'}</td>
                      <td>
                        <a 
                          href={link.original_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="destination-link"
                        >
                          {link.original_url.substring(0, 40)}...
                        </a>
                      </td>
                      <td>
                        <span className="click-count">{link.total_clicks}</span>
                      </td>
                      <td>
                        <button 
                          className="btn-view"
                          onClick={() => navigate('/urls')}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-message">
                      No links created yet. <a href="/urls">Create your first link!</a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-card" onClick={() => navigate('/urls')}>
            <div className="action-icon">➕</div>
            <h3>Create New Link</h3>
            <p>Shorten a new URL</p>
          </button>
          <button className="action-card" onClick={() => navigate('/urls')}>
            <div className="action-icon">📋</div>
            <h3>View All Links</h3>
            <p>Manage your links</p>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;