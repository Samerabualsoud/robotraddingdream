import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Alert,
  Paper,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MT4Credentials } from '../types/mt4Types';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  
  const [credentials, setCredentials] = useState<MT4Credentials>({
    server: '',
    login: '',
    password: '',
    type: 'mt4'
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  // Check for saved server and platform type in localStorage
  useEffect(() => {
    const savedServer = localStorage.getItem('last_server');
    const savedType = localStorage.getItem('platform_type');
    
    if (savedServer) {
      setCredentials(prev => ({
        ...prev,
        server: savedServer,
        type: savedType as 'mt4' | 'mt5' || 'mt4'
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCredentials(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    // Check if account is locked out
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setFormError(`Account temporarily locked. Please try again in ${remainingTime} minutes.`);
      return false;
    }
    
    if (!credentials.server.trim()) {
      setFormError('Server is required');
      return false;
    }
    
    if (!credentials.login.trim()) {
      setFormError('Login is required');
      return false;
    }
    
    if (!credentials.password.trim()) {
      setFormError('Password is required');
      return false;
    }
    
    // Password strength check for demo purposes
    if (credentials.password.length < 8) {
      setSecurityAlert('Warning: Short passwords are less secure. Consider using a stronger password.');
    } else {
      setSecurityAlert(null);
    }
    
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const success = await login(credentials);
      
      if (success) {
        // Reset login attempts on success
        setLoginAttempts(0);
        
        // Save server and platform type for convenience
        localStorage.setItem('last_server', credentials.server);
        localStorage.setItem('platform_type', credentials.type);
        
        navigate('/dashboard');
      } else {
        // Increment login attempts on failure
        const attempts = loginAttempts + 1;
        setLoginAttempts(attempts);
        
        // Implement account lockout after 5 failed attempts
        if (attempts >= 5) {
          const lockoutDuration = 15 * 60 * 1000; // 15 minutes
          setLockoutTime(Date.now() + lockoutDuration);
          setFormError(`Too many failed login attempts. Account locked for 15 minutes.`);
          
          // Reset attempts after lockout period
          setTimeout(() => {
            setLoginAttempts(0);
            setLockoutTime(null);
          }, lockoutDuration);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setFormError('Authentication failed. Please check your credentials.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseAlert = () => {
    setSecurityAlert(null);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={6} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Forex Trading Platform
        </Typography>
        
        {(error || formError) && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error || formError}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="platform-type-label">Platform</InputLabel>
            <Select
              labelId="platform-type-label"
              id="type"
              name="type"
              value={credentials.type}
              label="Platform"
              onChange={handleChange}
            >
              <MenuItem value="mt4">MetaTrader 4</MenuItem>
              <MenuItem value="mt5">MetaTrader 5</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="server"
            label="Server"
            name="server"
            autoComplete="server"
            value={credentials.server}
            onChange={handleChange}
            autoFocus
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="login"
            label="Login"
            name="login"
            autoComplete="username"
            value={credentials.login}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading || (lockoutTime !== null && Date.now() < lockoutTime)}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>
      
      <Snackbar
        open={securityAlert !== null}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        message={securityAlert}
      />
    </Container>
  );
};

export default Login;
