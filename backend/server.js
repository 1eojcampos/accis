import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';

dotenv.config();

// Set NODE_ENV to development if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const app = express();
// Middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: [
    'https://accis-c376c.web.app', 
    'https://accis-c376c.firebaseapp.com', 
    'https://accis.io',
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Configure passport (if you have a separate passport config)
try {
  await import('./config/passport.js');
  console.log('✅ Passport configured successfully');
} catch (error) {
  console.error('❌ Error configuring passport:', error);
}

// Health check (before other routes)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'ACCIS Backend'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Debug endpoint for testing request creation
app.post('/api/test-request', (req, res) => {
  console.log('Test request received:', req.body);
  res.status(201).json({ 
    message: 'Test request endpoint working!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Try to load routes with error handling
let routesLoaded = false;
try {
  console.log('🔄 Loading auth routes...');
  const authRoutes = await import('./routes/auth.js');
  console.log('✅ Auth routes loaded');

  console.log('🔄 Loading printer routes...');
  const printerRoutes = await import('./routes/printers.js');
  console.log('✅ Printer routes loaded');

  console.log('🔄 Loading request routes...');
  const requestRoutes = await import('./routes/requests.js');
  console.log('✅ Request routes loaded');

  console.log('🔄 Loading review routes...');
  const reviewRoutes = await import('./routes/reviews.js');
  console.log('✅ Review routes loaded');

  console.log('🔄 Registering routes with app...');
  app.use('/api/auth', authRoutes.default);
  app.use('/api/printers', printerRoutes.default);
  app.use('/api/requests', requestRoutes.default);
  app.use('/api/reviews', reviewRoutes.default);
  
  routesLoaded = true;
  console.log('✅ All routes registered successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  console.error('Error stack:', error.stack);
  console.log('🔄 Running in basic mode - health check available');
}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl,
    mode: routesLoaded ? 'full' : 'limited',
    availableRoutes: routesLoaded ? 
      ['/api/health', '/api/test', '/api/auth/*', '/api/printers/*', '/api/requests/*', '/api/reviews/*'] :
      ['/api/health', '/api/test']
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(process.env.SERVER_PORT || 5000, () => {
    console.log(`
🚀 ACCIS Backend running on port ${server.address().port}
📊 Health check: http://localhost:${server.address().port}/api/health
🧪 Test endpoint: http://localhost:${server.address().port}/api/test
🛣️  Routes loaded: ${routesLoaded ? 'Yes' : 'No'}
    `);
  });
}

// Export the Express app for Cloud Functions
export default app;
