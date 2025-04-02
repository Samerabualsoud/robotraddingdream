const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const path = require('path');
const config = require('../config/config');

// Ensure logs directory exists
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, '../../logs'))) {
  fs.mkdirSync(path.join(__dirname, '../../logs'));
}

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create the logger
const logger = createLogger({
  level: config.logging.level,
  format: combine(
    timestamp(),
    format.json()
  ),
  defaultMeta: { service: 'forex-trading-api' },
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      level: 'info'
    }),
    
    // Write all logs with level 'error' and below to error.log
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    })
  ]
});

// If we're not in production, also log to the console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      consoleFormat
    )
  }));
}

// Create a stream object for Morgan middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
