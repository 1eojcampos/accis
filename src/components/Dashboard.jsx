import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
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
        <h1>Welcome to Your Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>User Information</h2>
          <div className="user-details">
            <p><strong>Name:</strong> {currentUser?.displayName || 'Not provided'}</p>
            <p><strong>Email:</strong> {currentUser?.email}</p>
            <p><strong>Email Verified:</strong> {currentUser?.emailVerified ? 'Yes' : 'No'}</p>
            <p><strong>Account Created:</strong> {currentUser?.metadata?.creationTime}</p>
            <p><strong>Last Sign In:</strong> {currentUser?.metadata?.lastSignInTime}</p>
          </div>
        </div>
        
        <div className="welcome-message">
          <h3>🎉 Authentication Setup Complete!</h3>
          <p>
            Your Firebase authentication is now working. You can now build your app's features 
            knowing that users can securely sign up, log in, and manage their accounts.
          </p>
          <div className="feature-list">
            <h4>What's Available:</h4>
            <ul>
              <li>✅ Email/Password Authentication</li>
              <li>✅ Google Sign-In</li>
              <li>✅ Password Reset</li>
              <li>✅ User Profile Management</li>
              <li>✅ Protected Routes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
