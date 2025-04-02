const socketIo = require('socket.io');
const logger = require('../utils/logger');
const { MT4Controller } = require('../controllers/mt4Controller');

/**
 * Configure and initialize Socket.IO for real-time data
 * @param {Object} server - HTTP server instance
 */
const initializeSocketIO = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Create MT4 controller instance for data access
  const mt4Controller = new MT4Controller();
  
  // Store active subscriptions
  const subscriptions = new Map();
  
  // Set up interval for data updates
  const updateInterval = 1000; // 1 second
  
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // Handle symbol subscription
    socket.on('subscribe', async ({ symbol }) => {
      if (!symbol) return;
      
      logger.info(`Client ${socket.id} subscribed to ${symbol}`);
      
      // Add to subscriptions
      if (!subscriptions.has(symbol)) {
        subscriptions.set(symbol, new Set());
      }
      subscriptions.get(symbol).add(socket.id);
      
      // Send initial data
      try {
        // Use the first available MT4 connection to get market data
        // In a production environment, this would use the client's own connection
        const marketData = await mt4Controller.getMarketDataDirect(symbol);
        if (marketData) {
          socket.emit('marketData', marketData);
        }
      } catch (error) {
        logger.error(`Error fetching initial data for ${symbol}:`, error);
      }
    });
    
    // Handle unsubscribe
    socket.on('unsubscribe', ({ symbol }) => {
      if (!symbol) return;
      
      logger.info(`Client ${socket.id} unsubscribed from ${symbol}`);
      
      // Remove from subscriptions
      if (subscriptions.has(symbol)) {
        subscriptions.get(symbol).delete(socket.id);
        
        // Clean up empty subscription sets
        if (subscriptions.get(symbol).size === 0) {
          subscriptions.delete(symbol);
        }
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      
      // Remove from all subscriptions
      for (const [symbol, clients] of subscriptions.entries()) {
        if (clients.has(socket.id)) {
          clients.delete(socket.id);
          
          // Clean up empty subscription sets
          if (clients.size === 0) {
            subscriptions.delete(symbol);
          }
        }
      }
    });
  });
  
  // Set up periodic data updates
  setInterval(async () => {
    // For each subscribed symbol
    for (const [symbol, clients] of subscriptions.entries()) {
      if (clients.size > 0) {
        try {
          // Get latest market data
          const marketData = await mt4Controller.getMarketDataDirect(symbol);
          
          if (marketData) {
            // Send to all subscribed clients
            for (const clientId of clients) {
              const socket = io.sockets.sockets.get(clientId);
              if (socket) {
                socket.emit('marketData', marketData);
              }
            }
          }
        } catch (error) {
          logger.error(`Error updating market data for ${symbol}:`, error);
        }
      }
    }
  }, updateInterval);
  
  logger.info('Socket.IO initialized for real-time data');
  
  return io;
};

module.exports = { initializeSocketIO };
