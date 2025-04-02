import React, { useState, useEffect } from 'react';
import Navigation from '../components/layout/Navigation';
import './TradingHistory.css';

interface Trade {
  id: number;
  symbol: string;
  type: 'buy' | 'sell';
  openTime: string;
  closeTime: string;
  openPrice: number;
  closePrice: number;
  volume: number;
  profit: number;
}

const TradingHistory: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    // In a real application, you would fetch from your backend
    // For this demo, we'll use mock data
    const mockTrades: Trade[] = [
      {
        id: 1,
        symbol: 'EURUSD',
        type: 'buy',
        openTime: '2025-04-01 09:30:00',
        closeTime: '2025-04-01 14:45:00',
        openPrice: 1.0765,
        closePrice: 1.0792,
        volume: 0.1,
        profit: 27.0
      },
      {
        id: 2,
        symbol: 'GBPUSD',
        type: 'sell',
        openTime: '2025-03-31 11:15:00',
        closeTime: '2025-03-31 16:20:00',
        openPrice: 1.2650,
        closePrice: 1.2610,
        volume: 0.05,
        profit: 20.0
      },
      {
        id: 3,
        symbol: 'USDJPY',
        type: 'buy',
        openTime: '2025-03-30 08:45:00',
        closeTime: '2025-03-30 15:30:00',
        openPrice: 151.25,
        closePrice: 151.05,
        volume: 0.1,
        profit: -20.0
      },
      {
        id: 4,
        symbol: 'EURUSD',
        type: 'sell',
        openTime: '2025-03-29 10:00:00',
        closeTime: '2025-03-29 17:15:00',
        openPrice: 1.0810,
        closePrice: 1.0780,
        volume: 0.2,
        profit: 60.0
      },
      {
        id: 5,
        symbol: 'AUDUSD',
        type: 'buy',
        openTime: '2025-03-28 09:20:00',
        closeTime: '2025-03-28 14:10:00',
        openPrice: 0.6520,
        closePrice: 0.6545,
        volume: 0.15,
        profit: 37.5
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setTrades(mockTrades);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTrades = filter === 'all' 
    ? trades 
    : trades.filter(trade => 
        filter === 'profitable' ? trade.profit > 0 : trade.profit < 0
      );
  
  const totalProfit = filteredTrades.reduce((sum, trade) => sum + trade.profit, 0);
  
  return (
    <div className="history-page">
      <Navigation />
      <div className="history-content">
        <div className="history-header">
          <h1>Trading History</h1>
          <div className="filter-controls">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All Trades
            </button>
            <button 
              className={filter === 'profitable' ? 'active' : ''} 
              onClick={() => setFilter('profitable')}
            >
              Profitable
            </button>
            <button 
              className={filter === 'losing' ? 'active' : ''} 
              onClick={() => setFilter('losing')}
            >
              Losing
            </button>
          </div>
        </div>
        
        <div className="summary-box">
          <div className="summary-item">
            <span>Total Trades</span>
            <strong>{filteredTrades.length}</strong>
          </div>
          <div className="summary-item">
            <span>Total Profit/Loss</span>
            <strong className={totalProfit >= 0 ? 'profit' : 'loss'}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
            </strong>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Loading trading history...</div>
        ) : (
          <div className="trades-table-container">
            <table className="trades-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Open Time</th>
                  <th>Close Time</th>
                  <th>Open Price</th>
                  <th>Close Price</th>
                  <th>Volume</th>
                  <th>Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map(trade => (
                  <tr key={trade.id}>
                    <td>{trade.id}</td>
                    <td>{trade.symbol}</td>
                    <td className={trade.type === 'buy' ? 'buy' : 'sell'}>
                      {trade.type.toUpperCase()}
                    </td>
                    <td>{trade.openTime}</td>
                    <td>{trade.closeTime}</td>
                    <td>{trade.openPrice.toFixed(5)}</td>
                    <td>{trade.closePrice.toFixed(5)}</td>
                    <td>{trade.volume.toFixed(2)}</td>
                    <td className={trade.profit >= 0 ? 'profit' : 'loss'}>
                      {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingHistory;
