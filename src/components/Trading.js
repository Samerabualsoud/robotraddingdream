import React, { useState, useEffect } from 'react';
import { mt4Api, mt5Api, capitalComApi } from '../services/api';

const Trading = () => {
  const [accountInfo, setAccountInfo] = useState(null);
  const [positions, setPositions] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('');
  
  // Common currency pairs for forex trading
  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];

  useEffect(() => {
    // Get the platform from localStorage
    const storedPlatform = localStorage.getItem('platform');
    if (storedPlatform) {
      setPlatform(storedPlatform);
    }
    
    // Load initial data
    loadData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getApiForPlatform = () => {
    switch(platform) {
      case 'mt4':
        return mt4Api;
      case 'mt5':
        return mt5Api;
      case 'capital':
        return capitalComApi;
      case 'demo':
        // Return mock API for demo mode
        return {
          getAccountInfo: () => Promise.resolve({
            data: {
              balance: 10000,
              equity: 10250,
              freeMargin: 9500,
              leverage: 100,
              currency: 'USD',
              name: 'Demo Account',
              server: 'Demo Server'
            }
          }),
          getPositions: () => Promise.resolve({
            data: [
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
            ]
          }),
          getMarketData: (symbol) => {
            const mockData = {
              'EURUSD': { bid: 1.0875, ask: 1.0877, spread: 0.0002 },
              'GBPUSD': { bid: 1.2630, ask: 1.2633, spread: 0.0003 },
              'USDJPY': { bid: 107.50, ask: 107.53, spread: 0.03 },
              'AUDUSD': { bid: 0.6520, ask: 0.6523, spread: 0.0003 },
              'USDCAD': { bid: 1.3550, ask: 1.3553, spread: 0.0003 }
            };
            return Promise.resolve({ data: mockData[symbol] || { bid: 0, ask: 0, spread: 0 } });
          }
        };
      default:
        return mt4Api;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const api = getApiForPlatform();
      
      // Get account information
      const accountResponse = await api.getAccountInfo();
      if (accountResponse.data) {
        setAccountInfo(accountResponse.data);
      }
      
      // Get open positions
      const positionsResponse = await api.getPositions();
      if (positionsResponse.data) {
        setPositions(positionsResponse.data);
      }
      
      // Get market data for common symbols
      const marketDataObj = {};
      for (const symbol of symbols) {
        try {
          const marketResponse = await api.getMarketData(symbol);
          if (marketResponse.data) {
            marketDataObj[symbol] = marketResponse.data;
          }
        } catch (err) {
          console.error(`Error fetching market data for ${symbol}:`, err);
        }
      }
      setMarketData(marketDataObj);
      
      setError('');
    } catch (err) {
      console.error('Error loading trading data:', err);
      setError('Failed to load trading data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('platform');
    window.location.href = '/login';
  };

  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  return (
    <div className="trading-container">
      <header className="trading-header">
        <h1>Trading Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </header>
      
      {loading && <div className="loading-overlay">Loading data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-grid">
        {/* Account Information */}
        <div className="dashboard-card account-info">
          <h2>Account Information</h2>
          {accountInfo ? (
            <div className="account-details">
              <p><strong>Balance:</strong> {formatCurrency(accountInfo.balance, accountInfo.currency)}</p>
              <p><strong>Equity:</strong> {formatCurrency(accountInfo.equity, accountInfo.currency)}</p>
              <p><strong>Free Margin:</strong> {formatCurrency(accountInfo.freeMargin, accountInfo.currency)}</p>
              <p><strong>Leverage:</strong> {accountInfo.leverage}:1</p>
              {accountInfo.name && <p><strong>Name:</strong> {accountInfo.name}</p>}
              {accountInfo.server && <p><strong>Server:</strong> {accountInfo.server}</p>}
            </div>
          ) : (
            <p>No account information available</p>
          )}
        </div>
        
        {/* Market Data */}
        <div className="dashboard-card market-data">
          <h2>Market Data</h2>
          <div className="market-table">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Bid</th>
                  <th>Ask</th>
                  <th>Spread</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(marketData).length > 0 ? (
                  Object.entries(marketData).map(([symbol, data]) => (
                    <tr key={symbol}>
                      <td>{symbol}</td>
                      <td>{data.bid}</td>
                      <td>{data.ask}</td>
                      <td>{data.spread}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No market data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Open Positions */}
        <div className="dashboard-card positions">
          <h2>Open Positions</h2>
          <div className="positions-table">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Volume</th>
                  <th>Open Price</th>
                  <th>Current Price</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {positions.length > 0 ? (
                  positions.map((position, index) => (
                    <tr key={index}>
                      <td>{position.symbol}</td>
                      <td>{position.type}</td>
                      <td>{position.volume}</td>
                      <td>{position.openPrice}</td>
                      <td>{marketData[position.symbol]?.bid || 'N/A'}</td>
                      <td className={position.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                        {formatCurrency(position.profit)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No open positions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Trading Strategy Status */}
        <div className="dashboard-card strategy">
          <h2>Trading Strategy</h2>
          <div className="strategy-status">
            <p><strong>Status:</strong> Active</p>
            <p><strong>Mode:</strong> {platform === 'demo' ? 'Demo' : platform === 'capital' && accountInfo?.type === 'DEMO' ? 'Demo' : 'Live'}</p>
            <p><strong>Platform:</strong> {platform === 'mt4' ? 'MetaTrader 4' : platform === 'mt5' ? 'MetaTrader 5' : platform === 'capital' ? 'Capital.com' : 'Demo'}</p>
            <p><strong>Strategy:</strong> Multi-Indicator with Self-Correction</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
