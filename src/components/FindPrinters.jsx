import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCustomerRequests, getUserProfile } from '../services/firestore';
import './Dashboard.css';

function MyRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeToCustomerRequests(currentUser.uid, async (customerRequests) => {
        // Enrich requests with printer owner info
        const enrichedRequests = await Promise.all(
          customerRequests.map(async (request) => {
            try {
              const printerOwner = await getUserProfile(request.printerOwnerId);
              return {
                ...request,
                printerOwnerName: printerOwner?.displayName || printerOwner?.email || 'Unknown Printer Owner'
              };
            } catch (error) {
              console.error('Error fetching printer owner profile:', error);
              return {
                ...request,
                printerOwnerName: 'Unknown Printer Owner'
              };
            }
          })
        );
        
        setRequests(enrichedRequests);
        setLoading(false);
      });
      
      setUnsubscribe(() => unsub);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const getProgressSteps = (status) => {
    const allSteps = [
      { id: 'submitted', icon: '📝', label: 'Submitted', alwaysShow: true },
      { id: 'decision', icon: status === 'rejected' ? '❌' : '✅', label: status === 'rejected' ? 'Rejected' : 'Approved', alwaysShow: true },
      { id: 'printing', icon: '🖨️', label: 'Printing', showIf: status !== 'rejected' },
      { id: 'completed', icon: '🎉', label: 'Completed', showIf: status !== 'rejected' }
    ];

    return allSteps.filter(step => step.alwaysShow || step.showIf);
  };

  const getStepStatus = (stepId, requestStatus) => {
    const statusOrder = ['pending', 'approved', 'in-progress', 'completed'];
    const stepOrder = ['submitted', 'decision', 'printing', 'completed'];
    
    if (requestStatus === 'rejected') {
      if (stepId === 'submitted' || stepId === 'decision') return 'active';
      return 'inactive';
    }
    
    const currentStatusIndex = statusOrder.indexOf(requestStatus);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex <= currentStatusIndex) return 'active';
    return 'inactive';
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Unknown';
    return timestamp.toDate().toLocaleDateString() + ' ' + timestamp.toDate().toLocaleTimeString();
  };

  if (loading) {
    return <div className="loading">Loading your requests...</div>;
  }

  return (
    <div className="my-requests">
      <div className="page-header">
        <h1>My Print Requests</h1>
      </div>

      <div className="requests-list">
        {requests.map(request => (
          <div key={request.id} className="request-card" data-status={request.status}>
            <div className="request-header">
              <div className="request-info">
                <h3>{request.fileName || 'Print Request'}</h3>
                <p className="printer-owner">Printer: {request.printerOwnerName}</p>
                <p className="request-date">Requested: {formatDate(request.createdAt)}</p>
              </div>
              <div className="request-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: 
                    request.status === 'pending' ? '#ffa500' :
                    request.status === 'approved' ? '#28a745' :
                    request.status === 'rejected' ? '#dc3545' :
                    request.status === 'in-progress' ? '#17a2b8' :
                    request.status === 'completed' ? '#6f42c1' : '#6c757d'
                  }}
                >
                  {request.status === 'pending' ? '⏳' :
                   request.status === 'approved' ? '✅' :
                   request.status === 'rejected' ? '❌' :
                   request.status === 'in-progress' ? '🖨️' :
                   request.status === 'completed' ? '🎉' : '❓'} {request.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="request-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>Material:</strong> {request.material}
                </div>
                <div className="detail-item">
                  <strong>Infill:</strong> {request.infill}%
                </div>
                <div className="detail-item">
                  <strong>Layer Height:</strong> {request.layerHeight}mm
                </div>
                <div className="detail-item">
                  <strong>Priority:</strong> {request.priority}
                </div>
                <div className="detail-item">
                  <strong>Quantity:</strong> {request.quantity}
                </div>
                <div className="detail-item">
                  <strong>Estimated Price:</strong> ${request.estimatedPrice}
                </div>
              </div>

              {request.specialInstructions && (
                <div className="special-instructions">
                  <strong>Special Instructions:</strong>
                  <p>{request.specialInstructions}</p>
                </div>
              )}

              {request.notes && (
                <div className="printer-notes">
                  <strong>Printer Notes:</strong>
                  <p>{request.notes}</p>
                </div>
              )}
            </div>

            <div className="request-progress">
              <h4>Request Progress</h4>
              <div className="progress-steps">
                {getProgressSteps(request.status).map((step, index) => {
                  const stepStatus = getStepStatus(step.id, request.status);
                  const isRejected = request.status === 'rejected' && step.id === 'decision';
                  
                  return (
                    <div 
                      key={step.id} 
                      className={`progress-step ${stepStatus === 'active' ? 'active' : ''} ${isRejected ? 'rejected' : ''}`}
                    >
                      <div className="step-icon">{step.icon}</div>
                      <div className="step-label">{step.label}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Status message for current step */}
              <div className={`current-status ${request.status}`}>
                {request.status === 'pending' && (
                  <p className="status-description">
                    🕐 Your request is pending review. The printer will approve or reject it soon.
                  </p>
                )}
                {request.status === 'approved' && (
                  <p className="status-description">
                    ✅ Great! Your request has been approved and will start printing soon.
                  </p>
                )}
                {request.status === 'rejected' && (
                  <p className="status-description">
                    ❌ Unfortunately, your request was rejected. {request.notes && `Reason: ${request.notes}`}
                  </p>
                )}
                {request.status === 'in-progress' && (
                  <p className="status-description">
                    🖨️ Your model is currently being printed! This may take some time.
                  </p>
                )}
                {request.status === 'completed' && (
                  <p className="status-description">
                    🎉 Congratulations! Your print has been completed successfully. {request.notes && `Notes: ${request.notes}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="empty-state">
          <h3>No print requests yet</h3>
          <p>Your print requests will appear here once you start sending them to printers.</p>
        </div>
      )}
    </div>
  );
}

export default MyRequests;