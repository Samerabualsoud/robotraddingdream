const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class CapitalComController {
  constructor() {
    // Base URL for Capital.com API
    this.baseUrl = config.capitalComDemoMode ? 
      'https://demo-api-capital.backend-capital.com/api/v1' : 
      'https://api-capital.backend-capital.com/api/v1';
    
    // Store active sessions
    this.sessions = new Map();
  }

  /**
   * Login to Capital.com account
   */
  login = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }
      
      // Authenticate with Capital.com API
      const response = await axios.post(`${this.baseUrl}/session`, {
        identifier: username,
        password: password,
        encryptedPassword: false
      }, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.oauthToken) {
        // Store session information
        const sessionData = {
          oauthToken: response.data.oauthToken,
          clientId: response.data.clientId,
          accountId: response.data.accountId,
          timezoneOffset: response.data.timezoneOffset,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        this.sessions.set(username, sessionData);
        
        // Generate JWT token
        const token = jwt.sign(
          { username, platform: 'capital.com' },
          config.jwtSecret,
          { expiresIn: '24h' }
        );
        
        return res.status(200).json({
          success: true,
          token
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Logout from Capital.com account
   */
  logout = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      
      if (username && this.sessions.has(username)) {
        const sessionData = this.sessions.get(username);
        
        // Delete session on Capital.com
        await axios.delete(`${this.baseUrl}/session`, {
          headers: {
            'X-CAP-API-KEY': config.capitalComApiKey,
            'CST': sessionData.oauthToken,
            'X-SECURITY-TOKEN': sessionData.securityToken
          }
        });
        
        this.sessions.delete(username);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Get account information
   */
  getAccountInfo = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      
      if (!username || !this.sessions.has(username)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      const sessionData = this.sessions.get(username);
      
      // Get account information from Capital.com
      const response = await axios.get(`${this.baseUrl}/accounts/${sessionData.accountId}`, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken
        }
      });
      
      if (response.data && response.data.accounts) {
        const account = response.data.accounts.find(acc => acc.accountId === sessionData.accountId);
        
        if (account) {
          return res.status(200).json({
            balance: account.balance,
            currency: account.currency,
            profitLoss: account.profitLoss,
            available: account.available,
            name: account.accountName,
            type: account.accountType,
            status: account.status
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Account information not found'
      });
    } catch (error) {
      console.error('Get account info error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get account information',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Get market data for a symbol
   */
  getMarketData = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      const { symbol } = req.params;
      
      if (!username || !this.sessions.has(username)) {
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
      
      const sessionData = this.sessions.get(username);
      
      // Get market data from Capital.com
      const response = await axios.get(`${this.baseUrl}/markets/${symbol}`, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken
        }
      });
      
      if (response.data && response.data.markets) {
        const market = response.data.markets[0];
        
        return res.status(200).json({
          symbol: market.epic,
          bid: market.bid,
          ask: market.offer,
          time: new Date(market.updateTime),
          spread: market.offer - market.bid,
          high: market.high,
          low: market.low,
          percentageChange: market.percentageChange,
          netChange: market.netChange
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Market data not found'
      });
    } catch (error) {
      console.error(`Get market data error for ${req.params.symbol}:`, error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get market data',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Get open positions
   */
  getPositions = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      
      if (!username || !this.sessions.has(username)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      const sessionData = this.sessions.get(username);
      
      // Get positions from Capital.com
      const response = await axios.get(`${this.baseUrl}/positions`, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken
        }
      });
      
      if (response.data && response.data.positions) {
        const formattedPositions = response.data.positions.map(position => ({
          dealId: position.dealId,
          symbol: position.market.epic,
          type: position.direction.toLowerCase(),
          volume: position.size,
          openTime: new Date(position.createdDate),
          openPrice: position.level,
          stopLoss: position.stopLevel,
          takeProfit: position.limitLevel,
          profit: position.profit,
          currency: position.currency
        }));
        
        return res.status(200).json(formattedPositions);
      }
      
      return res.status(200).json([]);
    } catch (error) {
      console.error('Get positions error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get positions',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Get trade history
   */
  getTradeHistory = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      const { from, to } = req.query;
      
      if (!username || !this.sessions.has(username)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      const sessionData = this.sessions.get(username);
      
      // Get trade history from Capital.com
      const response = await axios.get(`${this.baseUrl}/history/transactions`, {
        params: {
          from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: to || new Date().toISOString(),
          type: 'ALL_DEAL'
        },
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken
        }
      });
      
      if (response.data && response.data.transactions) {
        const formattedHistory = response.data.transactions.map(transaction => ({
          dealId: transaction.dealId,
          symbol: transaction.epic,
          type: transaction.direction.toLowerCase(),
          volume: transaction.size,
          openTime: new Date(transaction.dateUtc),
          closeTime: transaction.closeDate ? new Date(transaction.closeDate) : null,
          openPrice: transaction.openLevel,
          closePrice: transaction.closeLevel,
          profit: transaction.profitAndLoss,
          currency: transaction.currency
        }));
        
        return res.status(200).json(formattedHistory);
      }
      
      return res.status(200).json([]);
    } catch (error) {
      console.error('Get trade history error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get trade history',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Place a trade
   */
  placeTrade = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      const { symbol, type, volume, stopLoss, takeProfit } = req.body;
      
      if (!username || !this.sessions.has(username)) {
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
      
      const sessionData = this.sessions.get(username);
      
      // Place trade on Capital.com
      const response = await axios.post(`${this.baseUrl}/positions`, {
        epic: symbol,
        direction: type.toUpperCase(),
        size: volume,
        guaranteedStop: false,
        stopLevel: stopLoss,
        limitLevel: takeProfit,
        forceOpen: true
      }, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.dealReference) {
        // Get deal confirmation
        const confirmResponse = await axios.get(`${this.baseUrl}/confirms/${response.data.dealReference}`, {
          headers: {
            'X-CAP-API-KEY': config.capitalComApiKey,
            'CST': sessionData.oauthToken,
            'X-SECURITY-TOKEN': sessionData.securityToken
          }
        });
        
        if (confirmResponse.data && confirmResponse.data.dealId) {
          return res.status(200).json({
            dealId: confirmResponse.data.dealId,
            openTime: new Date(confirmResponse.data.date),
            openPrice: confirmResponse.data.level,
            success: true
          });
        }
      }
      
      return res.status(500).json({
        success: false,
        message: 'Trade execution failed'
      });
    } catch (error) {
      console.error('Place trade error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to place trade',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Modify an existing position
   */
  modifyPosition = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      const { dealId } = req.params;
      const { stopLoss, takeProfit } = req.body;
      
      if (!username || !this.sessions.has(username)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      if (!dealId) {
        return res.status(400).json({
          success: false,
          message: 'Deal ID is required'
        });
      }
      
      const sessionData = this.sessions.get(username);
      
      // Modify position on Capital.com
      const response = await axios.put(`${this.baseUrl}/positions/${dealId}`, {
        stopLevel: stopLoss,
        limitLevel: takeProfit
      }, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.dealReference) {
        return res.status(200).json({
          success: true,
          message: 'Position modified successfully',
          dealReference: response.data.dealReference
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Position modification failed'
      });
    } catch (error) {
      console.error('Modify position error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to modify position',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Close an existing position
   */
  closePosition = async (req, res) => {
    try {
      const username = this.getUsernameFromToken(req);
      const { dealId } = req.params;
      
      if (!username || !this.sessions.has(username)) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated or session expired'
        });
      }
      
      if (!dealId) {
        return res.status(400).json({
          success: false,
          message: 'Deal ID is required'
        });
      }
      
      const sessionData = this.sessions.get(username);
      
      // Get position details to determine size and direction
      const positionResponse = await axios.get(`${this.baseUrl}/positions/${dealId}`, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken
        }
      });
      
      if (!positionResponse.data || !positionResponse.data.position) {
        return res.status(404).json({
          success: false,
          message: 'Position not found'
        });
      }
      
      const position = positionResponse.data.position;
      
      // Close position on Capital.com
      const response = await axios.post(`${this.baseUrl}/positions/otc`, {
        dealId: dealId,
        epic: position.market.epic,
        direction: position.direction === 'BUY' ? 'SELL' : 'BUY',
        size: position.size,
        orderType: 'MARKET'
      }, {
        headers: {
          'X-CAP-API-KEY': config.capitalComApiKey,
          'CST': sessionData.oauthToken,
          'X-SECURITY-TOKEN': sessionData.securityToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.dealReference) {
        return res.status(200).json({
          success: true,
          message: 'Position closed successfully',
          dealReference: response.data.dealReference
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Position closure failed'
      });
    } catch (error) {
      console.error('Close position error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to close position',
        details: error.response?.data?.errorCode || error.message
      });
    }
  };

  /**
   * Helper method to get username from JWT token
   */
  getUsernameFromToken = (req) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return null;
      
      const decoded = jwt.verify(token, config.jwtSecret);
      return decoded.username;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  };
}

module.exports = { CapitalComController };
