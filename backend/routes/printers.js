import express from 'express';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get printers by owner (for provider management)
router.get('/my-printers', authenticateToken, async (req, res) => {
  try {
    const printersRef = db.collection('printers');
    const snapshot = await printersRef.where('ownerId', '==', req.user.uid).get();
    
    const printers = [];
    snapshot.forEach(doc => {
      printers.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(printers);
  } catch (error) {
    console.error('Error fetching user printers:', error);
    res.status(500).json({ error: 'Failed to fetch your printers' });
  }
});

// Get all printers with optional location filtering
router.get('/', async (req, res) => {
  try {
    const { location, maxDistance } = req.query;
    const printersRef = db.collection('printers');
    let query = printersRef.where('isActive', '==', true);
    
    const snapshot = await query.get();
    
    let printers = [];
    snapshot.forEach(doc => {
      printers.push({ id: doc.id, ...doc.data() });
    });

    // If location filtering is requested
    if (location) {
      printers = printers.filter(printer => {
        if (!printer.location) return false;
        
        // Simple string matching for location (can be enhanced with geographic coordinates later)
        const printerLocation = printer.location.toLowerCase();
        const searchLocation = location.toLowerCase();
        
        return printerLocation.includes(searchLocation) || 
               searchLocation.includes(printerLocation);
      });
    }
    
    res.json(printers);
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

// Create printer listing
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { location, ...otherData } = req.body;
    
    // Validate required fields
    if (!location || location.trim() === '') {
      return res.status(400).json({ error: 'Location is required for printer listing' });
    }
    
    const printerData = {
      ...otherData,
      location: location.trim(),
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
    const { location, ...otherUpdates } = req.body;
    
    const updates = {
      ...otherUpdates,
      updatedAt: new Date()
    };
    
    // Add location if provided
    if (location !== undefined) {
      if (location.trim() === '') {
        return res.status(400).json({ error: 'Location cannot be empty' });
      }
      updates.location = location.trim();
    }
    
    await db.collection('printers').doc(printerId).update(updates);
    res.json({ id: printerId, ...updates });
  } catch (error) {
    console.error('Error updating printer:', error);
    res.status(500).json({ error: 'Failed to update printer' });
  }
});

// Delete printer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const printerId = req.params.id;
    
    // Check if printer exists and belongs to the user
    const printerDoc = await db.collection('printers').doc(printerId).get();
    if (!printerDoc.exists) {
      return res.status(404).json({ error: 'Printer not found' });
    }
    
    const printerData = printerDoc.data();
    if (printerData.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to delete this printer' });
    }
    
    await db.collection('printers').doc(printerId).delete();
    res.json({ message: 'Printer deleted successfully' });
  } catch (error) {
    console.error('Error deleting printer:', error);
    res.status(500).json({ error: 'Failed to delete printer' });
  }
});

export default router;
