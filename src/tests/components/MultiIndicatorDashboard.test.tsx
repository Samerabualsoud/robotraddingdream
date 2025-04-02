import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import MultiIndicatorDashboard from '../../components/strategy/MultiIndicatorDashboard';
import CapitalComService from '../../services/capitalcom/CapitalComService';
import useMultiIndicatorStrategy from '../../services/capitalcom/SelfCorrectingMultiIndicatorStrategy';

// Mock the hooks and services
jest.mock('../../services/capitalcom/CapitalComService');
jest.mock('../../services/capitalcom/SelfCorrectingMultiIndicatorStrategy');

// Mock TradingViewWidget component
jest.mock('../../components/charts/TradingViewWidget', () => {
  return function DummyTradingViewWidget() {
    return <div data-testid="trading-view-widget">TradingView Widget</div>;
  };
});

// Mock RealTimeTicker component
jest.mock('../../components/charts/RealTimeTicker', () => {
  return function DummyRealTimeTicker() {
    return <div data-testid="real-time-ticker">Real-Time Ticker</div>;
  };
});

// Mock PriceHistoryChart component
jest.mock('../../components/charts/PriceHistoryChart', () => {
  return function DummyPriceHistoryChart() {
    return <div data-testid="price-history-chart">Price History Chart</div>;
  };
});

// Mock useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: {
      sessionToken: 'test-token',
      isDemo: true
    }
  })
}));

