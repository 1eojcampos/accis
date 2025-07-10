import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';

dotenv.config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase and passport
let firebaseInitialized = false;
try {
  // This will throw if Firebase fails to initialize
  await import('./config/firebase.js');
  // If successful, import passport config which depends on Firebase
  await import('./config/passport.js');
  firebaseInitialized = true;
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('⚠️ Failed to initialize Firebase:', error);
  console.log('🔄 Running in limited mode - some features will be disabled');
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport only if Firebase is working
if (firebaseInitialized) {
  app.use(passport.initialize());
  app.use(passport.session());
}

// Health check (before other routes)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: firebaseInitialized ? 'ok' : 'limited',
    timestamp: new Date().toISOString(),
    service: 'ACCIS Backend',
    features: {
      firebase: firebaseInitialized,
      auth: firebaseInitialized,
      routes: false // Will be updated after routes are loaded
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    mode: firebaseInitialized ? 'full' : 'limited'
  });
});

// Try to load routes with error handling
let routesLoaded = false;
if (firebaseInitialized) {
  try {
    const authRoutes = await import('./routes/auth.js');
    const printerRoutes = await import('./routes/printers.js');
    const requestRoutes = await import('./routes/requests.js');
    const reviewRoutes = await import('./routes/reviews.js');

    app.use('/api/auth', authRoutes.default);
    app.use('/api/printers', printerRoutes.default);
    app.use('/api/requests', requestRoutes.default);
    app.use('/api/reviews', reviewRoutes.default);
    
    routesLoaded = true;
    console.log('✅ All routes loaded successfully');
  } catch (error) {
    console.log('⚠️ Routes failed to load:', error.message);
    console.log('🔄 Running in basic mode - health check available');
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    mode: firebaseInitialized ? 'full' : 'limited'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    mode: firebaseInitialized ? 'full' : 'limited',
    availableRoutes: routesLoaded ? 
      ['/api/health', '/api/test', '/api/auth', '/api/printers', '/api/requests', '/api/reviews'] :
      ['/api/health', '/api/test']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ACCIS Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  if (!firebaseInitialized) {
    console.log('⚠️ Running in limited mode - Firebase features disabled');
  }
});
