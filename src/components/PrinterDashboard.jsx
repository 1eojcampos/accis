import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PrinterManagement from './PrinterManagement';
import PrintRequests from './PrintRequests';
import './Dashboard.css';

function PrinterDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const renderHomeContent = () => (
    <>
      <div className="dashboard-card">
        <h2>🖨️ Your 3D Printing Business</h2>
        <p>Manage your 3D printing services and connect with customers</p>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>0</h3>
            <p>Active Orders</p>
          </div>
          <div className="stat-card">
            <h3>0</h3>
            <p>Completed Jobs</p>
          </div>
          <div className="stat-card">
            <h3>$0</h3>
            <p>Total Earnings</p>
          </div>
          <div className="stat-card">
            <h3>5.0</h3>
            <p>Rating</p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-button primary"
            onClick={() => setActiveTab('printers')}
          >
            🖨️ Manage Printers
          </button>
          <button 
            className="action-button"
            onClick={() => setActiveTab('requests')}
          >
            📦 Print Requests
          </button>
          <button className="action-button">
            ⚙️ Settings
          </button>
          <button className="action-button">
            💰 Earnings
          </button>
        </div>
      </div>
    </>
  );

  const renderProfileContent = () => (
    <>
      <div className="dashboard-card">
        <h2>👤 Profile Settings</h2>
        <p>Manage your profile information and business details</p>
        
        <div className="profile-section">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {currentUser?.displayName?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <button className="avatar-upload-btn">Change Photo</button>
          </div>
          
          <div className="profile-info">
            <div className="info-row">
              <label>Display Name</label>
              <input type="text" value={currentUser?.displayName || ''} readOnly />
            </div>
            <div className="info-row">
              <label>Email</label>
              <input type="email" value={currentUser?.email || ''} readOnly />
            </div>
            <div className="info-row">
              <label>Business Name</label>
              <input type="text" placeholder="Enter your business name" />
            </div>
            <div className="info-row">
              <label>Location</label>
              <input type="text" placeholder="City, State" />
            </div>
            <div className="info-row">
              <label>Bio</label>
              <textarea placeholder="Tell customers about your 3D printing services..." rows="3"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>⚙️ Account Settings</h2>
        <div className="settings-options">
          <button className="settings-button">
            🔔 Notification Settings
          </button>
          <button className="settings-button">
            💳 Payment Methods
          </button>
          <button className="settings-button">
            🔒 Privacy Settings
          </button>
          <button className="settings-button danger" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-text">Accis</span>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('home');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">🏠</div>
            <span className="nav-label">Home</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'printers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('printers');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">🖨️</div>
            <span className="nav-label">My Printers</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('requests');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">📦</div>
            <span className="nav-label">Print Requests</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">👤</div>
            <span className="nav-label">Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <div className="nav-icon">🚪</div>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="dashboard-header">
          <button className="hamburger-menu" onClick={toggleSidebar}>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </button>
          <h1>
            {activeTab === 'home' && 'Printer Dashboard'}
            {activeTab === 'printers' && 'My Printers'}
            {activeTab === 'requests' && 'Print Requests'}
            {activeTab === 'profile' && 'Profile'}
          </h1>
          <div className="header-actions">
            <span className="user-greeting">Welcome, {currentUser?.displayName || 'Printer'}!</span>
          </div>
        </div>
        
        <div className="dashboard-content printer-dashboard">
          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'printers' && <PrinterManagement />}
          {activeTab === 'requests' && <PrintRequests />}
          {activeTab === 'profile' && renderProfileContent()}
        </div>
      </div>
    </div>
  );
}

export default PrinterDashboard;
