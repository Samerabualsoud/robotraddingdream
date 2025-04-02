const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock authentication for development
app.post('/api/mt4/login', (req, res) => {
  const { server, login, password } = req.body;
  
  // Simple validation
  if (!server || !login || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  // In a real app, you would validate against MT4 server
  // For now, accept any credentials
  const token = jwt.sign(
    { username: login, platform: 'mt4', server },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ success: true, token });
});

app.post('/api/mt5/login', (req, res) => {
  const { server, login, password } = req.body;
  
  // Simple validation
  if (!server || !login || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  // In a real app, you would validate against MT5 server
  // For now, accept any credentials
  const token = jwt.sign(
    { username: login, platform: 'mt5', server },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ success: true, token });
});

app.post('/api/capital/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple validation
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // In a real app, you would validate against Capital.com API
  // For now, accept any credentials
  const token = jwt.sign(
    { username, platform: 'capital' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ success: true, token });
});

// Mock data endpoints
const mockAccountInfo = {
  mt4: {
    balance: 10000,
    equity: 10250,
    freeMargin: 9500,
    leverage: 100,
    currency: 'USD',
    name: 'MT4 Account',
    server: 'Demo Server'
  },
  mt5: {
    balance: 15000,
    equity: 15300,
    freeMargin: 14000,
    leverage: 200,
    currency: 'EUR',
    name: 'MT5 Account',
    server: 'Demo Server'
  },
  capital: {
    balance: 5000,
    equity: 5150,
    freeMargin: 4800,
    leverage: 30,
    currency: 'GBP',
    name: 'Capital.com Account',
    type: 'DEMO'
  }
};

const mockPositions = {
  mt4: [
    {
      symbol: 'EURUSD',
      type: 'buy',
      volume: 0.1,
      openPrice: 1.0850,
      profit: 25.5,
      openTime: new Date()
    },
    {
      symbol: 'GBPUSD',
      type: 'sell',
      volume: 0.2,
      openPrice: 1.2650,
      profit: -12.8,
      openTime: new Date()
    }
  ],
  mt5: [
    {
      symbol: 'USDJPY',
      type: 'buy',
      volume: 0.3,
      openPrice: 107.50,
      profit: 45.2,
      openTime: new Date()
    }
  ],
  capital: [
    {
      symbol: 'AUDUSD',
      type: 'sell',
      volume: 0.5,
      openPrice: 0.6520,
      profit: 30.5,
      openTime: new Date()
    },
    {
      symbol: 'USDCAD',
      type: 'buy',
      volume: 0.4,
      openPrice: 1.3550,
      profit: -15.3,
      openTime: new Date()
    }
  ]
};

const mockMarketData = {
  'EURUSD': { bid: 1.0875, ask: 1.0877, spread: 0.0002 },
  'GBPUSD': { bid: 1.2630, ask: 1.2633, spread: 0.0003 },
  'USDJPY': { bid: 107.50, ask: 107.53, spread: 0.03 },
  'AUDUSD': { bid: 0.6520, ask: 0.6523, spread: 0.0003 },
  'USDCAD': { bid: 1.3550, ask: 1.3553, spread: 0.0003 }
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Account info endpoints
app.get('/api/mt4/account', verifyToken, (req, res) => {
  res.json(mockAccountInfo.mt4);
});

app.get('/api/mt5/account', verifyToken, (req, res) => {
  res.json(mockAccountInfo.mt5);
});

app.get('/api/capital/account', verifyToken, (req, res) => {
  res.json(mockAccountInfo.capital);
});

// Positions endpoints
app.get('/api/mt4/positions', verifyToken, (req, res) => {
  res.json(mockPositions.mt4);
});

app.get('/api/mt5/positions', verifyToken, (req, res) => {
  res.json(mockPositions.mt5);
});

app.get('/api/capital/positions', verifyToken, (req, res) => {
  res.json(mockPositions.capital);
});

// Market data endpoints
app.get('/api/mt4/market/:symbol', verifyToken, (req, res) => {
  const { symbol } = req.params;
  res.json(mockMarketData[symbol] || { bid: 0, ask: 0, spread: 0 });
});

app.get('/api/mt5/market/:symbol', verifyToken, (req, res) => {
  const { symbol } = req.params;
  res.json(mockMarketData[symbol] || { bid: 0, ask: 0, spread: 0 });
});

app.get('/api/capital/market/:symbol', verifyToken, (req, res) => {
  const { symbol } = req.params;
  res.json(mockMarketData[symbol] || { bid: 0, ask: 0, spread: 0 });
});

// Default route
app.get('/', (req, res) => {
  res.send('Forex Trading API is running');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
