const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const config = require('../config/config');
const logger = require('../utils/logger');
const SecurityUtils = require('../utils/securityUtils');

/**
 * Configure and apply security middleware to Express app
 * @param {Object} app - Express app instance
 */
const applySecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());
  
  // Enable CORS with secure configuration
  app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));
  
  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded: ${req.ip}`);
      res.status(options.statusCode).json({
        success: false,
        message: options.message
      });
    }
  });
  app.use('/api', apiLimiter);
  
  // More strict rate limiting for authentication routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/mt4/login', authLimiter);
  
  // Data sanitization against XSS
  app.use(xss());
  
  // Prevent parameter pollution
  app.use(hpp());
  
  // Custom middleware to sanitize request body
  app.use((req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = SecurityUtils.sanitizeInput(req.body[key]);
        }
      });
    }
    next();
  });
  
  // Set secure cookies
  app.use((req, res, next) => {
    res.cookie('cookieName', 'cookieValue', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    next();
  });
  
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'wss://api.example.com']
      }
    }));
  }
  
  logger.info('Security middleware applied');
};

module.exports = { applySecurityMiddleware };
