import express from 'express';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.stl', '.obj', '.3mf', '.gcode'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only 3D model files are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get all print requests for a customer
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const requestsRef = db.collection('printRequests');
    const snapshot = await requestsRef
      .where('customerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get available orders for providers to accept
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { location } = req.query;
    let query = db.collection('printRequests')
      .where('status', '==', 'quote-requested')
      .limit(50); // Limit to 50 recent orders
    
    const snapshot = await query.get();
    const requests = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Don't show requests to the customer who created them
      if (data.customerId !== req.user.uid) {
        // Apply location filter in memory if specified
        if (!location || data.location === location) {
          requests.push({ id: doc.id, ...data });
        }
      }
    });
    
    // Sort by createdAt in memory
    requests.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return bDate - aDate;
    });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching available requests:', error);
    res.status(500).json({ error: 'Failed to fetch available requests' });
  }
});

// Get orders assigned to provider
router.get('/provider-orders', authenticateToken, async (req, res) => {
  try {
    const requestsRef = db.collection('printRequests');
    const snapshot = await requestsRef
      .where('providerId', '==', req.user.uid)
      .limit(50)
      .get();
    
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by createdAt in memory
    requests.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return bDate - aDate;
    });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching provider orders:', error);
    res.status(500).json({ error: 'Failed to fetch provider orders' });
  }
});

// Create print request/order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      files,
      material,
      quality,
      quantity,
      requirements,
      location,
      estimatedCost,
      estimatedTimeline
    } = req.body;

    // Validate required fields
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' });
    }
    if (!material) {
      return res.status(400).json({ error: 'Material selection is required' });
    }
    if (!quality) {
      return res.status(400).json({ error: 'Quality selection is required' });
    }

    const requestData = {
      customerId: req.user.uid,
      files: files,
      material,
      quality,
      quantity: quantity || 1,
      requirements: requirements || '',
      location: location || '',
      estimatedCost: estimatedCost || 0,
      estimatedTimeline: estimatedTimeline || 0,
      status: 'quote-requested',
      createdAt: new Date(),
      updatedAt: new Date(),
      providerId: null,
      providerNotes: null,
      actualCost: null,
      actualTimeline: null
    };
    
    const docRef = await db.collection('printRequests').add(requestData);
    res.status(201).json({ id: docRef.id, ...requestData });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create print request' });
  }
});

