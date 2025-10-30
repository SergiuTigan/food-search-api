require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const databaseService = require('./services/database.service');
const emailService = require('./config/email');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const mealOptionsRoutes = require('./routes/mealOptions.routes');
const mealSelectionsRoutes = require('./routes/mealSelections.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const searchRoutes = require('./routes/search.routes');
const adminRoutes = require('./routes/admin.routes');
const invitationsRoutes = require('./routes/invitations.routes');
const mealTransfersRoutes = require('./routes/mealTransfers.routes');
const menusRoutes = require('./routes/menus.routes');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Initialize Application
 */
async function initializeApp() {
  try {
    // Initialize database
    await databaseService.initialize();

    // Test email configuration (non-blocking - don't wait for it)
    emailService.testConfig().then(emailConfigured => {
      if (!emailConfigured) {
        console.log('⚠ Email service not configured - email features will not work');
      }
    }).catch(err => {
      console.log('⚠ Email configuration test failed:', err.message);
    });

    console.log('✓ Application initialized successfully');
  } catch (error) {
    console.error('Application initialization error:', error);
    process.exit(1);
  }
}

/**
 * Middleware Configuration
 */
// CORS - Allow multiple origins (hardcoded)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:9876',
  'http://food.tigan.dev',
  'https://food.tigan.dev',
  'https://food-search-angular.vercel.app'
];

app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Set-Cookie'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'food-search-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

/**
 * API Documentation
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Food Search API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// Serve Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'food-search-api',
    version: '1.0.0'
  });
});

/**
 * Root Endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Food Search API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      authentication: '/api/auth',
      users: '/api/users',
      mealOptions: '/api/meal-options',
      mealSelections: '/api/meal-selections',
      reviews: '/api/reviews',
      search: '/api/search',
      admin: '/api/admin',
      invitations: '/api/invitations',
      feedback: '/api/feedback',
      mealTransfers: '/api/meal-transfers',
      menus: '/api/menus'
    }
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/meal-options', mealOptionsRoutes);
app.use('/api/meal-selections', mealSelectionsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/meal-transfers', mealTransfersRoutes);
app.use('/api/menus', menusRoutes);

/**
 * Error Handling
 */
app.use(notFound);
app.use(errorHandler);

/**
 * Start Server
 */
initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 Food Search API Server Running`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`${'='.repeat(50)}\n`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
