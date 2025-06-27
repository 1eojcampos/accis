import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrinterDashboard from './PrinterDashboard';
import CustomerDashboard from './CustomerDashboard';
import UserTypeSelection from './UserTypeSelection';
import './Dashboard.css';

function Dashboard() {
  const { currentUser, userProfile } = useAuth();

  // Show loading if user profile is still being fetched
  if (!userProfile) {
    return (
      <div className="dashboard-container">
        <div className="loading-screen">
          <div className="loading-content">
            <h2>Loading your dashboard...</h2>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // If user hasn't selected a type yet, show selection screen
  if (!userProfile.userType) {
    return <UserTypeSelection />;
  }

  // Route to appropriate dashboard based on user type
  if (userProfile.userType === 'printer') {
    return <PrinterDashboard />;
  } else if (userProfile.userType === 'customer') {
    return <CustomerDashboard />;
  }

  // Fallback - should not happen
  return <UserTypeSelection />;
}

export default Dashboard;
