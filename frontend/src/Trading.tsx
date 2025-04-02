import React, { useState } from 'react';
import Navigation from '../components/layout/Navigation';
import TradingViewWidget from '../components/charts/TradingViewWidget';
import './Trading.css';

const Trading = () => {
  const [symbol, setSymbol] = useState('EURUSD');
  const [orderType, setOrderType] = useState('buy');
  const [volume, setVolume] = useState(0.01);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ symbol, orderType, volume });
    // Here you would connect to MT4 to place the order
    alert(`Order placed: ${orderType.toUpperCase()} ${volume} ${symbol}`);
  };
  
  return (
    <div className="trading-page">
      <Navigation />
      <div className="trading-content">
        <div className="trading-header">
          <h1>Trading</h1>
        </div>
        <div className="trading-grid">
          <div className="chart-section">
            <div className="symbol-selector">
              <button 
                className={symbol === 'EURUSD' ? 'active' : ''} 
                onClick={() => setSymbol('EURUSD')}
              >
                EUR/USD
              </button>
              <button 
                className={symbol === 'GBPUSD' ? 'active' : ''} 
                onClick={() => setSymbol('GBPUSD')}
              >
                GBP/USD
              </button>
              <button 
                className={symbol === 'USDJPY' ? 'active' : ''} 
                onClick={() => setSymbol('USDJPY')}
              >
                USD/JPY
              </button>
              <button 
                className={symbol === 'AUDUSD' ? 'active' : ''} 
                onClick={() => setSymbol('AUDUSD')}
              >
                AUD/USD
              </button>
            </div>
            <TradingViewWidget symbol={symbol} />
          </div>
          <div className="order-section">
            <h2>Place Order</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Symbol</label>
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="USDJPY">USD/JPY</option>
                  <option value="AUDUSD">AUD/USD</option>
                </select>
              </div>
              <div className="form-group">
                <label>Order Type</label>
                <div className="order-type-buttons">
                  <button 
                    type="button"
                    className={`buy-button ${orderType === 'buy' ? 'active' : ''}`}
                    onClick={() => setOrderType('buy')}
                  >
                    BUY
                  </button>
                  <button 
                    type="button"
                    className={`sell-button ${orderType === 'sell' ? 'active' : ''}`}
                    onClick={() => setOrderType('sell')}
                  >
                    SELL
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Volume</label>
                <input 
                  type="number" 
                  min="0.01" 
                  step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                />
              </div>
              <button type="submit" className="place-order-button">
                Place Order
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
