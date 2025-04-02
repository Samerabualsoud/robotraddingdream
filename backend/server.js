const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const http = require('http');
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const { initializeSocketIO } = require('./src/utils/socketService');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

// Import routes
const mt4Routes = require('./src/routes/mt4Routes').default;

// Create Express app
const app = express();
const PORT = config.port;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(server);

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(morgan('combined', { stream: logger.stream })); // Logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Routes
app.use('/api/mt4', mt4Routes);

// Status route
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', version: '1.0.0' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
