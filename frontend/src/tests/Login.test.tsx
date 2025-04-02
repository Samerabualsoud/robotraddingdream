import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Login from '../pages/Login';
import '@testing-library/jest-dom';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the mt4Service
jest.mock('../services/mt4Service', () => ({
  login: jest.fn().mockResolvedValue(true),
  getAccountInfo: jest.fn().mockResolvedValue({
    balance: 10000,
    equity: 10250,
    margin: 1200,
    freeMargin: 9050,
    leverage: 100,
    name: 'Test Account',
    server: 'test-server',
    currency: 'USD',
    company: 'Test Broker'
  })
}));

describe('Login Component', () => {
  const renderLoginComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders login form correctly', () => {
    renderLoginComponent();
    
    // Check if the form elements are rendered
    expect(screen.getByText('Forex Trading Platform')).toBeInTheDocument();
    expect(screen.getByLabelText(/Server/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    renderLoginComponent();
    
    // Try to submit the form without filling in the fields
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Server is required/i)).toBeInTheDocument();
    });
    
    // Fill in server field and try again
    fireEvent.change(screen.getByLabelText(/Server/i), { target: { value: 'test-server' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check for next validation error
    await waitFor(() => {
      expect(screen.getByText(/Login is required/i)).toBeInTheDocument();
    });
    
    // Fill in login field and try again
    fireEvent.change(screen.getByLabelText(/Login/i), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check for next validation error
    await waitFor(() => {
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  test('handles platform type selection', () => {
    renderLoginComponent();
    
    // Check if MT4 is selected by default
    expect(screen.getByText('MetaTrader 4')).toBeInTheDocument();
    
    // Change to MT5
    fireEvent.mouseDown(screen.getByLabelText(/Platform/i));
    fireEvent.click(screen.getByText('MetaTrader 5'));
    
    // Check if MT5 is now selected
    expect(screen.getByText('MetaTrader 5')).toBeInTheDocument();
  });

  test('submits form with valid credentials', async () => {
    renderLoginComponent();
    
    // Fill in all fields
    fireEvent.change(screen.getByLabelText(/Server/i), { target: { value: 'test-server' } });
    fireEvent.change(screen.getByLabelText(/Login/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check that the form submission is in progress
    await waitFor(() => {
      expect(screen.queryByText(/Server is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Login is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Password is required/i)).not.toBeInTheDocument();
    });
  });
});
