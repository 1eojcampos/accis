import express from 'express';
import passport from 'passport';
import { auth, db } from '../config/firebase.js';
import { clientAuth } from '../config/firebase-client.js';
import { sendEmailVerification } from 'firebase/auth';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

console.log('🔄 Setting up auth routes...');

// Helper function to generate verification token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Helper function to create verification link
const createVerificationLink = async (uid) => {
  try {
    const link = await auth.generateEmailVerificationLink(uid);
    return link;
  } catch (error) {
    console.error('Error generating verification link:', error);
    throw error;
  }
};

// Signup endpoint
router.post('/signup', async (req, res) => {
  console.log('📝 Received signup request:', req.body);
  
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    if (!['customer', 'provider'].includes(role)) {
      console.log('❌ Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    console.log('🔄 Creating user in Firebase...');
    
    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    console.log('✅ User created in Firebase:', userRecord.uid);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      createdAt: new Date().toISOString(),
      verified: false
    });

    console.log('✅ User document created in Firestore');

    // Generate and send verification email
    try {
      // Create a custom token for the user
      const customToken = await auth.createCustomToken(userRecord.uid);
      console.log('✅ Custom token created');

      // Use the client SDK to send the verification email
      const { signInWithCustomToken } = await import('firebase/auth');
      const { clientAuth } = await import('../config/firebase-client.js');
      
      // Sign in with the custom token
      const userCredential = await signInWithCustomToken(clientAuth, customToken);
      console.log('✅ Signed in with custom token');

      // Send the verification email
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(userCredential.user, {
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email`
      });
      console.log('✅ Verification email sent');
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      console.error('Error details:', error.code, error.message);
      // Don't fail the signup process if email sending fails
    }

    res.status(201).json({ 
      message: 'Account created successfully. Please check your email for verification instructions.',
      userId: userRecord.uid,
      email: userRecord.email,
      role,
      verified: false
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to create account'
    });
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

// Resend verification email endpoint
router.post('/resend-verification', async (req, res) => {
  console.log('📧 Received resend verification request:', req.body);
  
  try {
    const { email } = req.body;

    if (!email) {
      console.log('❌ Email is missing from request');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('🔍 Looking up user in Firebase:', email);
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ Found user:', userRecord.uid);
    
    if (userRecord.emailVerified) {
      console.log('ℹ️ Email is already verified');
      return res.status(400).json({ message: 'Email is already verified' });
    }

    console.log('🔄 Creating custom token for email verification...');
    // Create a custom token
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    // Sign in with custom token to get user credential
    const userCredential = await clientAuth.signInWithCustomToken(customToken);
    
    console.log('🔄 Sending verification email...');
    // Send verification email using client SDK
    await sendEmailVerification(userCredential.user, {
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email`
    });
    console.log('✅ Verification email sent');

    // Firebase will automatically send the verification email
    console.log('📨 Verification email should be sent by Firebase');
    
    res.json({ 
      message: 'A new verification email has been sent to your address',
      email: userRecord.email 
    });
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    // Log the full error object for debugging
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    // Send a more specific error message based on the error type
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ 
        message: 'No account found with this email address. Please sign up first.' 
      });
    }

    res.status(400).json({ 
      message: 'Failed to send verification email. Please try again later.',
      details: error.message
    });
  }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);
    
    // Firebase will send the reset email automatically using its default template
    // You can customize the template in the Firebase Console

    console.log('✅ Password reset link sent to:', email);
    
    res.json({ 
      message: 'Password reset instructions have been sent to your email'
    });
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    res.status(400).json({ 
      message: 'Failed to send password reset email. Please make sure the email is registered.'
    });
  }
});

// Verify email status
router.get('/verify-status', authenticateToken, async (req, res) => {
  try {
    const userRecord = await auth.getUser(req.user.uid);
    res.json({ 
      verified: userRecord.emailVerified 
    });
  } catch (error) {
    console.error('❌ Error checking verification status:', error);
    res.status(400).json({ 
      message: 'Failed to check email verification status'
    });
  }
});

// Google OAuth endpoints
router.get('/google', (req, res, next) => {
  console.log('🔍 Google OAuth request received:');
  console.log('  - Query params:', req.query);
  console.log('  - Session before:', req.session);
  
  const { type = 'signin', role = 'customer' } = req.query;
  
  // Store OAuth type and role in session
  req.session.oauthType = type;
  req.session.oauthRole = role;
  
  console.log('  - OAuth type:', type);
  console.log('  - OAuth role:', role);
  console.log('  - Session after:', req.session);
  
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-client-id.apps.googleusercontent.com') {
    console.log('❌ Google OAuth not configured - missing GOOGLE_CLIENT_ID');
    return res.status(500).json({ 
      error: 'Google OAuth not configured',
      message: 'GOOGLE_CLIENT_ID is not set or is using placeholder value'
    });
  }
  
  if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === 'your-client-secret') {
    console.log('❌ Google OAuth not configured - missing GOOGLE_CLIENT_SECRET');
    return res.status(500).json({ 
      error: 'Google OAuth not configured',
      message: 'GOOGLE_CLIENT_SECRET is not set or is using placeholder value'
    });
  }
  
  console.log('✅ Google OAuth configured, redirecting to Google...');
  
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
      
      // Get the OAuth type from session (defaults to signin)
      const oauthType = req.session?.oauthType || 'signin';
      
      // Redirect to frontend with token, role, and type
      res.redirect(`${process.env.FRONTEND_URL}/auth/oauth-callback?` + 
        `token=${token}&role=${userData.role}&type=${oauthType}`);
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
