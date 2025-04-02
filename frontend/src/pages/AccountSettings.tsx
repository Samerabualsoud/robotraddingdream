import React, { useState, useEffect } from 'react';
import Navigation from '../components/layout/Navigation';
import './AccountSettings.css';

interface AccountInfo {
  server: string;
  login: string;
  name: string;
  email: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
}

const AccountSettings: React.FC = () => {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [leverage, setLeverage] = useState('100');
  
  useEffect(() => {
    // In a real application, you would fetch from your backend
    // For this demo, we'll use mock data
    const mockAccount: AccountInfo = {
      server: 'Demo-Server',
      login: '12345678',
      name: 'John Doe',
      email: 'john.doe@example.com',
      balance: 10000.00,
      equity: 10250.75,
      margin: 1200.50,
      freeMargin: 9050.25,
      leverage: 100
    };

    // Simulate API call
    setTimeout(() => {
      setAccountInfo(mockAccount);
      setEmail(mockAccount.email);
      setLeverage(mockAccount.leverage.toString());
      setLoading(false);
    }, 1000);
  }, []);

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };
  
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password updated successfully!');
    setPassword('');
    setConfirmPassword('');
  };
  
  const handleTradingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Leverage changed to ${leverage}:1`);
  };
  
  if (loading) {
    return (
      <div className="account-page">
        <Navigation />
        <div className="account-content">
          <div className="loading">Loading account information...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="account-page">
      <Navigation />
      <div className="account-content">
        <div className="account-header">
          <h1>Account Settings</h1>
        </div>
        
        <div className="account-info-summary">
          <div className="info-card">
            <h3>Balance</h3>
            <p>${accountInfo?.balance.toFixed(2)}</p>
          </div>
          <div className="info-card">
            <h3>Equity</h3>
            <p>${accountInfo?.equity.toFixed(2)}</p>
          </div>
          <div className="info-card">
            <h3>Margin</h3>
            <p>${accountInfo?.margin.toFixed(2)}</p>
          </div>
          <div className="info-card">
            <h3>Free Margin</h3>
            <p>${accountInfo?.freeMargin.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="settings-container">
          <div className="settings-tabs">
            <button 
              className={activeTab === 'general' ? 'active' : ''} 
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={activeTab === 'security' ? 'active' : ''} 
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button 
              className={activeTab === 'trading' ? 'active' : ''} 
              onClick={() => setActiveTab('trading')}
            >
              Trading
            </button>
          </div>
          
          <div className="settings-content">
            {activeTab === 'general' && (
              <form onSubmit={handleGeneralSubmit}>
                <div className="form-group">
                  <label>Server</label>
                  <input type="text" value={accountInfo?.server} disabled />
                </div>
                <div className="form-group">
                  <label>Login</label>
                  <input type="text" value={accountInfo?.login} disabled />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={accountInfo?.name} disabled />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <button type="submit" className="save-button">Save Changes</button>
              </form>
            )}
            
            {activeTab === 'security' && (
              <form onSubmit={handleSecuritySubmit}>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />
                </div>
                <button type="submit" className="save-button">Update Password</button>
              </form>
            )}
            
            {activeTab === 'trading' && (
              <form onSubmit={handleTradingSubmit}>
                <div className="form-group">
                  <label>Leverage</label>
                  <select 
                    value={leverage} 
                    onChange={(e) => setLeverage(e.target.value)}
                  >
                    <option value="50">50:1</option>
                    <option value="100">100:1</option>
                    <option value="200">200:1</option>
                    <option value="500">500:1</option>
                  </select>
                </div>
                <button type="submit" className="save-button">Save Changes</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
