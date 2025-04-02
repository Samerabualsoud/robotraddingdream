const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Middleware to handle errors in async route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error(`Unhandled error: ${error.message}`, { 
      path: req.path,
      method: req.method,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  });

/**
 * Middleware to verify JWT authentication token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided', { path: req.path });
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn('Authentication failed: Invalid token', { 
          path: req.path,
          error: err.message 
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token. Please log in again.'
        });
      }
      
      // Add decoded user data to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`, { 
      path: req.path,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to validate request body against a schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema) => (req, res, next) => {
  if (!schema) return next();
  
  const { error } = schema.validate(req.body);
  
  if (error) {
    logger.warn('Validation error', { 
      path: req.path,
      error: error.details[0].message 
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  
  next();
};

/**
 * Middleware to handle not found routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFound = (req, res) => {
  logger.warn('Route not found', { 
    path: req.path,
    method: req.method 
  });
  
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  logger.error(`Error handler: ${err.message}`, { 
    path: req.path,
    method: req.method,
    statusCode,
    stack: err.stack
  });
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = {
  asyncHandler,
  authenticate,
  validateRequest,
  notFound,
  errorHandler
};
