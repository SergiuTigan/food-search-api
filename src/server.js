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

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Initialize Application
 */
async function initializeApp() {
  try {
    // Initialize database
    await databaseService.initialize();

    // Test email configuration
    const emailConfigured = await emailService.testConfig();
    if (!emailConfigured) {
      console.log('⚠ Email service not configured - configure EMAIL_USER and EMAIL_PASSWORD in .env to enable emails');
    }

    console.log('✓ Application initialized successfully');
  } catch (error) {
    console.error('Application initialization error:', error);
    process.exit(1);
  }
}

/**
 * Middleware Configuration
 */
// CORS - Allow multiple origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:4200',
      'https://food.tigan.dev',
      'http://food.tigan.dev'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️  CORS blocked origin: ${origin}`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
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
      feedback: '/api/feedback'
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
