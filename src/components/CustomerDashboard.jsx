import React, { useState }, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
          <button className="action-button primary" onClick={() => navigate('/printers')}>
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
      </div>
    </div>
  );
}

export default CustomerDashboard;
