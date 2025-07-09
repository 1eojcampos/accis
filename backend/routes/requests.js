import express from 'express';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all print requests for a user
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

// Create print request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      customerId: req.user.uid,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await db.collection('printRequests').add(requestData);
    res.status(201).json({ id: docRef.id, ...requestData });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create print request' });
  }
});

// Update request status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status, notes } = req.body;
    
    const updates = {
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updates.notes = notes;
    }
    
    await db.collection('printRequests').doc(requestId).update(updates);
    res.json({ id: requestId, ...updates });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

export default router;
