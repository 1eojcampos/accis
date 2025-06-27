import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function CustomerDashboard() {
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
        <h1>Customer Dashboard</h1>
        <div className="header-actions">
          <span className="user-greeting">Welcome, {currentUser?.displayName || 'Customer'}!</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content customer-dashboard">
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
      </div>
    </div>
  );
}

export default CustomerDashboard;
