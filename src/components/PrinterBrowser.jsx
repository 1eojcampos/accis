import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllPrinters, createPrintRequest, getUserProfile } from '../services/firestore';
import NavigationHeader from './NavigationHeader';
import './Dashboard.css';

function PrinterBrowser({ onBack }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [printers, setPrinters] = useState([]);
  const [filteredPrinters, setFilteredPrinters] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    material: 'All',
    maxPrice: '',
    availableOnly: true,
    sortBy: 'rating'
  });
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrinters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, printers]);

  const loadPrinters = async () => {
    try {
      const allPrinters = await getAllPrinters();
      // Enrich with owner information and add avatar based on materials
      const enrichedPrinters = await Promise.all(
        allPrinters.map(async (printer) => {
          try {
            const ownerProfile = await getUserProfile(printer.ownerId);
            return {
              ...printer,
              ownerName: ownerProfile?.displayName || ownerProfile?.email || 'Unknown Owner',
              avatar: getAvatarForPrinter(printer),
              rating: printer.rating || 0,
              reviewCount: printer.reviewCount || 0,
              completedJobs: printer.completedJobs || 0
            };
          } catch (error) {
            console.error('Error fetching owner profile:', error);
            return {
              ...printer,
              ownerName: 'Unknown Owner',
              avatar: getAvatarForPrinter(printer),
              rating: printer.rating || 0,
              reviewCount: printer.reviewCount || 0,
              completedJobs: printer.completedJobs || 0
            };
          }
        })
      );
      setPrinters(enrichedPrinters);
      setFilteredPrinters(enrichedPrinters);
    } catch (error) {
      console.error('Error loading printers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarForPrinter = (printer) => {
    if (printer.materials?.includes('Resin')) return '🔬';
    if (printer.materials?.includes('TPU')) return '🎨';
    if (printer.turnaroundTime?.includes('12') || printer.turnaroundTime?.includes('24')) return '⚡';
    return '🖨️';
  };

  const applyFilters = () => {
    let filtered = [...printers];

    // Filter by availability
    if (filters.availableOnly) {
      filtered = filtered.filter(printer => printer.isAvailable);
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(printer => 
        printer.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by material
    if (filters.material !== 'All') {
      filtered = filtered.filter(printer => 
        printer.materials.includes(filters.material)
      );
    }

    // Filter by max price
    if (filters.maxPrice) {
      filtered = filtered.filter(printer => 
        printer.pricePerGram <= parseFloat(filters.maxPrice)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return a.pricePerGram - b.pricePerGram;
        case 'rating':
          return b.rating - a.rating;
        case 'turnaround':
          return a.turnaroundTime.localeCompare(b.turnaroundTime);
        default:
          return b.rating - a.rating;
      }
    });

    setFilteredPrinters(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleRequestPrint = (printer) => {
    setSelectedPrinter(printer);
    setShowRequestModal(true);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <>
        {'⭐'.repeat(fullStars)}
        {hasHalfStar && '⭐'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  const getLayerHeightFromQuality = (quality) => {
    switch (quality) {
      case 'Draft': return 0.3;
      case 'High': return 0.1;
      default: return 0.2;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading available printers...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <NavigationHeader
        title="Browse 3D Printers"
        subtitle="Find the perfect printer for your project"
        onBack={onBack}
        showBackButton={!!onBack}
      />

      <div className="printer-browser-content">
        {/* Filters Section */}
        <div className="filters-panel">
          <h3>Filter Printers</h3>
          <div className="filter-grid">
            <div className="filter-item">
              <label>Location</label>
              <input
                type="text"
                placeholder="City, State"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>Material</label>
              <select
                value={filters.material}
                onChange={(e) => handleFilterChange('material', e.target.value)}
              >
                <option value="All">All Materials</option>
                <option value="PLA">PLA</option>
                <option value="ABS">ABS</option>
                <option value="PETG">PETG</option>
                <option value="TPU">TPU</option>
                <option value="Resin">Resin</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Max Price (per gram)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.25"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="rating">Rating</option>
                <option value="price">Price (Low to High)</option>
                <option value="turnaround">Turnaround Time</option>
              </select>
            </div>
            <div className="filter-item checkbox-item">
              <label>
                <input
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
                />
                Available Only
              </label>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section">
          <div className="results-header">
            <h3>Available Printers ({filteredPrinters.length})</h3>
          </div>

          <div className="printers-grid">
            {filteredPrinters.map(printer => (
              <div key={printer.id} className="printer-listing-card">
                <div className="printer-header">
                  <div className="printer-avatar-large">
                    {printer.profileImage ? (
                      <img src={printer.profileImage} alt={printer.ownerName} />
                    ) : (
                      printer.avatar
                    )}
                  </div>
                  <div className="printer-basic-info">
                    <h4>{printer.businessName || printer.ownerName}</h4>
                    <p className="printer-owner">by {printer.ownerName}</p>
                    <p className="printer-location">📍 {printer.location}</p>
                    <div className="printer-rating-detailed">
                      <span className="stars">{renderStars(printer.rating)}</span>
                      <span className="rating-text">{printer.rating} ({printer.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="availability-badge">
                    <span className={`status-indicator ${printer.isAvailable ? 'available' : 'busy'}`}>
                      {printer.isAvailable ? '🟢 Available' : '🔴 Busy'}
                    </span>
                  </div>
                </div>

                <div className="printer-details">
                  <p className="printer-description">{printer.description}</p>
                  
                  <div className="printer-specs">
                    <div className="spec-item">
                      <strong>Printer:</strong> {printer.printerModel}
                    </div>
                    <div className="spec-item">
                      <strong>Bed Size:</strong> {printer.bedSize}
                    </div>
                    <div className="spec-item">
                      <strong>Materials:</strong> {printer.materials.join(', ')}
                    </div>
                    <div className="spec-item">
                      <strong>Turnaround:</strong> {printer.turnaroundTime}
                    </div>
                    <div className="spec-item">
                      <strong>Completed Jobs:</strong> {printer.completedJobs}
                    </div>
                  </div>
                </div>

                <div className="printer-footer">
                  <div className="pricing">
                    <span className="price">${printer.pricePerGram}/gram</span>
                  </div>
                  <button
                    className={`request-button ${!printer.isAvailable ? 'disabled' : ''}`}
                    onClick={() => handleRequestPrint(printer)}
                    disabled={!printer.isAvailable}
                  >
                    {printer.isAvailable ? 'Request Print' : 'Not Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPrinters.length === 0 && (
            <div className="no-results">
              <h3>No printers found</h3>
              <p>Try adjusting your filters to see more results.</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Request Modal */}
      {showRequestModal && selectedPrinter && (
        <PrintRequestModal
          printer={selectedPrinter}
          currentUser={currentUser}
          onClose={() => setShowRequestModal(false)}
          onSubmit={async (requestData) => {
            try {
              await createPrintRequest({
                printerId: selectedPrinter.id,
                printerOwnerId: selectedPrinter.ownerId,
                customerId: currentUser.uid,
                fileName: requestData.fileName,
                material: requestData.material,
                quantity: requestData.quantity,
                layerHeight: getLayerHeightFromQuality(requestData.quality),
                priority: requestData.urgency,
                specialInstructions: requestData.notes,
                estimatedPrice: requestData.estimatedPrice,
                infill: 20 // Default infill percentage
              });
              alert('Print request sent successfully!');
              setShowRequestModal(false);
            } catch (error) {
              console.error('Error sending print request:', error);
              alert('Failed to send print request. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
}

// Print Request Modal Component
function PrintRequestModal({ printer, currentUser, onClose, onSubmit }) {
  const [requestData, setRequestData] = useState({
    file: null,
    fileName: '',
    material: printer.materials[0] || 'PLA',
    quantity: 1,
    quality: 'Standard',
    notes: '',
    urgency: 'Normal'
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRequestData(prev => ({
        ...prev,
        file: file,
        fileName: file.name
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestData.file) {
      alert('Please upload a 3D model file');
      return;
    }
    
    const submissionData = {
      ...requestData,
      estimatedPrice: parseFloat(estimatedCost)
    };
    
    onSubmit(submissionData);
  };

  const estimatedCost = (requestData.quantity * 50 * printer.pricePerGram).toFixed(2); // Assuming 50g average

  return (
    <div className="modal-overlay">
      <div className="modal-content print-request-modal">
        <div className="modal-header">
          <h3>Request Print from {printer.businessName}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-section">
            <h4>3D Model File</h4>
            <div className="file-upload-area">
              <input
                type="file"
                accept=".stl,.obj,.3mf,.ply"
                onChange={handleFileUpload}
                required
              />
              {requestData.fileName && (
                <p className="uploaded-file">✅ {requestData.fileName}</p>
              )}
              <p className="file-info">Supported formats: STL, OBJ, 3MF, PLY (Max 50MB)</p>
            </div>
          </div>

          <div className="form-section">
            <h4>Print Specifications</h4>
            <div className="form-grid">
              <div className="form-item">
                <label>Material</label>
                <select
                  value={requestData.material}
                  onChange={(e) => setRequestData(prev => ({ ...prev, material: e.target.value }))}
                >
                  {printer.materials.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
              <div className="form-item">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={requestData.quantity}
                  onChange={(e) => setRequestData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                />
              </div>
              <div className="form-item">
                <label>Quality</label>
                <select
                  value={requestData.quality}
                  onChange={(e) => setRequestData(prev => ({ ...prev, quality: e.target.value }))}
                >
                  <option value="Draft">Draft (0.3mm)</option>
                  <option value="Standard">Standard (0.2mm)</option>
                  <option value="High">High (0.1mm)</option>
                </select>
              </div>
              <div className="form-item">
                <label>Urgency</label>
                <select
                  value={requestData.urgency}
                  onChange={(e) => setRequestData(prev => ({ ...prev, urgency: e.target.value }))}
                >
                  <option value="Normal">Normal</option>
                  <option value="Rush">Rush (+50%)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Additional Notes</h4>
            <textarea
              placeholder="Any special instructions or requirements..."
              value={requestData.notes}
              onChange={(e) => setRequestData(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
            />
          </div>

          <div className="cost-estimate">
            <h4>Estimated Cost: ${estimatedCost}</h4>
            <p>*Final cost will be determined by the printer based on actual model size</p>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PrinterBrowser;
