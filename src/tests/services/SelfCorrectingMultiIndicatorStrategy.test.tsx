import { renderHook, act } from '@testing-library/react-hooks';
import useMultiIndicatorStrategy from '../../services/capitalcom/SelfCorrectingMultiIndicatorStrategy';
import CapitalComService from '../../services/capitalcom/CapitalComService';

// Mock the CapitalComService
jest.mock('../../services/capitalcom/CapitalComService');

describe('SelfCorrectingMultiIndicatorStrategy Hook', () => {
  // Default test parameters
  const defaultParams = {
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

  // Mock price history data
  const mockPriceHistory = {
    prices: Array(100).fill(0).map((_, i) => ({
      timestamp: Date.now() - (100 - i) * 3600000,
      open: 1.2000 + Math.random() * 0.01,
      high: 1.2050 + Math.random() * 0.01,
      low: 1.1950 + Math.random() * 0.01,
      close: 1.2000 + Math.random() * 0.01,
      volume: Math.floor(Math.random() * 1000)
    }))
  };

  // Mock trade history data
  const mockTradeHistory = {
    trades: [
      {
        id: 'trade1',
        direction: 'BUY',
        openPrice: 1.2000,
        closePrice: 1.2050,
        stopLoss: 1.1950,
        takeProfit: 1.2100,
        openTime: Date.now() - 24 * 3600000,
        closeTime: Date.now() - 12 * 3600000,
        profit: 0.0050,
        status: 'closed',
        metadata: {
          indicators: {
            rsi: 1,
            macd: 1,
            ma: 1,
            bb: 0
          }
        }
      },
      {
        id: 'trade2',
        direction: 'SELL',
        openPrice: 1.2100,
        closePrice: 1.2050,
        stopLoss: 1.2150,
        takeProfit: 1.2000,
        openTime: Date.now() - 10 * 3600000,
        closeTime: Date.now() - 5 * 3600000,
        profit: 0.0050,
        status: 'closed',
        metadata: {
          indicators: {
            rsi: -1,
            macd: -1,
            ma: 0,
            bb: -1
          }
        }
      }
    ]
  };

  // Setup mock implementation
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock CapitalComService methods
    CapitalComService.mockImplementation(() => ({
      getPriceHistory: jest.fn().mockResolvedValue(mockPriceHistory),
      getTradeHistory: jest.fn().mockResolvedValue(mockTradeHistory),
      executeTrade: jest.fn().mockResolvedValue({ tradeId: 'new-trade-id' }),
      closeTrade: jest.fn().mockResolvedValue({ success: true })
    }));
  });

  test('initializes with default parameters', () => {
    const { result } = renderHook(() => useMultiIndicatorStrategy(defaultParams));
    
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.parameters).toEqual(defaultParams);
    expect(result.current.indicatorValues).toBeNull();
    expect(result.current.performanceMetrics).toBeNull();
    expect(result.current.marketAnalysis).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('initializes strategy successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMultiIndicatorStrategy(defaultParams));
    
    const mockCapitalComService = new CapitalComService();
    const mockSessionToken = 'test-session-token';
    const mockIsDemo = true;
    
    // Initialize strategy
    act(() => {
      result.current.initializeStrategy(mockCapitalComService, mockSessionToken, mockIsDemo);
    });
    
    // Wait for initialization to complete
    await waitForNextUpdate();
    
    // Verify initialization
    expect(mockCapitalComService.getPriceHistory).toHaveBeenCalledWith(
      defaultParams.symbol,
      defaultParams.timeframe,
      expect.any(Number),
      expect.any(Number)
    );
    
    expect(mockCapitalComService.getTradeHistory).toHaveBeenCalledWith(defaultParams.symbol);
    
    // Check if strategy is initialized
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.indicatorValues).not.toBeNull();
    expect(result.current.performanceMetrics).not.toBeNull();
    expect(result.current.marketAnalysis).not.toBeNull();
  });

  test('toggles strategy running state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMultiIndicatorStrategy(defaultParams));
    
    const mockCapitalComService = new CapitalComService();
    const mockSessionToken = 'test-session-token';
    const mockIsDemo = true;
    
    // Initialize strategy
    act(() => {
      result.current.initializeStrategy(mockCapitalComService, mockSessionToken, mockIsDemo);
    });
    
    // Wait for initialization to complete
    await waitForNextUpdate();
    
    // Initially not running
    expect(result.current.isRunning).toBe(false);
    
    // Toggle to start
    act(() => {
      result.current.toggleStrategy();
    });
    
    // Should be running
    expect(result.current.isRunning).toBe(true);
    
    // Toggle to stop
    act(() => {
      result.current.toggleStrategy();
    });
    
    // Should not be running
    expect(result.current.isRunning).toBe(false);
  });

  test('updates parameters', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMultiIndicatorStrategy(defaultParams));
    
    const mockCapitalComService = new CapitalComService();
    const mockSessionToken = 'test-session-token';
    const mockIsDemo = true;
    
    // Initialize strategy
    act(() => {
      result.current.initializeStrategy(mockCapitalComService, mockSessionToken, mockIsDemo);
    });
    
    // Wait for initialization to complete
    await waitForNextUpdate();
    
    // Initial RSI period
    expect(result.current.parameters.rsiPeriod).toBe(defaultParams.rsiPeriod);
    
    // Update RSI period
    const newRsiPeriod = 10;
    act(() => {
      result.current.updateParameters({ rsiPeriod: newRsiPeriod });
    });
    
    // Check if parameter was updated
    expect(result.current.parameters.rsiPeriod).toBe(newRsiPeriod);
  });

  test('handles self-correction after trades', async () => {
    // This test would ideally verify that the strategy parameters are adjusted
    // after trades are executed and closed. However, this requires more complex
    // mocking of time and strategy behavior.
    
    // For now, we'll just verify that the strategy can be initialized and
    // that the performance metrics are calculated correctly based on mock trades.
    
    const { result, waitForNextUpdate } = renderHook(() => useMultiIndicatorStrategy(defaultParams));
    
    const mockCapitalComService = new CapitalComService();
    const mockSessionToken = 'test-session-token';
    const mockIsDemo = true;
    
    // Initialize strategy
    act(() => {
      result.current.initializeStrategy(mockCapitalComService, mockSessionToken, mockIsDemo);
    });
    
    // Wait for initialization to complete
    await waitForNextUpdate();
    
    // Check performance metrics based on mock trade history
    expect(result.current.performanceMetrics).not.toBeNull();
    expect(result.current.performanceMetrics.totalTrades).toBe(2);
    expect(result.current.performanceMetrics.profitableTrades).toBe(2);
    expect(result.current.performanceMetrics.winRate).toBe(100);
  });

  test('handles market regime detection', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMultiIndicatorStrategy(defaultParams));
    
    const mockCapitalComService = new CapitalComService();
    const mockSessionToken = 'test-session-token';
    const mockIsDemo = true;
    
    // Initialize strategy
    act(() => {
      result.current.initializeStrategy(mockCapitalComService, mockSessionToken, mockIsDemo);
    });
    
    // Wait for initialization to complete
    await waitForNextUpdate();
    
    // Check market analysis
    expect(result.current.marketAnalysis).not.toBeNull();
    expect(result.current.marketAnalysis.regime).toBeDefined();
    expect(['trending', 'ranging', 'volatile']).toContain(result.current.marketAnalysis.regime);
    expect(result.current.marketAnalysis.volatility).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(result.current.marketAnalysis.volatility);
    expect(result.current.marketAnalysis.sentiment).toBeDefined();
    expect(['bullish', 'bearish', 'neutral']).toContain(result.current.marketAnalysis.sentiment);
  });
});
