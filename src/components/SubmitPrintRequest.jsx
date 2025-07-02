import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createPrintRequest } from '../services/firestore';
import NavigationHeader from './NavigationHeader';
import './Dashboard.css';

const SubmitPrintRequest = ({ onBack, onSuccess, initialUrl = '' }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    modelUrl: initialUrl,
    modelTitle: '',
    description: '',
    quantity: 1,
    material: 'PLA',
    infill: '20%',
    urgency: 'normal',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const materials = [
    'PLA', 'ABS', 'PETG', 'TPU', 'Wood Fill', 'Metal Fill', 'Carbon Fiber', 'Other'
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low Priority (1-2 weeks)' },
    { value: 'normal', label: 'Normal (3-7 days)' },
    { value: 'high', label: 'High Priority (1-3 days)' },
    { value: 'urgent', label: 'Urgent (24-48 hours)' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.modelUrl.trim()) {
      newErrors.modelUrl = 'Model URL is required';
    } else if (!isValidUrl(formData.modelUrl)) {
      newErrors.modelUrl = 'Please enter a valid URL';
    }
    
    if (!formData.modelTitle.trim()) {
      newErrors.modelTitle = 'Model title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.quantity < 1 || formData.quantity > 100) {
      newErrors.quantity = 'Quantity must be between 1 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const requestData = {
        customerId: currentUser.uid,
        customerEmail: currentUser.email,
        customerName: currentUser.displayName || currentUser.email,
        modelTitle: formData.modelTitle,
        modelUrl: formData.modelUrl,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        material: formData.material,
        infill: formData.infill,
        urgency: formData.urgency,
        notes: formData.notes,
        sourceType: 'custom_link',
        modelThumbnail: null,
        modelAuthor: null,
        modelPrice: null
      };

      const requestId = await createPrintRequest(requestData);
      
      if (onSuccess) {
        onSuccess(requestId);
      } else {
        alert(`Print request submitted successfully! Request ID: ${requestId}\\n\\nPrinters will be able to see your request and provide quotes.`);
        // Reset form
        setFormData({
          modelUrl: '',
          modelTitle: '',
          description: '',
          quantity: 1,
          material: 'PLA',
          infill: '20%',
          urgency: 'normal',
          notes: ''
        });
      }
      
    } catch (error) {
      console.error('Error creating print request:', error);
      alert('Failed to submit print request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract meaningful parts from common 3D model sites
      if (pathname.includes('/thing:')) {
        // Thingiverse format
        const match = pathname.match(/thing:(\\d+)/);
        return match ? `Thingiverse Model ${match[1]}` : '';
      } else if (pathname.includes('/object/')) {
        // MyMiniFactory format
        const parts = pathname.split('/');
        const objectIndex = parts.indexOf('object');
        return parts[objectIndex + 1] ? `Model: ${parts[objectIndex + 1].replace(/-/g, ' ')}` : '';
      }
      
      // Generic extraction from URL
      const parts = pathname.split('/').filter(part => part && part !== '');
      const lastPart = parts[parts.length - 1];
      return lastPart ? lastPart.replace(/[-_]/g, ' ').replace(/\\.(html|php|asp)$/i, '') : '';
    } catch {
      return '';
    }
  };

  const handleUrlBlur = () => {
    if (formData.modelUrl && !formData.modelTitle) {
      const extractedTitle = extractTitleFromUrl(formData.modelUrl);
      if (extractedTitle) {
        handleInputChange('modelTitle', extractedTitle);
      }
    }
  };

  return (
    <div className="submit-print-request">
      <NavigationHeader
        title="Submit Print Request"
        subtitle="Request a quote for 3D printing from a model link"
        onBack={onBack}
        showBackButton={!!onBack}
      />

      <div className="dashboard-card">
        <form onSubmit={handleSubmit} className="print-request-form">
          {/* Model Information */}
          <div className="form-section">
            <h3>📦 Model Information</h3>
            
            <div className="form-group">
              <label htmlFor="modelUrl">Model URL *</label>
              <input
                id="modelUrl"
                type="url"
                placeholder="https://www.thingiverse.com/thing:123456 or any 3D model link"
                value={formData.modelUrl}
                onChange={(e) => handleInputChange('modelUrl', e.target.value)}
                onBlur={handleUrlBlur}
                className={errors.modelUrl ? 'error' : ''}
                required
              />
              {errors.modelUrl && <span className="error-text">{errors.modelUrl}</span>}
              <small className="help-text">
                Link to the 3D model from Thingiverse, MyMiniFactory, Printables, or any other site
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="modelTitle">Model Title *</label>
              <input
                id="modelTitle"
                type="text"
                placeholder="e.g., Phone Stand, Miniature Figure, Decorative Vase"
                value={formData.modelTitle}
                onChange={(e) => handleInputChange('modelTitle', e.target.value)}
                className={errors.modelTitle ? 'error' : ''}
                required
              />
              {errors.modelTitle && <span className="error-text">{errors.modelTitle}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                placeholder="Describe what you want to print, any specific requirements, colors, etc."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'error' : ''}
                rows="3"
                required
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>
          </div>

          {/* Print Settings */}
          <div className="form-section">
            <h3>⚙️ Print Settings</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className={errors.quantity ? 'error' : ''}
                  required
                />
                {errors.quantity && <span className="error-text">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="material">Preferred Material</label>
                <select
                  id="material"
                  value={formData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                >
                  {materials.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="infill">Infill Percentage</label>
                <select
                  id="infill"
                  value={formData.infill}
                  onChange={(e) => handleInputChange('infill', e.target.value)}
                >
                  <option value="10%">10% (Lightweight)</option>
                  <option value="15%">15% (Standard)</option>
                  <option value="20%">20% (Recommended)</option>
                  <option value="25%">25% (Strong)</option>
                  <option value="50%">50% (Very Strong)</option>
                  <option value="100%">100% (Solid)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="urgency">Urgency Level</label>
                <select
                  id="urgency"
                  value={formData.urgency}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                >
                  {urgencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="form-section">
            <h3>📝 Additional Notes</h3>
            
            <div className="form-group">
              <label htmlFor="notes">Special Instructions (Optional)</label>
              <textarea
                id="notes"
                placeholder="Any special requirements, color preferences, delivery instructions, etc."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows="3"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="action-button primary large"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>⏳ Submitting...</>
              ) : (
                <>📤 Submit Print Request</>
              )}
            </button>
            {onBack && (
              <button
                type="button"
                className="action-button secondary"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitPrintRequest;