describe('MultiIndicatorDashboard Component', () => {
  // Setup mock data
  const mockIndicatorValues = {
    rsi: 45.5,
    macd: {
      macdLine: 0.0025,
      signalLine: 0.0015,
      histogram: 0.001
    },
    ma: {
      fast: 1.2345,
      slow: 1.2340
    },
    bb: {
      upper: 1.2400,
      middle: 1.2350,
      lower: 1.2300
    },
    atr: 0.0012
  };

  const mockPerformanceMetrics = {
    winRate: 65.5,
    profitFactor: 1.75,
    totalTrades: 42,
    profitableTrades: 28,
    averageWin: 0.0045,
    averageLoss: 0.0025,
    consecutiveWins: 5,
    consecutiveLosses: 2,
    indicatorPerformance: {
      rsi: { accuracy: 70.5, trades: 25 },
      macd: { accuracy: 62.3, trades: 30 },
      ma: { accuracy: 58.7, trades: 35 },
      bb: { accuracy: 68.2, trades: 22 }
    }
  };

  const mockParameters = {
    symbol: 'EURUSD',
    timeframe: 'HOUR',
    rsiPeriod: 14,
    overboughtThreshold: 70,
    oversoldThreshold: 30,
    fastMAPeriod: 9,
    slowMAPeriod: 21,
    macdFastPeriod: 12,
    macdSlowPeriod: 26,
    macdSignalPeriod: 9,
    bbPeriod: 20,
    bbDeviation: 2,
    atrPeriod: 14,
    positionSize: 1.0,
    stopLossPercent: 1.0,
    takeProfitPercent: 2.0,
    enableAutoTrading: false,
    rsiWeight: 0.25,
    macdWeight: 0.25,
    maWeight: 0.25,
    bbWeight: 0.25
  };

  const mockMarketAnalysis = {
    regime: 'trending',
    volatility: 'medium',
    sentiment: 'bullish'
  };

  // Setup mock implementation
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the strategy hook
    useMultiIndicatorStrategy.mockReturnValue({
      initializeStrategy: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
      isRunning: false,
      indicatorValues: mockIndicatorValues,
      performanceMetrics: mockPerformanceMetrics,
      parameters: mockParameters,
      marketAnalysis: mockMarketAnalysis,
      toggleStrategy: jest.fn(),
      updateParameters: jest.fn()
    });

    // Mock CapitalComService constructor
    CapitalComService.mockImplementation(() => ({
      getPriceHistory: jest.fn().mockResolvedValue({
        prices: [
          { timestamp: 1617235200000, open: 1.2345, high: 1.2355, low: 1.2335, close: 1.2350, volume: 1000 }
        ]
      }),
      getTradeHistory: jest.fn().mockResolvedValue({
        trades: []
      }),
      executeTrade: jest.fn().mockResolvedValue({ tradeId: 'test-trade-id' }),
      closeTrade: jest.fn().mockResolvedValue({ success: true })
    }));
  });

  test('renders dashboard with strategy information', async () => {
    render(<MultiIndicatorDashboard />);

    // Check if main components are rendered
    expect(screen.getByText('Multi-Indicator Trading Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('trading-view-widget')).toBeInTheDocument();
    expect(screen.getByText('Strategy Information')).toBeInTheDocument();

    // Check if strategy information is displayed
    expect(screen.getByText(/Symbol:/)).toBeInTheDocument();
    expect(screen.getByText(/EURUSD/)).toBeInTheDocument();
    expect(screen.getByText(/Timeframe:/)).toBeInTheDocument();
    expect(screen.getByText(/HOUR/)).toBeInTheDocument();
    expect(screen.getByText(/Market Regime:/)).toBeInTheDocument();
    expect(screen.getByText(/trending/i)).toBeInTheDocument();
  });

  test('displays current indicator values', async () => {
    render(<MultiIndicatorDashboard />);

    // Check if indicator values are displayed
    expect(screen.getByText(/RSI:/)).toBeInTheDocument();
    expect(screen.getByText(/45.50/)).toBeInTheDocument();
    expect(screen.getByText(/MACD:/)).toBeInTheDocument();
    expect(screen.getByText(/Fast MA:/)).toBeInTheDocument();
    expect(screen.getByText(/Slow MA:/)).toBeInTheDocument();
    expect(screen.getByText(/BB Upper:/)).toBeInTheDocument();
    expect(screen.getByText(/BB Lower:/)).toBeInTheDocument();
    expect(screen.getByText(/ATR:/)).toBeInTheDocument();
  });

  test('displays performance metrics', async () => {
    render(<MultiIndicatorDashboard />);

    // Check if performance metrics are displayed
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText(/Win Rate:/)).toBeInTheDocument();
    expect(screen.getByText(/65.50%/)).toBeInTheDocument();
    expect(screen.getByText(/Profit Factor:/)).toBeInTheDocument();
    expect(screen.getByText(/1.75/)).toBeInTheDocument();
    expect(screen.getByText(/Total Trades:/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/Profitable:/)).toBeInTheDocument();
    expect(screen.getByText(/28/)).toBeInTheDocument();
  });

  test('toggles strategy when button is clicked', async () => {
    const mockToggleStrategy = jest.fn();
    useMultiIndicatorStrategy.mockReturnValue({
      initializeStrategy: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
      isRunning: false,
      indicatorValues: mockIndicatorValues,
      performanceMetrics: mockPerformanceMetrics,
      parameters: mockParameters,
      marketAnalysis: mockMarketAnalysis,
      toggleStrategy: mockToggleStrategy,
      updateParameters: jest.fn()
    });

    render(<MultiIndicatorDashboard />);

    // Find and click the start strategy button
    const startButton = screen.getByText('Start Strategy');
    fireEvent.click(startButton);

    // Check if toggleStrategy was called
    expect(mockToggleStrategy).toHaveBeenCalledTimes(1);
  });

  test('toggles settings visibility when button is clicked', async () => {
    render(<MultiIndicatorDashboard />);

    // Initially, settings should not be visible
    expect(screen.queryByText('Strategy Settings')).not.toBeInTheDocument();

    // Find and click the show settings button
    const showSettingsButton = screen.getByText('Show Settings');
    fireEvent.click(showSettingsButton);

    // Now settings should be visible
    expect(screen.getByText('Strategy Settings')).toBeInTheDocument();
    expect(screen.getByText('RSI Settings')).toBeInTheDocument();
    expect(screen.getByText('Moving Average Settings')).toBeInTheDocument();
    expect(screen.getByText('MACD Settings')).toBeInTheDocument();
    expect(screen.getByText('Bollinger Bands Settings')).toBeInTheDocument();
    expect(screen.getByText('ATR Settings')).toBeInTheDocument();
    expect(screen.getByText('Risk Management')).toBeInTheDocument();

    // Click again to hide settings
    const hideSettingsButton = screen.getByText('Hide Settings');
    fireEvent.click(hideSettingsButton);

    // Settings should be hidden again
    expect(screen.queryByText('Strategy Settings')).not.toBeInTheDocument();
  });

  test('initializes strategy on component mount', async () => {
    const mockInitializeStrategy = jest.fn().mockResolvedValue(undefined);
    useMultiIndicatorStrategy.mockReturnValue({
      initializeStrategy: mockInitializeStrategy,
      isInitialized: false,
      isRunning: false,
      indicatorValues: null,
      performanceMetrics: null,
      parameters: mockParameters,
      marketAnalysis: null,
      toggleStrategy: jest.fn(),
      updateParameters: jest.fn()
    });

    render(<MultiIndicatorDashboard />);

    // Check if initializeStrategy was called
    await waitFor(() => {
      expect(mockInitializeStrategy).toHaveBeenCalled();
    });
  });

  test('displays loading state when initializing', async () => {
    useMultiIndicatorStrategy.mockReturnValue({
      initializeStrategy: jest.fn().mockResolvedValue(undefined),
      isInitialized: false,
      isRunning: false,
      indicatorValues: null,
      performanceMetrics: null,
      parameters: mockParameters,
      marketAnalysis: null,
      toggleStrategy: jest.fn(),
      updateParameters: jest.fn()
    });

    render(<MultiIndicatorDashboard />);

    // Check if loading state is displayed
    expect(screen.getByText('Initializing Multi-Indicator Strategy...')).toBeInTheDocument();
  });
});
