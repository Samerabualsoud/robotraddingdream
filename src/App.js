import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Placeholder components until the actual components are implemented
const Login = ({ setIsAuthenticated }) => {
  const handleLogin = () => {
    // Simulate login
    localStorage.setItem('token', 'dummy-token');
    setIsAuthenticated(true);
  };

  return (
    <div className="login-container">
      <h1>RobotRaddingDream Login</h1>
      <div className="login-form">
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button onClick={handleLogin}>Sign In</button>
      </div>
    </div>
  );
};

const Trading = () => {
  return (
    <div className="trading-container">
      <h1>Trading Dashboard</h1>
      <p>Welcome to the RobotRaddingDream trading platform!</p>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={
            !isAuthenticated ? 
            <Login setIsAuthenticated={setIsAuthenticated} /> : 
            <Navigate to="/trading" />
          } />
          <Route path="/trading" element={
            isAuthenticated ? 
            <Trading /> : 
            <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/trading" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
