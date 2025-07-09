import express from 'express';
import { auth } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    res.json({ 
      valid: true, 
      uid: decodedToken.uid,
      email: decodedToken.email 
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

export default router;
