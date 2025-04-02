import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import StrategyDashboard from '../../components/strategy/StrategyDashboard';
import StrategyOptimizer from '../../components/strategy/StrategyOptimizer';

// Mock the services and hooks
jest.mock('../../services/capitalcom/CapitalComService');
jest.mock('../../services/capitalcom/AdaptiveRsiStrategy', () => ({
  useAdaptiveRsiStrategy: jest.fn(() => ({
    isInitialized: true,
    isRunning: false,
    currentRSI: 45.67,
    performanceMetrics: {
      winRate: 60.5,
      profitFactor: 1.75,
      averageWin: 25.5,
      averageLoss: 15.2,
      consecutiveWins: 3,
      consecutiveLosses: 0,
      totalTrades: 42,
      profitableTrades: 25,
      totalProfit: 637.5,
      totalLoss: 364.8
    },
    parameters: {
      symbol: 'EURUSD',
      timeframe: 'HOUR',
      rsiPeriod: 14,
      overboughtThreshold: 70,
      oversoldThreshold: 30,
      positionSize: 1.0,
      stopLossPercent: 1.0,
      takeProfitPercent: 2.0,
      enableAutoTrading: false
    },
    toggleStrategy: jest.fn()
  }))
}));

jest.mock('../../services/capitalcom/EnhancedStrategyOptimizer', () => ({
  useEnhancedStrategyOptimizer: jest.fn(() => ({
    isInitialized: true,
    isLoading: false,
    optimizedParameters: {
      symbol: 'EURUSD',
      timeframe: 'HOUR',
      rsiPeriod: 11,
      overboughtThreshold: 75,
      oversoldThreshold: 25,
      positionSize: 1.2,
      stopLossPercent: 1.5,
      takeProfitPercent: 2.5,
      enableAutoTrading: false
    },
    marketAnalysis: {
      symbol: 'EURUSD',
      timeframe: 'HOUR',
      marketRegime: 'trending',
      volatilityLevel: 'medium',
      marketSentiment: 'bullish',
      correlations: {
        'GBPUSD': 0.85,
        'USDCHF': -0.72,
        'EURGBP': 0.45,
        'EURJPY': 0.68
      }
    },
    error: null,
    initializeOptimizer: jest.fn()
  }))
}));

// Mock chart components
jest.mock('../../components/charts/TradingViewWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="trading-view-widget">TradingView Widget</div>
}));

jest.mock('../../components/charts/RealTimeTicker', () => ({
  __esModule: true,
  default: ({ symbol }) => <div data-testid="real-time-ticker">Real-time Ticker for {symbol}</div>
}));

jest.mock('../../components/charts/PriceHistoryChart', () => ({
  __esModule: true,
  default: ({ symbol, timeframe }) => (
    <div data-testid="price-history-chart">
      Price History Chart for {symbol} ({timeframe})
    </div>
  )
}));

describe('UI Component Integration Tests', () => {
  // Mock user data
  const mockUser = {
    username: 'testuser',
    password: 'testpassword',
    apiKey: 'test-api-key',
    sessionToken: 'test-session-token',
    isDemo: true
  };

  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('StrategyDashboard should render correctly', async () => {
    // Render the component
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <StrategyDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Verify that the component renders correctly
    expect(screen.getByText('Adaptive RSI Strategy Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('trading-view-widget')).toBeInTheDocument();
    expect(screen.getByTestId('real-time-ticker')).toBeInTheDocument();
    expect(screen.getByTestId('price-history-chart')).toBeInTheDocument();
    
    // Verify that strategy information is displayed
    expect(screen.getByText('Symbol:')).toBeInTheDocument();
    expect(screen.getByText('EURUSD')).toBeInTheDocument();
    expect(screen.getByText('Current RSI:')).toBeInTheDocument();
    expect(screen.getByText('45.67')).toBeInTheDocument();
    
    // Verify that performance metrics are displayed
    expect(screen.getByText('Win Rate:')).toBeInTheDocument();
    expect(screen.getByText('60.50%')).toBeInTheDocument();
    expect(screen.getByText('Profit Factor:')).toBeInTheDocument();
    expect(screen.getByText('1.75')).toBeInTheDocument();
    
    // Verify that buttons are present
    expect(screen.getByText('Edit Configuration')).toBeInTheDocument();
    expect(screen.getByText('Start Strategy')).toBeInTheDocument();
  });

  test('StrategyOptimizer should render correctly', async () => {
    // Render the component
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <StrategyOptimizer />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Verify that the component renders correctly
    expect(screen.getByText('Enhanced Strategy Optimizer')).toBeInTheDocument();
    
    // Verify that market analysis is displayed
    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
    expect(screen.getByText('EURUSD (HOUR)')).toBeInTheDocument();
    expect(screen.getByText('Market Regime:')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Volatility:')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Sentiment:')).toBeInTheDocument();
    expect(screen.getByText('Bullish')).toBeInTheDocument();
    
    // Verify that optimized parameters are displayed
    expect(screen.getByText('Optimized Strategy Parameters')).toBeInTheDocument();
    expect(screen.getByText('RSI Period:')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('RSI Thresholds:')).toBeInTheDocument();
    expect(screen.getByText('25 / 75')).toBeInTheDocument();
    
    // Verify that the apply button is present
    expect(screen.getByText('Apply Optimized Parameters')).toBeInTheDocument();
    
    // Verify that the optimization process explanation is displayed
    expect(screen.getByText('Optimization Process')).toBeInTheDocument();
    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
    expect(screen.getByText('Parameter Optimization')).toBeInTheDocument();
    expect(screen.getByText('Strategy Adaptation')).toBeInTheDocument();
  });

  test('StrategyDashboard should handle strategy toggle', async () => {
    // Get the mock function
    const { useAdaptiveRsiStrategy } = require('../../services/capitalcom/AdaptiveRsiStrategy');
    const mockToggleStrategy = useAdaptiveRsiStrategy().toggleStrategy;
    
    // Render the component
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <StrategyDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Click the start strategy button
    userEvent.click(screen.getByText('Start Strategy'));
    
    // Verify that the toggle function was called
    expect(mockToggleStrategy).toHaveBeenCalled();
  });

  test('StrategyOptimizer should handle apply parameters', async () => {
    // Create a spy on console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Render the component
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <StrategyOptimizer />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Click the apply parameters button
    userEvent.click(screen.getByText('Apply Optimized Parameters'));
    
    // Verify that the parameters were logged (since we're mocking the actual application)
    expect(consoleSpy).toHaveBeenCalledWith('Applying optimized parameters:', expect.any(Object));
    
    // Restore console.log
    consoleSpy.mockRestore();
  });
});
