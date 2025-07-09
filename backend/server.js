import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Try to load routes with error handling
let routesLoaded = false;
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
  console.log('⚠️  Routes failed to load:', error.message);
  console.log('🔄 Running in basic mode - health check available');
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    availableRoutes: routesLoaded ? 
      ['/api/health', '/api/test', '/api/auth', '/api/printers', '/api/requests', '/api/reviews'] :
      ['/api/health', '/api/test']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ACCIS Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});
