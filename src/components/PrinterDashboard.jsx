import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function PrinterDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Printer Dashboard</h1>
        <div className="header-actions">
          <span className="user-greeting">Welcome, {currentUser?.displayName || 'Printer'}!</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content printer-dashboard">
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
            <button className="action-button primary">
              📝 Create Service Listing
            </button>
            <button className="action-button">
              📦 Manage Orders
            </button>
            <button className="action-button">
              ⚙️ Printer Settings
            </button>
            <button className="action-button">
              💰 View Earnings
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">🎉</div>
              <div className="activity-content">
                <p><strong>Welcome to 3D Print Connect!</strong></p>
                <p>Complete your profile setup to start receiving orders</p>
                <span className="activity-time">Just now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Getting Started</h2>
          <div className="checklist">
            <div className="checklist-item">
              <input type="checkbox" id="profile" />
              <label htmlFor="profile">Complete your profile</label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="printer" />
              <label htmlFor="printer">Add your 3D printer details</label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="services" />
              <label htmlFor="services">Create your first service listing</label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="photos" />
              <label htmlFor="photos">Upload photos of your work</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrinterDashboard;
