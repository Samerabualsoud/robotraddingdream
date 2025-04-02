const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');
const mt4Routes = require('../src/routes/mt4Routes').default;

// Mock the MT4Controller
jest.mock('../src/controllers/mt4Controller', () => {
  return {
    MT4Controller: jest.fn().mockImplementation(() => {
      return {
        login: jest.fn((req, res) => {
          const { server, login, password } = req.body;
          
          if (!server || !login || !password) {
            return res.status(400).json({ 
              success: false, 
              message: 'Server, login, and password are required' 
            });
          }
          
          // Mock successful login
          const token = jwt.sign(
            { login, server, type: 'mt4' },
            config.jwtSecret,
            { expiresIn: '24h' }
          );
          
          return res.status(200).json({
            success: true,
            token
          });
        }),
        
        logout: jest.fn((req, res) => {
          return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
          });
        }),
        
        getAccountInfo: jest.fn((req, res) => {
          return res.status(200).json({
            balance: 10000,
            equity: 10250,
            margin: 1200,
            freeMargin: 9050,
            leverage: 100,
            name: 'Test Account',
            server: 'test-server',
            currency: 'USD',
            company: 'Test Broker'
          });
        }),
        
        getMarketData: jest.fn((req, res) => {
          const { symbol } = req.params;
          
          if (!symbol) {
            return res.status(400).json({
              success: false,
              message: 'Symbol is required'
            });
          }
          
          return res.status(200).json({
            symbol,
            bid: 1.10000,
            ask: 1.10010,
            time: new Date(),
            spread: 1.0,
            high: 1.10100,
            low: 1.09900,
            volume: 1000
          });
        }),
        
        getPositions: jest.fn((req, res) => {
          return res.status(200).json([
            {
              ticket: 12345,
              symbol: 'EURUSD',
              type: 'buy',
              volume: 0.1,
              openTime: new Date(),
              openPrice: 1.10000,
              stopLoss: 1.09500,
              takeProfit: 1.10500,
              profit: 25.5,
              commission: 0,
              swap: 0,
              comment: '',
              magic: 123456
            }
          ]);
        }),
        
        getTradeHistory: jest.fn((req, res) => {
          return res.status(200).json([
            {
              ticket: 12344,
              symbol: 'EURUSD',
              type: 'buy',
              volume: 0.1,
              openTime: new Date(Date.now() - 86400000),
              closeTime: new Date(),
              openPrice: 1.09500,
              closePrice: 1.10000,
              stopLoss: 1.09000,
              takeProfit: 1.10500,
              profit: 50.0,
              commission: 0,
              swap: 0,
              comment: '',
              magic: 123456
            }
          ]);
        }),
        
        placeTrade: jest.fn((req, res) => {
          const { symbol, type, volume } = req.body;
          
          if (!symbol || !type || !volume) {
            return res.status(400).json({
              success: false,
              message: 'Symbol, type, and volume are required'
            });
          }
          
          return res.status(200).json({
            ticket: 12346,
            openTime: new Date(),
            openPrice: type === 'buy' ? 1.10010 : 1.10000,
            success: true
          });
        }),
        
        modifyPosition: jest.fn((req, res) => {
          const { ticket } = req.params;
          
          if (!ticket) {
            return res.status(400).json({
              success: false,
              message: 'Position ticket is required'
            });
          }
          
          return res.status(200).json({
            success: true,
            message: 'Position modified successfully'
          });
        }),
        
        closePosition: jest.fn((req, res) => {
          const { ticket } = req.params;
          
          if (!ticket) {
            return res.status(400).json({
              success: false,
              message: 'Position ticket is required'
            });
          }
          
          return res.status(200).json({
            success: true,
            message: 'Position closed successfully'
          });
        })
      };
    })
  };
});

describe('MT4 API Routes', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/mt4', mt4Routes);
  });
  
  describe('POST /api/mt4/login', () => {
    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/mt4/login')
        .send({
          server: 'test-server',
          // login and password missing
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('should return 200 and token on successful login', async () => {
      const response = await request(app)
        .post('/api/mt4/login')
        .send({
          server: 'test-server',
          login: '12345',
          password: 'password',
          type: 'mt4'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });
  });
  
  describe('GET /api/mt4/account', () => {
    test('should return account information', async () => {
      const response = await request(app)
        .get('/api/mt4/account')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(response.body.balance).toBe(10000);
      expect(response.body.equity).toBe(10250);
      expect(response.body.leverage).toBe(100);
    });
  });
  
  describe('GET /api/mt4/market/:symbol', () => {
    test('should return market data for a symbol', async () => {
      const response = await request(app)
        .get('/api/mt4/market/EURUSD')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('EURUSD');
      expect(response.body.bid).toBe(1.10000);
      expect(response.body.ask).toBe(1.10010);
    });
  });
  
  describe('GET /api/mt4/positions', () => {
    test('should return open positions', async () => {
      const response = await request(app)
        .get('/api/mt4/positions')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].ticket).toBe(12345);
      expect(response.body[0].symbol).toBe('EURUSD');
    });
  });
  
  describe('POST /api/mt4/trade', () => {
    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/mt4/trade')
        .set('Authorization', 'Bearer test-token')
        .send({
          symbol: 'EURUSD',
          // type and volume missing
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('should place a trade successfully', async () => {
      const response = await request(app)
        .post('/api/mt4/trade')
        .set('Authorization', 'Bearer test-token')
        .send({
          symbol: 'EURUSD',
          type: 'buy',
          volume: 0.1
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ticket).toBe(12346);
    });
  });
  
  describe('PUT /api/mt4/position/:ticket', () => {
    test('should modify a position successfully', async () => {
      const response = await request(app)
        .put('/api/mt4/position/12345')
        .set('Authorization', 'Bearer test-token')
        .send({
          stopLoss: 1.09000,
          takeProfit: 1.11000
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('DELETE /api/mt4/position/:ticket', () => {
    test('should close a position successfully', async () => {
      const response = await request(app)
        .delete('/api/mt4/position/12345')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