// Provider submits a quote for an order
router.put('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { action, quoteAmount, estimatedDelivery, notes } = req.body;
    
    // Debug: Log the received data
    console.log('Received payload:', req.body);
    console.log('Extracted fields:', { action, quoteAmount, estimatedDelivery, notes });
    
    // Support both legacy "accept/reject" and new "quote" action
    if (!['accept', 'reject', 'quote'].includes(action)) {
      console.log('Invalid action received:', action);
      return res.status(400).json({ error: 'Action must be either "accept", "reject", or "quote"' });
    }

    // Get the request first to check if it's still available
    const requestDoc = await db.collection('printRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Print request not found' });
    }

    const requestData = requestDoc.data();
    console.log('Request data found:', {
      id: requestId,
      status: requestData.status,
      customerId: requestData.customerId,
      hasProviderId: !!requestData.providerId
    });
    
    if (requestData.status !== 'quote-requested') {
      console.log('Request not available - current status:', requestData.status);
      return res.status(400).json({ error: 'This request is no longer available' });
    }

    // Don't allow customer to respond to their own request
    if (requestData.customerId === req.user.uid) {
      console.log('User trying to respond to own request:', {
        requestCustomerId: requestData.customerId,
        currentUserId: req.user.uid
      });
      return res.status(400).json({ error: 'Cannot respond to your own request' });
    }

    console.log('User validation passed:', {
      requestCustomerId: requestData.customerId,
      currentUserId: req.user.uid,
      action: action
    });

    let updates = {
      providerId: req.user.uid,
      providerNotes: notes || null,
      updatedAt: new Date()
    };

    if (action === 'quote') {
      // New quote submission workflow
      if (!quoteAmount) {
        console.log('Quote amount missing:', quoteAmount);
        return res.status(400).json({ error: 'Quote amount is required' });
      }

      // Validate quote amount is a valid number
      const amount = parseFloat(quoteAmount);
      if (isNaN(amount) || amount <= 0) {
        console.log('Invalid quote amount:', quoteAmount, 'parsed as:', amount);
        return res.status(400).json({ error: 'Quote amount must be a valid positive number' });
      }

      // Enhanced quote structure
      const quoteData = {
        amount: parseFloat(quoteAmount),
        deliveryTime: estimatedDelivery || '3-5 business days',
        notes: notes || '',
        submittedAt: new Date().toISOString(),
        providerId: req.user.uid,
        providerName: req.user.displayName || 'Provider',
        breakdown: [
          { item: 'Material and printing', cost: parseFloat(quoteAmount) * 0.8 },
          { item: 'Labor and setup', cost: parseFloat(quoteAmount) * 0.2 }
        ],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      // Status history entry
      const statusEntry = {
        status: 'quote-submitted',
        timestamp: new Date().toISOString(),
        updatedBy: req.user.uid,
        actor: req.user.uid,
        notes: `Quote submitted: $${parseFloat(quoteAmount)}`
      };

      updates = {
        ...updates,
        status: 'quote-submitted',
        quote: quoteData,
        quoteAmount: parseFloat(quoteAmount),
        estimatedDeliveryTime: estimatedDelivery,
        quotedAt: new Date(),
        statusHistory: [...(requestData.statusHistory || []), statusEntry]
      };

      // Update budget in enhanced schema if it exists
      if (requestData.budget) {
        updates['budget.quoted'] = parseFloat(quoteAmount);
      }

      // Update timeline in enhanced schema if it exists  
      if (requestData.timeline && estimatedDelivery) {
        const daysDiff = Math.ceil((new Date(estimatedDelivery).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        updates['timeline.estimated'] = Math.max(1, daysDiff);
      }

    } else {
      // Legacy accept/reject workflow
      if (action === 'accept') {
        const { quotedPrice, quotedTimeline } = req.body;
        
        // If quotedPrice is provided, treat this as a quote submission (accept with quote)
        if (quotedPrice) {
          // Validate quote amount is a valid number
          const amount = parseFloat(quotedPrice);
          if (isNaN(amount) || amount <= 0) {
            console.log('Invalid quoted price:', quotedPrice, 'parsed as:', amount);
            return res.status(400).json({ error: 'Quoted price must be a valid positive number' });
          }

          // Enhanced quote structure for legacy accept-with-quote
          const quoteData = {
            amount: amount,
            deliveryTime: quotedTimeline || '3-5 business days',
            notes: notes || '',
            submittedAt: new Date().toISOString(),
            providerId: req.user.uid,
            providerName: req.user.displayName || 'Provider',
            breakdown: [
              { item: 'Material and printing', cost: amount * 0.8 },
              { item: 'Labor and setup', cost: amount * 0.2 }
            ],
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          };

          // Status history entry
          const statusEntry = {
            status: 'quote-submitted',
            timestamp: new Date().toISOString(),
            updatedBy: req.user.uid,
            actor: req.user.uid,
            notes: `Quote submitted via accept: $${amount}`
          };

          updates = {
            ...updates,
            status: 'quote-submitted', // Use quote-submitted status for customer dashboard compatibility
            quote: quoteData,
            quoteAmount: amount,        // Customer dashboard expects quoteAmount
            estimatedDeliveryTime: quotedTimeline, // Customer dashboard expects estimatedDeliveryTime
            quotedAt: new Date(),
            statusHistory: [...(requestData.statusHistory || []), statusEntry],
            // Keep legacy fields for backward compatibility
            actualCost: amount,
            actualTimeline: quotedTimeline
          };

          // Update budget in enhanced schema if it exists
          if (requestData.budget) {
            updates['budget.quoted'] = amount;
          }

          // Update timeline in enhanced schema if it exists  
          if (requestData.timeline && quotedTimeline) {
            const daysDiff = Math.ceil((new Date(quotedTimeline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            updates['timeline.estimated'] = Math.max(1, daysDiff);
          }
        } else {
          // Standard accept without quote (legacy behavior)
          updates.status = 'accepted';
        }
      } else {
        // Reject workflow
        updates.status = 'rejected';
      }
    }
    
    console.log('Final updates object for request', requestId, ':', JSON.stringify(updates, null, 2));
    
    await db.collection('printRequests').doc(requestId).update(updates);
    
    console.log('Successfully updated request:', requestId, 'with status:', updates.status);
    
    res.json({ id: requestId, ...updates });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});

// Update request status (for both customer and provider)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status, notes } = req.body;
    
    // Get the request first to check permissions
    const requestDoc = await db.collection('printRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Print request not found' });
    }

    const requestData = requestDoc.data();
    const isCustomer = requestData.customerId === req.user.uid;
    const isProvider = requestData.providerId === req.user.uid;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }

    const updates = {
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      if (isProvider) {
        updates.providerNotes = notes;
      } else {
        updates.customerNotes = notes;
      }
    }
    
    await db.collection('printRequests').doc(requestId).update(updates);
    res.json({ id: requestId, ...updates });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Upload files for an order
router.post('/:id/files', authenticateToken, upload.array('files'), async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Get the request first to check permissions
    const requestDoc = await db.collection('printRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Print request not found' });
    }

    const requestData = requestDoc.data();
    if (requestData.customerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to upload files for this request' });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      uploadedAt: new Date()
    }));

    const updates = {
      files: [...(requestData.files || []), ...uploadedFiles],
      updatedAt: new Date()
    };
    
    await db.collection('printRequests').doc(requestId).update(updates);
    res.json({ id: requestId, files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

export default router;
