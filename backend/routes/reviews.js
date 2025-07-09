import express from 'express';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Submit review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reviewData = {
      ...req.body,
      customerId: req.user.uid,
      createdAt: new Date()
    };
    
    const docRef = await db.collection('reviews').add(reviewData);
    
    // Mark request as reviewed
    if (req.body.requestId) {
      await db.collection('printRequests').doc(req.body.requestId).update({
        reviewSubmitted: true,
        reviewId: docRef.id
      });
    }
    
    res.status(201).json({ id: docRef.id, ...reviewData });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get printer reviews
router.get('/printer/:printerId', async (req, res) => {
  try {
    const printerId = req.params.printerId;
    const reviewsRef = db.collection('reviews');
    const snapshot = await reviewsRef
      .where('printerId', '==', printerId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

export default router;
