
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PrinterBrowser from './PrinterBrowser';
import MyRequests from './MyRequests';
import PublicModels from './PublicModels';
import './Dashboard.css';

// Example order history data
const orderHistory = [
  {
    id: 'ORD-001',
    model: 'Phone Stand',
    printer: '3DPrints Inc.',
    status: 'Completed',
    date: '2024-06-01',
    price: '$12.00'
  },
  {
    id: 'ORD-002',
    model: 'Vase',
    printer: 'HomeMakers 3D',
    status: 'In Progress',
    date: '2024-06-15',
    price: '$18.00'
  },
  // Add more orders as needed
];

function CustomerDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedModel, setUploadedModel] = useState(null);

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

  const handleModelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedModel(file.name);
      // You can add upload logic here (e.g., Supabase storage)
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
        <h2>🌐 Browse Public Models</h2>
        <p>Discover 3D models from popular marketplaces like Yeggi, Thingiverse, and more</p>
        
        <div className="quick-search-preview">
          <p>Generate instant search links for multiple 3D model websites</p>
          <button 
            className="action-button primary" 
            onClick={() => setActiveTab('models')}
          >
            🔗 Browse Public Models
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Upload Your Own Model</h2>
        <input
          type="file"
          accept=".stl,.obj"
          onChange={handleModelUpload}
        />
        {uploadedModel && (
          <p>Uploaded: <strong>{uploadedModel}</strong></p>
        )}
      </div>

      <div className="dashboard-card">
        <h2>Find a Printer</h2>
        <button 
          className="action-button primary" 
          onClick={() => setActiveTab('browse')}
        >
          🔍 Browse 3D Printers
        </button>
      </div>

      <div className="dashboard-card">
        <h2>Order History</h2>
        <div className="order-history-list">
          {orderHistory.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <table className="order-history-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Model</th>
                  <th>Printer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.model}</td>
                    <td>{order.printer}</td>
                    <td>{order.status}</td>
                    <td>{order.date}</td>
                    <td>{order.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
            className={`sidebar-nav-item ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('browse');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">🔍</div>
            <span className="nav-label">Find Printers</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('models');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">🌐</div>
            <span className="nav-label">Public Models</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('requests');
              setSidebarOpen(false);
            }}
          >
            <div className="nav-icon">📦</div>
            <span className="nav-label">My Requests</span>
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
            {activeTab === 'home' && 'Customer Dashboard'}
            {activeTab === 'browse' && 'Find Printers'}
            {activeTab === 'models' && 'Browse Public Models'}
            {activeTab === 'requests' && 'My Requests'}
            {activeTab === 'profile' && 'Profile'}
          </h1>
          <div className="header-actions">
            <span className="user-greeting">Welcome, {currentUser?.displayName || 'Customer'}!</span>
          </div>
        </div>
        
        <div className="dashboard-content customer-dashboard">
          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'browse' && <PrinterBrowser />}
          {activeTab === 'models' && <PublicModels />}
          {activeTab === 'requests' && <MyRequests />}
          {activeTab === 'profile' && renderProfileContent()}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
