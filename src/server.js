require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');

// Initialize models and associations
require('./models');

const app = express();

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - allow multiple localhost ports for development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
// Request logging with Winston
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GreenScape Lawn Care API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/services', require('./routes/service.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/admin/customers', require('./routes/admin.customer.routes'));
app.use('/api/admin/services', require('./routes/admin.service.routes'));
app.use('/api/referrals', require('./routes/referral.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/weather', require('./routes/weather.routes'));
app.use('/api/quotes', require('./routes/quote.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error with Winston
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Auto-seed database on startup if AUTO_SEED is enabled
async function startServer() {
  try {
    // Sync database
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    await sequelize.sync();
    logger.info('✅ Database schema synced');

    // Run seeding if AUTO_SEED is enabled
    if (process.env.AUTO_SEED === 'true') {
      logger.info('🌱 AUTO_SEED enabled - Running database seeding...');

      // Execute seeding script
      const { execSync } = require('child_process');
      try {
        execSync('node src/scripts/seed-deployment.js', {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        logger.info('✅ Database seeding completed');
      } catch (seedError) {
        logger.warn('⚠️  Database seeding encountered an issue:', seedError.message);
        logger.info('Continuing with server startup...');
      }
    }

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 GreenScape API server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
