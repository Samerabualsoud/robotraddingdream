import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import TradingHistory from './pages/TradingHistory';
import AccountSettings from './pages/AccountSettings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/history" element={<TradingHistory />} />
        <Route path="/account" element={<AccountSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
