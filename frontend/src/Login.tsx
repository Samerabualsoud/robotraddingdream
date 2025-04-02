import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [server, setServer] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ server, login, password });
    // Add login logic here
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Forex Trading Platform</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="server">Server</label>
            <input
              type="text"
              id="server"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login">Login</label>
            <input
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">Sign In</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
