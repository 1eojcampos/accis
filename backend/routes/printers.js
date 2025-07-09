import express from 'express';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all printers
router.get('/', async (req, res) => {
  try {
    const printersRef = db.collection('printers');
    const snapshot = await printersRef.where('isActive', '==', true).get();
    
    const printers = [];
    snapshot.forEach(doc => {
      printers.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(printers);
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

// Create printer listing
router.post('/', authenticateToken, async (req, res) => {
  try {
    const printerData = {
      ...req.body,
      ownerId: req.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    const docRef = await db.collection('printers').add(printerData);
    res.status(201).json({ id: docRef.id, ...printerData });
  } catch (error) {
    console.error('Error creating printer:', error);
    res.status(500).json({ error: 'Failed to create printer listing' });
  }
});

// Update printer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const printerId = req.params.id;
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    
    await db.collection('printers').doc(printerId).update(updates);
    res.json({ id: printerId, ...updates });
  } catch (error) {
    console.error('Error updating printer:', error);
    res.status(500).json({ error: 'Failed to update printer' });
  }
});

export default router;
