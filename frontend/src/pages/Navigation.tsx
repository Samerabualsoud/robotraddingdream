import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="navigation">
      <div className="logo">
        <h2>Forex Trading</h2>
      </div>
      <ul className="nav-links">
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li className={location.pathname === '/trading' ? 'active' : ''}>
          <Link to="/trading">Trading</Link>
        </li>
        <li className={location.pathname === '/history' ? 'active' : ''}>
          <Link to="/history">History</Link>
        </li>
        <li className={location.pathname === '/account' ? 'active' : ''}>
          <Link to="/account">Account</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
