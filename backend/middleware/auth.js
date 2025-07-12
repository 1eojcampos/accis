import { auth } from '../config/firebase.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Development mode: allow test-token for testing
  if (process.env.NODE_ENV === 'development' && token === 'test-token') {
    req.user = { 
      uid: 'test-user-id',
      email: 'test@example.com' 
    };
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
}
