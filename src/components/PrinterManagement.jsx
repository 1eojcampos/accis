import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  createPrinterListing, 
  updatePrinterListing, 
  deletePrinterListing, 
  getPrintersByOwner 
} from '../services/firestore';
import './Dashboard.css';

function PrinterManagement() {
  const { currentUser } = useAuth();
  const [printers, setPrinters] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    businessName: '',
    location: '',
    pricePerGram: '',
    materials: [],
    printerModel: '',
    bedSize: '',
    turnaroundTime: '',
    description: '',
    isAvailable: true
  });

  const availableMaterials = ['PLA', 'ABS', 'PETG', 'TPU', 'Wood PLA', 'Resin', 'HIPS', 'Carbon Fiber'];

  useEffect(() => {
    loadPrinters();
  }, [currentUser]);

  const loadPrinters = async () => {
    try {
      if (currentUser) {
        const printerListings = await getPrintersByOwner(currentUser.uid);
        setPrinters(printerListings);
      }
    } catch (error) {
      console.error('Error loading printers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMaterialChange = (material) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter(m => m !== material)
        : [...prev.materials, material]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const printerData = {
        ...formData,
        pricePerGram: parseFloat(formData.pricePerGram),
        ownerName: currentUser.displayName || currentUser.email,
        rating: 0,
        reviewCount: 0,
        completedJobs: 0
      };

      if (editingPrinter) {
        await updatePrinterListing(editingPrinter.id, printerData);
      } else {
        await createPrinterListing(currentUser.uid, printerData);
      }

      setFormData({
        businessName: '',
        location: '',
        pricePerGram: '',
        materials: [],
        printerModel: '',
        bedSize: '',
        turnaroundTime: '',
        description: '',
        isAvailable: true
      });
      setShowAddForm(false);
      setEditingPrinter(null);
      loadPrinters();
    } catch (error) {
      console.error('Error saving printer:', error);
    }
  };

  const handleEdit = (printer) => {
    setEditingPrinter(printer);
    setFormData({
      businessName: printer.businessName || '',
      location: printer.location || '',
      pricePerGram: printer.pricePerGram || '',
      materials: printer.materials || [],
      printerModel: printer.printerModel || '',
      bedSize: printer.bedSize || '',
      turnaroundTime: printer.turnaroundTime || '',
      description: printer.description || '',
      isAvailable: printer.isAvailable !== undefined ? printer.isAvailable : true
    });
    setShowAddForm(true);
  };

  const handleDelete = async (printerId) => {
    if (window.confirm('Are you sure you want to delete this printer listing?')) {
      try {
        await deletePrinterListing(printerId);
        loadPrinters();
      } catch (error) {
        console.error('Error deleting printer:', error);
      }
    }
  };

  const toggleAvailability = async (printer) => {
    try {
      await updatePrinterListing(printer.id, { isAvailable: !printer.isAvailable });
      loadPrinters();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading your printers...</div>;
  }

  return (
    <div className="printer-management">
      <div className="page-header">
        <h1>My Printers</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          Add New Printer
        </button>
      </div>

      <div className="printers-grid">
        {printers.map(printer => (
          <div key={printer.id} className="printer-card">
            <div className="printer-card-header">
              <h3>{printer.businessName}</h3>
              <div className="printer-status">
                <span className={`status-badge ${printer.isAvailable ? 'available' : 'unavailable'}`}>
                  {printer.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>

            <div className="printer-card-content">
              <p><strong>Model:</strong> {printer.printerModel}</p>
              <p><strong>Location:</strong> {printer.location}</p>
              <p><strong>Price:</strong> ${printer.pricePerGram}/gram</p>
              <p><strong>Materials:</strong> {printer.materials?.join(', ')}</p>
              <p><strong>Bed Size:</strong> {printer.bedSize}</p>
              <p><strong>Turnaround:</strong> {printer.turnaroundTime}</p>
              <p><strong>Completed Jobs:</strong> {printer.completedJobs || 0}</p>
              {printer.rating > 0 && (
                <p><strong>Rating:</strong> ⭐ {printer.rating.toFixed(1)} ({printer.reviewCount} reviews)</p>
              )}
            </div>

            <div className="printer-card-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => handleEdit(printer)}
              >
                Edit
              </button>
              <button 
                className={`btn ${printer.isAvailable ? 'btn-warning' : 'btn-success'}`}
                onClick={() => toggleAvailability(printer)}
              >
                {printer.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(printer.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {printers.length === 0 && (
        <div className="empty-state">
          <h3>No printers listed yet</h3>
          <p>Add your first printer to start receiving print requests!</p>
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingPrinter ? 'Edit Printer' : 'Add New Printer'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPrinter(null);
                  setFormData({
                    businessName: '',
                    location: '',
                    pricePerGram: '',
                    materials: [],
                    printerModel: '',
                    bedSize: '',
                    turnaroundTime: '',
                    description: '',
                    isAvailable: true
                  });
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="printer-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price per Gram ($)</label>
                  <input
                    type="number"
                    name="pricePerGram"
                    value={formData.pricePerGram}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Printer Model</label>
                  <input
                    type="text"
                    name="printerModel"
                    value={formData.printerModel}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bed Size (e.g., 220x220x250mm)</label>
                  <input
                    type="text"
                    name="bedSize"
                    value={formData.bedSize}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Turnaround Time</label>
                  <input
                    type="text"
                    name="turnaroundTime"
                    value={formData.turnaroundTime}
                    onChange={handleInputChange}
                    placeholder="e.g., 2-3 days"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Available Materials</label>
                <div className="materials-checkboxes">
                  {availableMaterials.map(material => (
                    <label key={material} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.materials.includes(material)}
                        onChange={() => handleMaterialChange(material)}
                      />
                      {material}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                  />
                  Available for new requests
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingPrinter ? 'Update Printer' : 'Add Printer'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPrinter(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrinterManagement;
