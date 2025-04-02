import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Trading from '../pages/Trading';
import '@testing-library/jest-dom';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => ({
    isAuthenticated: true,
    accountInfo: {
      balance: 10000,
      equity: 10250,
      margin: 1200,
      freeMargin: 9050,
      leverage: 100,
      name: 'Test Account',
      server: 'test-server',
      currency: 'USD',
      company: 'Test Broker'
    }
  })
}));

// Mock the mt4Service
jest.mock('../services/mt4Service', () => ({
  getPositions: jest.fn().mockResolvedValue([
    {
      ticket: 12345,
      symbol: 'EURUSD',
      type: 'buy',
      volume: 0.1,
      openTime: new Date(),
      openPrice: 1.10000,
      stopLoss: 1.09500,
      takeProfit: 1.10500,
      profit: 25.5,
      commission: 0,
      swap: 0,
      comment: '',
      magic: 123456
    }
  ]),
  getMarketData: jest.fn().mockResolvedValue({
    symbol: 'EURUSD',
    bid: 1.10000,
    ask: 1.10010,
    time: new Date(),
    spread: 1.0,
    high: 1.10100,
    low: 1.09900,
    volume: 1000
  }),
  placeTrade: jest.fn().mockResolvedValue({
    ticket: 12346,
    openTime: new Date(),
    openPrice: 1.10010,
    success: true
  }),
  closePosition: jest.fn().mockResolvedValue(true)
}));

describe('Trading Component', () => {
  const renderTradingComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Trading />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders trading page correctly', async () => {
    renderTradingComponent();
    
    // Check if the main elements are rendered
    expect(screen.getByText('Trading')).toBeInTheDocument();
    
    // Wait for market data to load
    await waitFor(() => {
      expect(screen.getByText('Bid')).toBeInTheDocument();
      expect(screen.getByText('Ask')).toBeInTheDocument();
    });
    
    // Check for order form
    expect(screen.getByText('Place Order')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
    
    // Check for positions table
    expect(screen.getByText('Open Positions')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('12345')).toBeInTheDocument(); // Ticket number
    });
  });

  test('handles symbol change', async () => {
    renderTradingComponent();
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    });
    
    // Change symbol to GBP/USD
    fireEvent.click(screen.getByText('GBP/USD'));
    
    // Verify that mt4Service.getMarketData was called with the new symbol
    await waitFor(() => {
      expect(require('../services/mt4Service').getMarketData).toHaveBeenCalledWith('GBPUSD');
    });
  });

  test('handles order type selection', async () => {
    renderTradingComponent();
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('BUY')).toBeInTheDocument();
    });
    
    // Change order type to SELL
    fireEvent.click(screen.getByText('SELL'));
    
    // Verify that the SELL button is now active
    await waitFor(() => {
      const sellButton = screen.getByText('SELL');
      expect(sellButton.closest('button')).toHaveClass('MuiButton-contained');
    });
  });

  test('handles volume selection', async () => {
    renderTradingComponent();
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('0.01')).toBeInTheDocument();
    });
    
    // Change volume to 0.1
    fireEvent.click(screen.getByText('0.1'));
    
    // Verify that the 0.1 button is now active
    await waitFor(() => {
      const volumeButton = screen.getByText('0.1');
      expect(volumeButton.closest('button')).toHaveClass('MuiButton-contained');
    });
  });

  test('submits order form', async () => {
    renderTradingComponent();
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('BUY')).toBeInTheDocument();
    });
    
    // Set volume to 0.1
    fireEvent.click(screen.getByText('0.1'));
    
    // Submit the form
    const submitButton = screen.getByText('BUY 0.01 EURUSD');
    fireEvent.click(submitButton);
    
    // Verify that mt4Service.placeTrade was called with the correct parameters
    await waitFor(() => {
      expect(require('../services/mt4Service').placeTrade).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'EURUSD',
          type: 'buy',
          volume: 0.01
        })
      );
    });
  });

  test('closes position', async () => {
    renderTradingComponent();
    
    // Wait for positions to load
    await waitFor(() => {
      expect(screen.getByText('12345')).toBeInTheDocument(); // Ticket number
    });
    
    // Find and click the Close button
    const closeButtons = screen.getAllByText('Close');
    fireEvent.click(closeButtons[0]);
    
    // Verify that mt4Service.closePosition was called with the correct ticket
    await waitFor(() => {
      expect(require('../services/mt4Service').closePosition).toHaveBeenCalledWith(12345);
    });
  });
});
