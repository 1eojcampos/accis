import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PrinterBrowser from './PrinterBrowser';
import MyRequests from './MyRequests';
import './Dashboard.css';

const popularModels = [
  { id: 1, name: 'Phone Stand', category: 'Gadgets', image: '/assets/phone-stand.jpg' },
  { id: 2, name: 'Vase', category: 'Home', image: '/assets/vase.jpg' },
  { id: 3, name: 'Chess Set', category: 'Toys', image: '/assets/chess.jpg' },
  { id: 4, name: 'Keychain', category: 'Accessories', image: '/assets/keychain.jpg' },
  // Add more models as needed
];

const categories = ['All', 'Gadgets', 'Home', 'Toys', 'Accessories'];

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const [filter, setFilter] = useState('All');
  const [uploadedModel, setUploadedModel] = useState(null);

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

  const filteredModels = filter === 'All'
    ? popularModels
    : popularModels.filter(model => model.category === filter);

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
        <h2>Popular Models</h2>
        <div className="filter-bar">
          <label>Filter by category:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="models-grid">
          {filteredModels.map(model => (
            <div className="model-card" key={model.id}>
              <img src={model.image} alt={model.name} className="model-image" />
              <h3>{model.name}</h3>
              <span className="model-category">{model.category}</span>
            </div>
          ))}
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
          {activeTab === 'requests' && <MyRequests />}
          {activeTab === 'profile' && renderProfileContent()}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
