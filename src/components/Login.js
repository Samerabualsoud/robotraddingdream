import React, { useState } from 'react';
import { mt4Api, mt5Api, capitalComApi } from '../services/api';

const Login = ({ setIsAuthenticated }) => {
  const [platform, setPlatform] = useState('mt4');
  const [credentials, setCredentials] = useState({
    server: '',
    login: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handlePlatformChange = (e) => {
    setPlatform(e.target.value);
    setError('');
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (platform === 'mt4') {
        response = await mt4Api.login({
          server: credentials.server,
          login: credentials.login,
          password: credentials.password,
          type: 'mt4'
        });
      } else if (platform === 'mt5') {
        response = await mt5Api.login({
          server: credentials.server,
          login: credentials.login,
          password: credentials.password,
          type: 'mt5'
        });
      } else if (platform === 'capital') {
        response = await capitalComApi.login({
          username: credentials.username,
          password: credentials.password
        });
      } else if (platform === 'demo') {
        // Demo mode - bypass authentication
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('platform', 'demo');
        setIsAuthenticated(true);
        return;
      }
      
      if (response && response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('platform', platform);
        setIsAuthenticated(true);
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('platform', 'demo');
    setIsAuthenticated(true);
  };

  return (
    <div className="login-container">
      <h1>RobotRaddingDream Login</h1>
      
      <div className="platform-selector">
        <label>
          <input 
            type="radio" 
            value="mt4" 
            checked={platform === 'mt4'} 
            onChange={handlePlatformChange} 
          />
          MetaTrader 4
        </label>
        <label>
          <input 
            type="radio" 
            value="mt5" 
            checked={platform === 'mt5'} 
            onChange={handlePlatformChange} 
          />
          MetaTrader 5
        </label>
        <label>
          <input 
            type="radio" 
            value="capital" 
            checked={platform === 'capital'} 
            onChange={handlePlatformChange} 
          />
          Capital.com
        </label>
      </div>
      
      <div className="login-form">
        {(platform === 'mt4' || platform === 'mt5') && (
          <>
            <input 
              type="text" 
              name="server" 
              placeholder="Server" 
              value={credentials.server}
              onChange={handleChange}
            />
            <input 
              type="text" 
              name="login" 
              placeholder="Login" 
              value={credentials.login}
              onChange={handleChange}
            />
          </>
        )}
        
        {platform === 'capital' && (
          <input 
            type="text" 
            name="username" 
            placeholder="Username" 
            value={credentials.username}
            onChange={handleChange}
          />
        )}
        
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          value={credentials.password}
          onChange={handleChange}
        />
        
        <button 
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        
        <button 
          onClick={handleDemoLogin} 
          className="demo-button"
        >
          Enter Demo Mode
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default Login;
