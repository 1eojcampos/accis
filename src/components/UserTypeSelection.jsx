import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function UserTypeSelection() {
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { updateUserType, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userType) {
      return setError('Please select whether you are a Printer or Customer');
    }

    try {
      setError('');
      setLoading(true);
      await updateUserType(userType);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to update user type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome to Accis!</h2>
        <p className="auth-subtitle">
          Tell us more about yourself to get started
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>I am a:</label>
            <div className="user-type-selection">
              <div 
                className={`user-type-card ${userType === 'printer' ? 'selected' : ''}`}
                onClick={() => setUserType('printer')}
              >
                <div className="user-type-icon">🖨️</div>
                <h4>Printer</h4>
                <p>I have a 3D printer and want to provide printing services</p>
              </div>
              <div 
                className={`user-type-card ${userType === 'customer' ? 'selected' : ''}`}
                onClick={() => setUserType('customer')}
              >
                <div className="user-type-icon">👤</div>
                <h4>Customer</h4>
                <p>I want to get something 3D printed</p>
              </div>
            </div>
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Setting up your account...' : 'Continue'}
          </button>
        </form>
        
        <div className="user-type-info">
          <h4>What's the difference?</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>🖨️ Printers</strong>
              <ul>
                <li>List your 3D printing services</li>
                <li>Set your own prices</li>
                <li>Manage print requests</li>
                <li>Build your reputation</li>
              </ul>
            </div>
            <div className="info-item">
              <strong>👤 Customers</strong>
              <ul>
                <li>Browse available printers</li>
                <li>Upload your 3D models</li>
                <li>Compare prices and reviews</li>
                <li>Track your orders</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserTypeSelection;
