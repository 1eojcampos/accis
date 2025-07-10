import express from 'express';
import { auth, db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Helper function to generate verification token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    if (!['customer', 'provider'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Generate email verification token
    const verificationToken = generateToken();
    const verificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      emailVerified: false,
      verificationToken,
      verificationExpiry,
      createdAt: Date.now()
    });

    // TODO: Send verification email with token
    // You would typically integrate with your email service here

    res.status(201).json({ 
      message: 'User created successfully',
      userId: userRecord.uid
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Signin endpoint
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Verify with Firebase Auth
    const userCredential = await auth.getUserByEmail(email);
    
    if (!userCredential.emailVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userCredential.uid).get();
    const userData = userDoc.data();

    // Create custom token
    const token = await auth.createCustomToken(userCredential.uid);

    res.json({
      token,
      user: {
        uid: userCredential.uid,
        email: userCredential.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Email verification endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Find user with this verification token
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('verificationToken', '==', token).get();

    if (snapshot.empty) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Check if token is expired
    if (Date.now() > userData.verificationExpiry) {
      return res.status(400).json({ message: 'Verification token has expired' });
    }

    // Update user verification status
    await auth.updateUser(userDoc.id, {
      emailVerified: true
    });

    await userDoc.ref.update({
      emailVerified: true,
      verificationToken: null,
      verificationExpiry: null
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Resend verification email endpoint
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userRecord = await auth.getUserByEmail(email);
    
    if (userRecord.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateToken();
    const verificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Update verification token in Firestore
    await db.collection('users').doc(userRecord.uid).update({
      verificationToken,
      verificationExpiry
    });

    // TODO: Send new verification email
    // You would typically integrate with your email service here

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate password reset token
    const resetToken = generateToken();
    const resetExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    // Find user and store reset token
    const userRecord = await auth.getUserByEmail(email);
    await db.collection('users').doc(userRecord.uid).update({
      resetToken,
      resetExpiry
    });

    // TODO: Send password reset email
    // You would typically integrate with your email service here

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    // Don't reveal if email exists
    res.json({ message: 'If an account exists, a password reset email will be sent' });
  }
});

// Validate reset token endpoint
router.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    // Find user with this reset token
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('resetToken', '==', token).get();

    if (snapshot.empty) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const userData = snapshot.docs[0].data();

    // Check if token is expired
    if (Date.now() > userData.resetExpiry) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Find user with this reset token
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('resetToken', '==', token).get();

    if (snapshot.empty) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Check if token is expired
    if (Date.now() > userData.resetExpiry) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Update password in Firebase Auth
    await auth.updateUser(userDoc.id, {
      password
    });

    // Clear reset token
    await userDoc.ref.update({
      resetToken: null,
      resetExpiry: null
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Google OAuth endpoints
router.get('/google', (req, res, next) => {
  const { type = 'signin', role = 'customer' } = req.query;
  
  // Store OAuth type and role in session
  req.session.oauthType = type;
  req.session.oauthRole = role;
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/auth/signin' }),
  async (req, res) => {
    try {
      const { token, uid } = req.user;
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();
      
      // Redirect to frontend with token and role
      res.redirect(`${process.env.FRONTEND_URL}/auth/oauth-callback?` + 
        `token=${token}&role=${userData.role}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/signin?error=oauth_failed`);
    }
});

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
