import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function CustomerDashboard() {
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
        <h2>👤 Your 3D Printing Projects</h2>
        <p>Find the perfect printer for your project and track your orders</p>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>0</h3>
            <p>Active Orders</p>
          </div>
          <div className="stat-card">
            <h3>0</h3>
            <p>Completed Projects</p>
          </div>
          <div className="stat-card">
            <h3>0</h3>
            <p>Saved Printers</p>
          </div>
          <div className="stat-card">
            <h3>$0</h3>
            <p>Total Spent</p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-button primary">
            🔍 Find Printers
          </button>
          <button className="action-button">
            📁 Upload 3D Model
          </button>
          <button className="action-button">
            📦 Track Orders
          </button>
          <button className="action-button">
            ⭐ Leave Reviews
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Featured Printers</h2>
        <div className="printer-grid">
          <div className="printer-card">
            <div className="printer-avatar">🖨️</div>
            <h4>TechPrint Pro</h4>
            <div className="printer-rating">⭐⭐⭐⭐⭐ 4.9</div>
            <p>High-quality PLA & ABS printing</p>
            <span className="printer-price">From $0.15/g</span>
          </div>
          <div className="printer-card">
            <div className="printer-avatar">🎨</div>
            <h4>Creative Prints</h4>
            <div className="printer-rating">⭐⭐⭐⭐⭐ 4.8</div>
            <p>Specialized in artistic prints</p>
            <span className="printer-price">From $0.18/g</span>
          </div>
          <div className="printer-card">
            <div className="printer-avatar">⚡</div>
            <h4>Fast Print Express</h4>
            <div className="printer-rating">⭐⭐⭐⭐☆ 4.7</div>
            <p>24-hour turnaround time</p>
            <span className="printer-price">From $0.20/g</span>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4>Upload Your Model</h4>
            <p>Upload your 3D model file (.STL, .OBJ, etc.)</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4>Choose a Printer</h4>
            <p>Browse printers by location, price, and reviews</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4>Place Your Order</h4>
            <p>Select materials, quantity, and delivery options</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h4>Receive Your Print</h4>
            <p>Track progress and receive your finished product</p>
          </div>
        </div>
      </div>
    </>
  );

  const renderProfileContent = () => (
    <>
      <div className="dashboard-card">
        <h2>👤 Profile Settings</h2>
        <p>Manage your personal information and preferences</p>
        
        <div className="profile-section">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {currentUser?.displayName?.charAt(0)?.toUpperCase() || 'C'}
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
              <label>Phone Number</label>
              <input type="tel" placeholder="Enter your phone number" />
            </div>
            <div className="info-row">
              <label>Address</label>
              <input type="text" placeholder="Your delivery address" />
            </div>
            <div className="info-row">
              <label>Bio</label>
              <textarea placeholder="Tell us about your 3D printing interests..." rows="3"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>🎯 Printing Preferences</h2>
        <div className="printer-info">
          <div className="info-row">
            <label>Preferred Materials</label>
            <div className="material-checkboxes">
              <label><input type="checkbox" /> PLA</label>
              <label><input type="checkbox" /> ABS</label>
              <label><input type="checkbox" /> PETG</label>
              <label><input type="checkbox" /> TPU</label>
            </div>
          </div>
          <div className="info-row">
            <label>Quality Preference</label>
            <select style={{padding: '12px', border: '1px solid #e1e5e9', borderRadius: '8px'}}>
              <option>Standard Quality</option>
              <option>High Quality</option>
              <option>Ultra High Quality</option>
            </select>
          </div>
          <div className="info-row">
            <label>Budget Range</label>
            <input type="text" placeholder="e.g., $10-50 per project" />
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>⚙️ Account Settings</h2>
        <div className="settings-options">
          <button className="settings-button">
            🔔 Notification Preferences
          </button>
          <button className="settings-button">
            💳 Payment Methods
          </button>
          <button className="settings-button">
            📦 Order History
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
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">�</div>
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
          <h1>{activeTab === 'home' ? 'Customer Dashboard' : 'Profile'}</h1>
          <div className="header-actions">
            <span className="user-greeting">Welcome, {currentUser?.displayName || 'Customer'}!</span>
          </div>
        </div>
        
        <div className="dashboard-content customer-dashboard">
          {activeTab === 'home' ? renderHomeContent() : renderProfileContent()}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
