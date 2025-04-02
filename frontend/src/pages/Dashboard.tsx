import React from 'react';
import Navigation from '../components/layout/Navigation';
import TradingViewWidget from '../components/charts/TradingViewWidget';
import FinancialNews from '../components/news/FinancialNews';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Navigation />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Market Overview</h1>
        </div>
        <div className="dashboard-grid">
          <div className="chart-container">
            <h2>EUR/USD Chart</h2>
            <TradingViewWidget symbol="EURUSD" />
          </div>
          <div className="news-container">
            <h2>Financial News</h2>
            <FinancialNews />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
