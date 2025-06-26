import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const { currentUser, logout, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleSendVerification = async () => {
    try {
      setLoading(true);
      await sendVerificationEmail();
      alert('Verification email sent! Check your inbox.');
    } catch (error) {
      alert('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
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
        {!currentUser?.emailVerified && (
          <div className="verification-banner">
            <div className="verification-banner-content">
              <h3>⚠️ Email Not Verified</h3>
              <p>Please verify your email address to secure your account and access all features.</p>
              <button 
                className="verify-button"
                onClick={handleSendVerification}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Verification Email'}
              </button>
            </div>
          </div>
        )}
        
        <div className="user-info-card">
          <h2>User Information</h2>
          <div className="user-details">
            <p><strong>Name:</strong> {currentUser?.displayName || 'Not provided'}</p>
            <p><strong>Email:</strong> {currentUser?.email}</p>
            <p>
              <strong>Email Verified:</strong> 
              <span className={currentUser?.emailVerified ? 'verified' : 'unverified'}>
                {currentUser?.emailVerified ? ' ✅ Yes' : ' ❌ No'}
              </span>
            </p>
            <p><strong>Account Created:</strong> {currentUser?.metadata?.creationTime}</p>
            <p><strong>Last Sign In:</strong> {currentUser?.metadata?.lastSignInTime}</p>
          </div>
        </div>
        
        <div className="welcome-message">
          <h3>🎉 Authentication Setup Complete!</h3>
          <p>
            Your Firebase authentication is now working. You can now build your app's features 
            knowing that users can securely sign up, log in, and manage their accounts.
          </p>            <div className="feature-list">
              <h4>What's Available:</h4>
              <ul>
                <li>✅ Email/Password Authentication</li>
                <li>✅ Google Sign-In</li>
                <li>✅ Password Reset</li>
                <li>✅ Email Verification</li>
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
