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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'in-progress': return '#17a2b8';
      case 'completed': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'in-progress': return '🖨️';
      case 'completed': return '🎉';
      default: return '❓';
    }
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
          <div key={request.id} className="request-card">
            <div className="request-header">
              <div className="request-info">
                <h3>{request.fileName || 'Print Request'}</h3>
                <p className="printer-owner">Printer: {request.printerOwnerName}</p>
                <p className="request-date">Requested: {formatDate(request.createdAt)}</p>
              </div>
              <div className="request-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(request.status) }}
                >
                  {getStatusIcon(request.status)} {request.status?.toUpperCase()}
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
              <div className="progress-steps">
                <div className={`progress-step ${['pending', 'approved', 'rejected', 'in-progress', 'completed'].includes(request.status) ? 'active' : ''}`}>
                  <div className="step-icon">📝</div>
                  <div className="step-label">Submitted</div>
                </div>
                <div className={`progress-step ${['approved', 'in-progress', 'completed'].includes(request.status) ? 'active' : request.status === 'rejected' ? 'rejected' : ''}`}>
                  <div className="step-icon">{request.status === 'rejected' ? '❌' : '✅'}</div>
                  <div className="step-label">{request.status === 'rejected' ? 'Rejected' : 'Approved'}</div>
                </div>
                {request.status !== 'rejected' && (
                  <>
                    <div className={`progress-step ${['in-progress', 'completed'].includes(request.status) ? 'active' : ''}`}>
                      <div className="step-icon">🖨️</div>
                      <div className="step-label">Printing</div>
                    </div>
                    <div className={`progress-step ${request.status === 'completed' ? 'active' : ''}`}>
                      <div className="step-icon">🎉</div>
                      <div className="step-label">Completed</div>
                    </div>
                  </>
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
