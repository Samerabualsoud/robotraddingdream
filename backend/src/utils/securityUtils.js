const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('./logger');

/**
 * Security utility functions for the application
 */
class SecurityUtils {
  /**
   * Generate a secure random token
   * @param {number} length - Length of the token
   * @returns {string} Random token
   */
  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a password with a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches hash
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token
   * @param {Object} payload - Token payload
   * @param {string} expiresIn - Token expiration time
   * @returns {string} JWT token
   */
  static generateJWT(payload, expiresIn = '24h') {
    return jwt.sign(payload, config.jwtSecret, { expiresIn });
  }

  /**
   * Verify a JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  static verifyJWT(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      logger.warn(`JWT verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @param {string} key - Encryption key (defaults to JWT secret)
   * @returns {string} Encrypted data
   */
  static encryptData(data, key = config.jwtSecret) {
    // Use first 32 bytes of key (or pad if shorter)
    const encKey = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Data to decrypt
   * @param {string} key - Encryption key (defaults to JWT secret)
   * @returns {string|null} Decrypted data or null if decryption fails
   */
  static decryptData(encryptedData, key = config.jwtSecret) {
    try {
      // Use first 32 bytes of key (or pad if shorter)
      const encKey = crypto.createHash('sha256').update(key).digest();
      
      // Split IV and encrypted data
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error(`Decryption failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Sanitize user input to prevent XSS attacks
   * @param {string} input - User input
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Generate a secure password
   * @param {number} length - Password length
   * @returns {string} Secure password
   */
  static generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    
    // Ensure at least one character from each category
    password += charset.substr(Math.floor(Math.random() * 26), 1); // lowercase
    password += charset.substr(26 + Math.floor(Math.random() * 26), 1); // uppercase
    password += charset.substr(52 + Math.floor(Math.random() * 10), 1); // digit
    password += charset.substr(62 + Math.floor(Math.random() * (charset.length - 62)), 1); // special
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }
}

module.exports = SecurityUtils;
