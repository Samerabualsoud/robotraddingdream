import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../../contexts/AuthContext';
import CapitalComService from '../../services/capitalcom/CapitalComService';
import CapitalComWebSocket from '../../services/capitalcom/CapitalComWebSocket';
import { AdaptiveRsiStrategy } from '../../services/capitalcom/AdaptiveRsiStrategy';
import { EnhancedStrategyOptimizer } from '../../services/capitalcom/EnhancedStrategyOptimizer';

// Mock the services
jest.mock('../../services/capitalcom/CapitalComService');
jest.mock('../../services/capitalcom/CapitalComWebSocket');

describe('Capital.com Integration Tests', () => {
  // Mock user data
  const mockUser = {
    username: 'testuser',
    password: 'testpassword',
    apiKey: 'test-api-key',
    sessionToken: 'test-session-token',
    isDemo: true
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('CapitalComService should authenticate successfully', async () => {
    // Setup
    const service = new CapitalComService(true);
    (service.login as jest.Mock).mockResolvedValue(true);

    // Execute
    const result = await service.login({
      login: mockUser.username,
      password: mockUser.password,
      apiKey: mockUser.apiKey,
      encryptedPassword: false
    });

    // Verify
    expect(result).toBe(true);
    expect(service.login).toHaveBeenCalledWith({
      login: mockUser.username,
      password: mockUser.password,
      apiKey: mockUser.apiKey,
      encryptedPassword: false
    });
  });

  test('CapitalComService should fetch market data', async () => {
    // Setup
    const service = new CapitalComService(true);
    const mockMarketData = {
      bid: 1.1234,
      ask: 1.1236,
      high: 1.1250,
      low: 1.1200,
      open: 1.1220,
      volume: 10000
    };
    (service.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

    // Execute
    const result = await service.getMarketData('EURUSD');

    // Verify
    expect(result).toEqual(mockMarketData);
    expect(service.getMarketData).toHaveBeenCalledWith('EURUSD');
  });

  test('CapitalComService should fetch price history', async () => {
    // Setup
    const service = new CapitalComService(true);
    const mockPriceHistory = {
      prices: [
        { time: 1617235200000, open: 1.1220, high: 1.1250, low: 1.1200, close: 1.1230, volume: 10000 },
        { time: 1617238800000, open: 1.1230, high: 1.1260, low: 1.1220, close: 1.1240, volume: 12000 }
      ]
    };
    (service.getPriceHistory as jest.Mock).mockResolvedValue(mockPriceHistory);

    // Execute
    const result = await service.getPriceHistory(
      'EURUSD',
      'HOUR',
      1617235200000,
      1617242400000
    );

    // Verify
    expect(result).toEqual(mockPriceHistory);
    expect(service.getPriceHistory).toHaveBeenCalledWith(
      'EURUSD',
      'HOUR',
      1617235200000,
      1617242400000
    );
  });

  test('CapitalComService should place a trade', async () => {
    // Setup
    const service = new CapitalComService(true);
    const mockOrderResponse = {
      dealId: 'deal123',
      status: 'OPEN',
      direction: 'BUY',
      size: 1.0,
      level: 1.1234,
      stopLevel: 1.1134,
      profitLevel: 1.1334
    };
    (service.placeTrade as jest.Mock).mockResolvedValue(mockOrderResponse);

    // Execute
    const result = await service.placeTrade({
      symbol: 'EURUSD',
      direction: 'BUY',
      size: 1.0,
      stopLoss: 1.1134,
      takeProfit: 1.1334,
      orderType: 'MARKET'
    });

    // Verify
    expect(result).toEqual(mockOrderResponse);
    expect(service.placeTrade).toHaveBeenCalledWith({
      symbol: 'EURUSD',
      direction: 'BUY',
      size: 1.0,
      stopLoss: 1.1134,
      takeProfit: 1.1334,
      orderType: 'MARKET'
    });
  });

  test('CapitalComService should close a position', async () => {
    // Setup
    const service = new CapitalComService(true);
    const mockCloseResponse = {
      dealId: 'deal123',
      status: 'CLOSED',
      profit: 100.50
    };
    (service.closePosition as jest.Mock).mockResolvedValue(mockCloseResponse);

    // Execute
    const result = await service.closePosition('deal123');

    // Verify
    expect(result).toEqual(mockCloseResponse);
    expect(service.closePosition).toHaveBeenCalledWith('deal123');
  });

  test('CapitalComWebSocket should connect and subscribe', () => {
    // Setup
    const webSocket = new CapitalComWebSocket('test-session-token', true);
    const mockCallback = jest.fn();

    // Execute
    webSocket.subscribe('EURUSD', 'test-client', mockCallback);

    // Verify
    expect(webSocket.subscribe).toHaveBeenCalledWith('EURUSD', 'test-client', mockCallback);
  });

  test('AdaptiveRsiStrategy should initialize correctly', async () => {
    // Setup
    const service = new CapitalComService(true);
    (service.getPriceHistory as jest.Mock).mockResolvedValue({
      prices: Array(100).fill(0).map((_, i) => ({
        time: 1617235200000 + i * 3600000,
        open: 1.1220 + i * 0.0001,
        high: 1.1250 + i * 0.0001,
        low: 1.1200 + i * 0.0001,
        close: 1.1230 + i * 0.0001,
        volume: 10000 + i * 100
      }))
    });

    const strategy = new AdaptiveRsiStrategy(service, {
      symbol: 'EURUSD',
      timeframe: 'HOUR',
      rsiPeriod: 14,
      overboughtThreshold: 70,
      oversoldThreshold: 30,
      positionSize: 1.0,
      stopLossPercent: 1.0,
      takeProfitPercent: 2.0,
      enableAutoTrading: false
    });

    // Execute
    await strategy.initialize('test-session-token', true);

    // Verify
    expect(service.getPriceHistory).toHaveBeenCalled();
    expect(strategy.getCurrentRSI()).toBeGreaterThan(0);
  });

  test('EnhancedStrategyOptimizer should optimize parameters', async () => {
    // Setup
    const service = new CapitalComService(true);
    (service.getPriceHistory as jest.Mock).mockResolvedValue({
      prices: Array(1000).fill(0).map((_, i) => ({
        time: 1617235200000 + i * 3600000,
        open: 1.1220 + i * 0.0001,
        high: 1.1250 + i * 0.0001,
        low: 1.1200 + i * 0.0001,
        close: 1.1230 + i * 0.0001,
        volume: 10000 + i * 100
      }))
    });

    const optimizer = new EnhancedStrategyOptimizer(service, 'EURUSD', 'HOUR');

    // Execute
    await optimizer.initialize();
    const optimizedParams = optimizer.getOptimizedParameters();
    const marketAnalysis = optimizer.getMarketAnalysis();

    // Verify
    expect(service.getPriceHistory).toHaveBeenCalled();
    expect(optimizedParams).toHaveProperty('rsiPeriod');
    expect(optimizedParams).toHaveProperty('overboughtThreshold');
    expect(optimizedParams).toHaveProperty('oversoldThreshold');
    expect(optimizedParams).toHaveProperty('stopLossPercent');
    expect(optimizedParams).toHaveProperty('takeProfitPercent');
    expect(marketAnalysis).toHaveProperty('marketRegime');
    expect(marketAnalysis).toHaveProperty('volatilityLevel');
    expect(marketAnalysis).toHaveProperty('marketSentiment');
  });
});
