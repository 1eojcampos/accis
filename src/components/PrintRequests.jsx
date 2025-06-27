import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPrintersByOwner, 
  subscribeToPrintRequests, 
  updatePrintRequestStatus,
  getUserProfile
} from '../services/firestore';
import './Dashboard.css';

function PrintRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [unsubscribes, setUnsubscribes] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    loadPrintersAndRequests();
    return () => {
      // Cleanup subscriptions
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  useEffect(() => {
    filterRequests();
  }, [selectedPrinter]);

  const loadPrintersAndRequests = async () => {
    try {
      if (currentUser) {
        // Get user's printers
        const printerListings = await getPrintersByOwner(currentUser.uid);
        setPrinters(printerListings);

        // Subscribe to print requests for all printers
        const newUnsubscribes = [];
        let allRequests = [];

        for (const printer of printerListings) {
          const unsubscribe = subscribeToPrintRequests(printer.id, async (printerRequests) => {
            // Enrich requests with customer info
            const enrichedRequests = await Promise.all(
              printerRequests.map(async (request) => {
                try {
                  const customerProfile = await getUserProfile(request.customerId);
                  return {
                    ...request,
                    customerName: customerProfile?.displayName || customerProfile?.email || 'Unknown Customer',
                    printerName: printer.businessName
                  };
                } catch (error) {
                  console.error('Error fetching customer profile:', error);
                  return {
                    ...request,
                    customerName: 'Unknown Customer',
                    printerName: printer.businessName
                  };
                }
              })
            );

            // Update the all requests array
            allRequests = allRequests.filter(req => req.printerId !== printer.id);
            allRequests = [...allRequests, ...enrichedRequests];
            
            // Sort by creation date
            allRequests.sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return b.createdAt.toDate() - a.createdAt.toDate();
              }
              return 0;
            });

            setRequests([...allRequests]);
          });
          newUnsubscribes.push(unsubscribe);
        }

        setUnsubscribes(newUnsubscribes);
      }
    } catch (error) {
      console.error('Error loading printers and requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    // This is handled by the subscription callbacks above
    // But we keep this for potential future filtering logic
  };

  const handleRequestAction = async (requestId, action, notes = '') => {
    try {
      setProcessingRequest(requestId);
      const updates = { notes };
      await updatePrintRequestStatus(requestId, action, updates);
      
      // Show success message based on action
      const messages = {
        'approved': 'Request approved successfully! 🎉',
        'rejected': 'Request rejected.',
        'in-progress': 'Request marked as in progress! 🖨️',
        'completed': 'Request marked as completed! ✅'
      };
      
      if (messages[action]) {
        // You could replace this with a better notification system
        setTimeout(() => {
          console.log(messages[action]);
        }, 100);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

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

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Unknown';
    return timestamp.toDate().toLocaleDateString() + ' ' + timestamp.toDate().toLocaleTimeString();
  };

  const filteredRequests = selectedPrinter === 'all' 
    ? requests 
    : requests.filter(req => req.printerId === selectedPrinter);

  if (loading) {
    return <div className="loading">Loading print requests...</div>;
  }

  return (
    <div className="print-requests">
      <div className="page-header">
        <h1>Print Requests</h1>
        <div className="filter-controls">
          <select 
            value={selectedPrinter} 
            onChange={(e) => setSelectedPrinter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Printers</option>
            {printers.map(printer => (
              <option key={printer.id} value={printer.id}>
                {printer.businessName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="requests-list">
        {filteredRequests.map(request => (
          <div key={request.id} className="request-card">
            <div className="request-header">
              <div className="request-info">
                <h3>{request.fileName || 'Print Request'}</h3>
                <p className="customer-name">From: {request.customerName}</p>
                <p className="printer-name">Printer: {request.printerName}</p>
              </div>
              <div className="request-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(request.status) }}
                >
                  {request.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="request-details">
              <div className="detail-row">
                <span><strong>Material:</strong> {request.material}</span>
                <span><strong>Infill:</strong> {request.infill}%</span>
              </div>
              <div className="detail-row">
                <span><strong>Layer Height:</strong> {request.layerHeight}mm</span>
                <span><strong>Priority:</strong> {request.priority}</span>
              </div>
              <div className="detail-row">
                <span><strong>Quantity:</strong> {request.quantity}</span>
                <span><strong>Estimated Price:</strong> ${request.estimatedPrice}</span>
              </div>
              <div className="detail-row">
                <span><strong>Requested:</strong> {formatDate(request.createdAt)}</span>
              </div>
              {request.specialInstructions && (
                <div className="special-instructions">
                  <strong>Special Instructions:</strong>
                  <p>{request.specialInstructions}</p>
                </div>
              )}
              {request.notes && (
                <div className="request-notes">
                  <strong>Notes:</strong>
                  <p>{request.notes}</p>
                </div>
              )}
            </div>

            {request.status === 'pending' && (
              <div className="request-actions">
                <button 
                  className="btn btn-success"
                  disabled={processingRequest === request.id}
                  onClick={() => {
                    const notes = prompt('Any notes for the customer? (Optional)');
                    handleRequestAction(request.id, 'approved', notes || '');
                  }}
                >
                  {processingRequest === request.id ? 'Processing...' : 'Approve'}
                </button>
                <button 
                  className="btn btn-danger"
                  disabled={processingRequest === request.id}
                  onClick={() => {
                    const notes = prompt('Reason for rejection? (Optional)');
                    handleRequestAction(request.id, 'rejected', notes || '');
                  }}
                >
                  {processingRequest === request.id ? 'Processing...' : 'Reject'}
                </button>
              </div>
            )}

            {request.status === 'approved' && (
              <div className="request-actions">
                <button 
                  className="btn btn-info"
                  disabled={processingRequest === request.id}
                  onClick={() => handleRequestAction(request.id, 'in-progress')}
                >
                  {processingRequest === request.id ? 'Processing...' : 'Start Printing'}
                </button>
              </div>
            )}

            {request.status === 'rejected' && (
              <div className="request-status-info">
                <p className="status-message rejected">
                  ❌ This request has been rejected.
                  {request.notes && (
                    <span className="rejection-reason"> Reason: {request.notes}</span>
                  )}
                </p>
              </div>
            )}

            {request.status === 'in-progress' && (
              <div className="request-actions">
                <button 
                  className="btn btn-success"
                  disabled={processingRequest === request.id}
                  onClick={() => {
                    const notes = prompt('Any completion notes? (Optional)');
                    handleRequestAction(request.id, 'completed', notes || '');
                  }}
                >
                  {processingRequest === request.id ? 'Processing...' : 'Mark Complete'}
                </button>
              </div>
            )}

            {request.status === 'completed' && (
              <div className="request-status-info">
                <p className="status-message completed">
                  🎉 This request has been completed successfully!
                  {request.notes && (
                    <span className="completion-notes"> Notes: {request.notes}</span>
                  )}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="empty-state">
          <h3>No print requests yet</h3>
          <p>Print requests will appear here when customers send them to your printers.</p>
        </div>
      )}
    </div>
  );
}

export default PrintRequests;
