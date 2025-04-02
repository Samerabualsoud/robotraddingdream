const { MetaTraderClient } = require('metaapi.cloud-sdk');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class MT5Controller {
  constructor() {
    // Initialize MetaTrader API client
    this.api = new MetaTraderClient({
      token: config.metaApiToken
    });
    
    // Store active connections
    this.connections = new Map();
  }

  /**
   * Login to MT5 account
   */
  login = async (req, res) => {
    try {
      const { server, login, password } = req.body;
      
      if (!server || !login || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Server, login, and password are required' 
        });
      }
      
      // Connect to MT5 account
      const account = await this.api.metatraderAccountApi.getAccount(login);
      
      if (!account) {
        // Create account if it doesn't exist
        const accountData = {
          name: `${login}@${server}`,
          type: 'MT5',
          login: login,
          password: password,
          server: server,
          platform: 'mt5',
          magic: 123456
        };
        
        const newAccount = await this.api.metatraderAccountApi.createAccount(accountData);
        await newAccount.deploy();
        await newAccount.waitDeployed(60000);
        
        const connection = await newAccount.connect();
        this.connections.set(login, { account: newAccount, connection });
      } else {
        // Connect to existing account
        await account.update({
          password: password
        });
        
        const connection = await account.connect();
        this.connections.set(login, { account, connection });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { login, server, type: 'mt5' },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      return res.status(200).json({
        success: true,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed',
        details: error.message
      });
    }
  };

  /**
   * Logout from MT5 account
   */
  logout = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      
      if (login && this.connections.has(login)) {
        const { connection } = this.connections.get(login);
        await connection.disconnect();
        this.connections.delete(login);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
        details: error.message
      });
    }
  };

  /**
   * Get account information
   */
  getAccountInfo = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      
      if (!login || !this.connections.has(login)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      const { connection } = this.connections.get(login);
      const accountInfo = await connection.getAccountInformation();
      
      return res.status(200).json({
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        freeMargin: accountInfo.freeMargin,
        leverage: accountInfo.leverage,
        name: accountInfo.name,
        server: accountInfo.server,
        currency: accountInfo.currency,
        company: accountInfo.company
      });
    } catch (error) {
      console.error('Get account info error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get account information',
        details: error.message
      });
    }
  };

  /**
   * Get market data for a symbol
   */
  getMarketData = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      const { symbol } = req.params;
      
      if (!login || !this.connections.has(login)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          message: 'Symbol is required'
        });
      }
      
      const { connection } = this.connections.get(login);
      const symbolPrice = await connection.getSymbolPrice(symbol);
      const symbolSpec = await connection.getSymbolSpecification(symbol);
      
      return res.status(200).json({
        symbol,
        bid: symbolPrice.bid,
        ask: symbolPrice.ask,
        time: new Date(symbolPrice.time),
        spread: (symbolPrice.ask - symbolPrice.bid) * Math.pow(10, symbolSpec.digits),
        high: symbolPrice.high,
        low: symbolPrice.low,
        volume: symbolPrice.volume
      });
    } catch (error) {
      console.error(`Get market data error for ${req.params.symbol}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get market data',
        details: error.message
      });
    }
  };

  /**
   * Get open positions
   */
  getPositions = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      
      if (!login || !this.connections.has(login)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      const { connection } = this.connections.get(login);
      const positions = await connection.getPositions();
      
      const formattedPositions = positions.map(position => ({
        ticket: position.id,
        symbol: position.symbol,
        type: this.getOrderTypeString(position.type),
        volume: position.volume,
        openTime: new Date(position.time),
        openPrice: position.openPrice,
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        profit: position.profit,
        commission: position.commission,
        swap: position.swap,
        comment: position.comment,
        magic: position.magic
      }));
      
      return res.status(200).json(formattedPositions);
    } catch (error) {
      console.error('Get positions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get positions',
        details: error.message
      });
    }
  };

  /**
   * Get trade history
   */
  getTradeHistory = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      const { from, to } = req.query;
      
      if (!login || !this.connections.has(login)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      const { connection } = this.connections.get(login);
      
      const startTime = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      const endTime = to ? new Date(to) : new Date();
      
      const history = await connection.getHistoryOrdersByTimeRange(startTime, endTime);
      
      const formattedHistory = history.map(order => ({
        ticket: order.id,
        symbol: order.symbol,
        type: this.getOrderTypeString(order.type),
        volume: order.volume,
        openTime: new Date(order.openTime),
        closeTime: new Date(order.closeTime),
        openPrice: order.openPrice,
        closePrice: order.closePrice,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        profit: order.profit,
        commission: order.commission,
        swap: order.swap,
        comment: order.comment,
        magic: order.magic
      }));
      
      return res.status(200).json(formattedHistory);
    } catch (error) {
      console.error('Get trade history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get trade history',
        details: error.message
      });
    }
  };

  /**
   * Place a trade
   */
  placeTrade = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      const { symbol, type, volume, price, stopLoss, takeProfit, comment, magic, expiration } = req.body;
      
      if (!login || !this.connections.has(login)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      if (!symbol || !type || !volume) {
        return res.status(400).json({
          success: false,
          message: 'Symbol, type, and volume are required'
        });
      }
      
      const { connection } = this.connections.get(login);
      
      let result;
      const orderType = this.getMetaApiOrderType(type);
      
      if (type === 'buy' || type === 'sell') {
        // Market order
        result = await connection.createMarketBuyOrder(symbol, volume, stopLoss, takeProfit, comment, magic);
      } else {
        // Pending order
        if (!price) {
          return res.status(400).json({
            success: false,
            message: 'Price is required for pending orders'
          });
        }
        
        const options = {
          comment,
          magic,
          expiration: expiration ? new Date(expiration) : undefined
        };
        
        result = await connection.createLimitOrder(
          symbol,
          orderType,
          volume,
          price,
          stopLoss,
          takeProfit,
          options
        );
      }
      
      return res.status(200).json({
        ticket: result.orderId,
        openTime: new Date(),
        openPrice: result.openPrice,
        success: true
      });
    } catch (error) {
      console.error('Place trade error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to place trade',
        details: error.message
      });
    }
  };

  /**
   * Modify an existing position
   */
  modifyPosition = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      const { ticket } = req.params;
      const { stopLoss, takeProfit } = req.body;
      
      if (!login || !this.connections.has(login)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      if (!ticket) {
        return res.status(400).json({
          success: false,
          message: 'Position ticket is required'
        });
      }
      
      const { connection } = this.connections.get(login);
      
      await connection.modifyPosition(ticket, stopLoss, takeProfit);
      
      return res.status(200).json({
        success: true,
        message: 'Position modified successfully'
      });
    } catch (error) {
      console.error('Modify position error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to modify position',
        details: error.message
      });
    }
  };

  /**
   * Close an existing position
   */
  closePosition = async (req, res) => {
    try {
      const login = this.getLoginFromToken(req);
      const { ticket } = req.params;
      
      if (!login || !this.connections.has(login)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      if (!ticket) {
        return res.status(400).json({
          success: false,
          message: 'Position ticket is required'
        });
      }
      
      const { connection } = this.connections.get(login);
      
      await connection.closePosition(ticket);
      
      return res.status(200).json({
        success: true,
        message: 'Position closed successfully'
      });
    } catch (error) {
      console.error('Close position error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to close position',
        details: error.message
      });
    }
  };

  /**
   * Helper method to get login from JWT token
   */
  getLoginFromToken = (req) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return null;
      
      const decoded = jwt.verify(token, config.jwtSecret);
      return decoded.login;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  };

  /**
   * Helper method to convert order type to string
   */
  getOrderTypeString = (type) => {
    const types = {
      0: 'buy',
      1: 'sell',
      2: 'buy_limit',
      3: 'sell_limit',
      4: 'buy_stop',
      5: 'sell_stop',
      6: 'buy_stop_limit',
      7: 'sell_stop_limit'
    };
    
    return types[type] || 'unknown';
  };

  /**
   * Helper method to convert string order type to MetaAPI order type
   */
  getMetaApiOrderType = (typeString) => {
    const types = {
      'buy': 0,
      'sell': 1,
      'buy_limit': 2,
      'sell_limit': 3,
      'buy_stop': 4,
      'sell_stop': 5,
      'buy_stop_limit': 6,
      'sell_stop_limit': 7
    };
    
    return types[typeString] || 0;
  };
}

module.exports = { MT5Controller };
