const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');

const app = express();

// 1. Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// 2. CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// 3. Parse JSON and form request bodies
// These must be registered before API routes.
app.use(express.json({ limit: '2mb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb',
  })
);

// 4. Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. API rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalLimiter);

// 6. Static files
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

app.use(
  '/certificates',
  express.static(path.join(__dirname, '..', 'certificates'))
);

// 7. Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    time: new Date(),
  });
});

// 8. API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// 9. Handle unknown routes
app.use(notFound);

// 10. Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
