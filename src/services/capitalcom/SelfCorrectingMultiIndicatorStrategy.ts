import { useState, useEffect, useCallback } from 'react';
import CapitalComService from './CapitalComService';
import CapitalComWebSocket from './CapitalComWebSocket';

// Types for strategy parameters
export interface MultiIndicatorStrategyParams {
  // Basic settings
  symbol: string;
  timeframe: string;
  
  // RSI parameters
  rsiPeriod: number;
  overboughtThreshold: number;
  oversoldThreshold: number;
  
  // Moving Average parameters
  fastMAPeriod: number;
  slowMAPeriod: number;
  
  // MACD parameters
  macdFastPeriod: number;
  macdSlowPeriod: number;
  macdSignalPeriod: number;
  
  // Bollinger Bands parameters
  bbPeriod: number;
  bbDeviation: number;
  
  // ATR parameters
  atrPeriod: number;
  
  // Position sizing and risk management
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  
  // Trading settings
  enableAutoTrading: boolean;
  
  // Indicator weights
  rsiWeight: number;
  macdWeight: number;
  maWeight: number;
  bbWeight: number;
}

// Types for indicator values
interface IndicatorValues {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  ma: {
    fast: number;
    slow: number;
  };
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
}

// Types for performance metrics
interface PerformanceMetrics {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  profitableTrades: number;
  averageWin: number;
  averageLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  indicatorPerformance: {
    [key: string]: {
      accuracy: number;
      trades: number;
    };
  };
}

// Types for market analysis
interface MarketAnalysis {
  regime: 'trending' | 'ranging' | 'volatile';
  volatility: 'low' | 'medium' | 'high';
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

// Types for trade signals
interface TradeSignal {
  type: 'buy' | 'sell' | 'close';
  price: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  indicators: {
    [key: string]: number;
  };
  confidence: number;
}

// Types for trade history
interface Trade {
  id: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  takeProfit: number;
  entryTime: number;
  exitTime: number | null;
  profit: number | null;
  profitPercent: number | null;
  status: 'open' | 'closed';
  indicators: {
    [key: string]: number;
  };
}

/**
 * Multi-Indicator Trading Strategy Class
 * Implements a trading strategy using multiple technical indicators with self-correction mechanisms
 */
export class MultiIndicatorStrategy {
  private capitalComService: CapitalComService;
  private webSocket: CapitalComWebSocket | null = null;
  private parameters: MultiIndicatorStrategyParams;
  private sessionToken: string | null = null;
  private isDemo: boolean = true;
  
  // Strategy state
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private lastUpdateTime: number = 0;
  
  // Market data
  private priceData: any[] = [];
  private currentPrice: number = 0;
  
  // Indicator values
  private indicatorValues: IndicatorValues | null = null;
  
  // Performance tracking
  private trades: Trade[] = [];
  private performanceMetrics: PerformanceMetrics = {
    winRate: 0,
    profitFactor: 0,
    totalTrades: 0,
    profitableTrades: 0,
    averageWin: 0,
    averageLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    indicatorPerformance: {
      rsi: { accuracy: 0, trades: 0 },
      macd: { accuracy: 0, trades: 0 },
      ma: { accuracy: 0, trades: 0 },
      bb: { accuracy: 0, trades: 0 }
    }
  };
  
  // Market analysis
  private marketAnalysis: MarketAnalysis = {
    regime: 'ranging',
    volatility: 'medium',
    sentiment: 'neutral'
  };
  
  // Self-correction tracking
  private parameterHistory: MultiIndicatorStrategyParams[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private adaptationCount: number = 0;
  private lastAdaptationTime: number = 0;
  
  // Learning system
  private indicatorSuccessRates: {[key: string]: number[]} = {
    rsi: [],
    macd: [],
    ma: [],
    bb: []
  };
  
  // Error tracking
  private error: string | null = null;
  
  /**
   * Creates a new instance of MultiIndicatorStrategy
   * @param capitalComService Capital.com service instance
   * @param parameters Strategy parameters
   */
  constructor(capitalComService: CapitalComService, parameters: MultiIndicatorStrategyParams) {
    this.capitalComService = capitalComService;
    this.parameters = { ...parameters };
    
    // Store initial parameters for reference
    this.parameterHistory.push({ ...parameters });
  }
  
  /**
   * Initialize the strategy with historical data and start real-time updates
   * @param sessionToken User's session token
   * @param isDemo Whether to use demo account
   */
  public async initialize(sessionToken: string, isDemo: boolean): Promise<void> {
    try {
      this.sessionToken = sessionToken;
      this.isDemo = isDemo;
      
      // Load historical price data
      await this.loadHistoricalData();
      
      // Calculate initial indicators
      this.calculateIndicators();
      
      // Analyze market conditions
      this.analyzeMarketConditions();
      
      // Initialize WebSocket connection for real-time data
      this.initializeWebSocket();
      
      // Load trade history if available
      await this.loadTradeHistory();
      
      // Calculate performance metrics
      this.calculatePerformanceMetrics();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('Multi-Indicator Strategy initialized successfully');
    } catch (error) {
      console.error('Failed to initialize strategy:', error);
      this.error = error.message || 'Initialization failed';
      throw error;
    }
  }
  
  /**
   * Load historical price data for the symbol
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      // Calculate time range (30 days)
      const now = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      
      // Fetch price history
      const priceHistory = await this.capitalComService.getPriceHistory(
        this.parameters.symbol,
        this.parameters.timeframe,
        from.getTime(),
        now.getTime()
      );
      
      this.priceData = priceHistory.prices;
      
      // Set current price
      if (this.priceData.length > 0) {
        this.currentPrice = this.priceData[this.priceData.length - 1].close;
      }
      
      console.log(`Loaded ${this.priceData.length} historical price points`);
    } catch (error) {
      console.error('Failed to load historical data:', error);
      throw error;
    }
  }
  
  /**
   * Initialize WebSocket connection for real-time data
   */
  private initializeWebSocket(): void {
    try {
      // Create WebSocket connection
      this.webSocket = new CapitalComWebSocket(this.sessionToken!, this.isDemo);
      
      // Subscribe to price updates
      this.webSocket.subscribeToPriceUpdates(this.parameters.symbol, (data) => {
        // Update current price
        this.currentPrice = data.price;
        
        // Update price data array
        const lastCandle = this.priceData[this.priceData.length - 1];
        
        // Check if we need to create a new candle
        const candlePeriod = this.getCandlePeriodInMs(this.parameters.timeframe);
        const now = Date.now();
        
        if (now - lastCandle.timestamp >= candlePeriod) {
          // Create new candle
          this.priceData.push({
            timestamp: now,
            open: this.currentPrice,
            high: this.currentPrice,
            low: this.currentPrice,
            close: this.currentPrice,
            volume: 0
          });
        } else {
          // Update existing candle
          lastCandle.close = this.currentPrice;
          lastCandle.high = Math.max(lastCandle.high, this.currentPrice);
          lastCandle.low = Math.min(lastCandle.low, this.currentPrice);
          lastCandle.volume += data.volume || 0;
        }
        
        // Recalculate indicators
        this.calculateIndicators();
        
        // Check for trading signals
        this.checkForSignals();
        
        // Periodically check for self-correction
        const hourInMs = 60 * 60 * 1000;
        if (now - this.lastAdaptationTime > hourInMs) {
          this.applySelfCorrection();
          this.lastAdaptationTime = now;
        }
      });
      
      console.log('WebSocket connection initialized');
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      throw error;
    }
  }
  
  /**
   * Get candle period in milliseconds
   * @param timeframe Timeframe string (e.g., 'MINUTE', 'HOUR', 'DAY')
   */
  private getCandlePeriodInMs(timeframe: string): number {
    switch (timeframe) {
      case 'MINUTE':
        return 60 * 1000;
      case 'MINUTE_5':
        return 5 * 60 * 1000;
      case 'MINUTE_15':
        return 15 * 60 * 1000;
      case 'MINUTE_30':
        return 30 * 60 * 1000;
      case 'HOUR':
        return 60 * 60 * 1000;
      case 'HOUR_4':
        return 4 * 60 * 60 * 1000;
      case 'DAY':
        return 24 * 60 * 60 * 1000;
      case 'WEEK':
        return 7 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000; // Default to HOUR
    }
  }
  
  /**
   * Load trade history from the service
   */
  private async loadTradeHistory(): Promise<void> {
    try {
      // Fetch trade history from service
      const tradeHistory = await this.capitalComService.getTradeHistory(this.parameters.symbol);
      
      // Convert to our trade format
      this.trades = tradeHistory.trades.map(trade => ({
        id: trade.id,
        type: trade.direction === 'BUY' ? 'buy' : 'sell',
        entryPrice: trade.openPrice,
        exitPrice: trade.closePrice,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        entryTime: trade.openTime,
        exitTime: trade.closeTime,
        profit: trade.profit,
        profitPercent: (trade.profit / trade.openPrice) * 100,
        status: trade.status,
        indicators: trade.metadata?.indicators || {}
      }));
      
      console.log(`Loaded ${this.trades.length} historical trades`);
    } catch (error) {
      console.error('Failed to load trade history:', error);
      // Non-critical error, continue without trade history
      this.trades = [];
    }
  }
  
  /**
   * Calculate all technical indicators
   */
  private calculateIndicators(): void {
    if (this.priceData.length === 0) {
      return;
    }
    
    // Extract price data
    const closes = this.priceData.map(price => price.close);
    const highs = this.priceData.map(price => price.high);
    const lows = this.priceData.map(price => price.low);
    
    // Calculate RSI
    const rsi = this.calculateRSI(closes, this.parameters.rsiPeriod);
    
    // Calculate Moving Averages
    const fastMA = this.calculateSMA(closes, this.parameters.fastMAPeriod);
    const slowMA = this.calculateSMA(closes, this.parameters.slowMAPeriod);
    
    // Calculate MACD
    const macdResult = this.calculateMACD(
      closes,
      this.parameters.macdFastPeriod,
      this.parameters.macdSlowPeriod,
      this.parameters.macdSignalPeriod
    );
    
    // Calculate Bollinger Bands
    const bbResult = this.calculateBollingerBands(
      closes,
      this.parameters.bbPeriod,
      this.parameters.bbDeviation
    );
    
    // Calculate ATR
    const atr = this.calculateATR(
      highs,
      lows,
      closes,
      this.parameters.atrPeriod
    );
    
    // Store indicator values
    this.indicatorValues = {
      rsi: rsi[rsi.length - 1],
      macd: {
        macdLine: macdResult.macdLine[macdResult.macdLine.length - 1],
        signalLine: macdResult.signalLine[macdResult.signalLine.length - 1],
        histogram: macdResult.histogram[macdResult.histogram.length - 1]
      },
      ma: {
        fast: fastMA[fastMA.length - 1],
        slow: slowMA[slowMA.length - 1]
      },
      bb: {
        upper: bbResult.upper[bbResult.upper.length - 1],
        middle: bbResult.middle[bbResult.middle.length - 1],
        lower: bbResult.lower[bbResult.lower.length - 1]
      },
      atr: atr[atr.length - 1]
    };
    
    // Update last update time
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(closes: number[], period: number): number[] {
    if (closes.length < period + 1) {
      return [50]; // Default value if not enough data
    }
    
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }
    
    // Calculate RSI for each period
    const rsiValues: number[] = [];
    
    // Calculate first RSI
    let avgGain = 0;
    let avgLoss = 0;
    
    // First RSI calculation uses simple average
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    // Calculate first RSI value
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
    
    // Calculate remaining RSI values using Wilder's smoothing method
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return rsiValues;
  }
  
  /**
   * Calculate SMA (Simple Moving Average)
   */
  private calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((total, price) => total + price, 0);
      sma.push(sum / period);
    }
    
    return sma;
  }
  
  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(
    closes: number[],
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number
  ): { macdLine: number[], signalLine: number[], histogram: number[] } {
    // Calculate EMA for fast period
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    
    // Calculate EMA for slow period
    const slowEMA = this.calculateEMA(closes, slowPeriod);
    
    // Calculate MACD line (fast EMA - slow EMA)
    const macdLine: number[] = [];
    const maxLength = Math.min(fastEMA.length, slowEMA.length);
    
    for (let i = 0; i < maxLength; i++) {
      macdLine.push(fastEMA[fastEMA.length - maxLength + i] - slowEMA[slowEMA.length - maxLength + i]);
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    // Calculate histogram (MACD line - signal line)
    const histogram: number[] = [];
    
    for (let i = 0; i < signalLine.length; i++) {
      const macd = macdLine[macdLine.length - signalLine.length + i];
      const signal = signalLine[i];
      histogram.push(macd - signal);
    }
    
    return { macdLine, signalLine, histogram };
  }
  
  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    const firstSMA = data.slice(0, period).reduce((total, price) => total + price, 0) / period;
    ema.push(firstSMA);
    
    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    
    return ema;
  }
  
  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(
    closes: number[],
    period: number,
    deviation: number
  ): { upper: number[], middle: number[], lower: number[] } {
    // Calculate middle band (SMA)
    const middleBand = this.calculateSMA(closes, period);
    
    // Calculate standard deviation for each period
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const periodData = closes.slice(i - period + 1, i + 1);
      const mean = middleBand[i - (period - 1)];
      
      // Calculate sum of squared differences from mean
      const squaredDifferences = periodData.map(price => Math.pow(price - mean, 2));
      const sumSquaredDiff = squaredDifferences.reduce((total, diff) => total + diff, 0);
      
      // Calculate standard deviation
      const stdDev = Math.sqrt(sumSquaredDiff / period);
      
      // Calculate upper and lower bands
      upperBand.push(mean + (deviation * stdDev));
      lowerBand.push(mean - (deviation * stdDev));
    }
    
    return { upper: upperBand, middle: middleBand, lower: lowerBand };
  }
  
  /**
   * Calculate ATR (Average True Range)
   */
  private calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number
  ): number[] {
    const trueRanges: number[] = [];
    
    // Calculate True Range for each period
    for (let i = 1; i < closes.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = closes[i - 1];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate ATR using Wilder's smoothing method
    const atr: number[] = [];
    
    // First ATR is simple average of first period's true ranges
    let currentATR = trueRanges.slice(0, period).reduce((total, tr) => total + tr, 0) / period;
    atr.push(currentATR);
    
    // Calculate remaining ATR values
    for (let i = period; i < trueRanges.length; i++) {
      currentATR = ((currentATR * (period - 1)) + trueRanges[i]) / period;
      atr.push(currentATR);
    }
    
    return atr;
  }
  
  /**
   * Analyze market conditions
   */
  private analyzeMarketConditions(): void {
    if (!this.indicatorValues || this.priceData.length < 50) {
      return;
    }
    
    // Extract price data
    const closes = this.priceData.map(price => price.close);
    const highs = this.priceData.map(price => price.high);
    const lows = this.priceData.map(price => price.low);
    
    // Calculate ADX for trend strength
    const adx = this.calculateADX(highs, lows, closes, 14);
    const recentADX = adx.slice(-20).reduce((sum, val) => sum + val, 0) / 20;
    
    // Calculate volatility
    const atr = this.calculateATR(highs, lows, closes, 14);
    const avgPrice = closes.slice(-14).reduce((sum, price) => sum + price, 0) / 14;
    const volatility = (atr[atr.length - 1] / avgPrice) * 100;
    
    // Determine market regime
    let marketRegime: 'trending' | 'ranging' | 'volatile' = 'ranging';
    if (recentADX > 25) {
      marketRegime = 'trending';
    } else if (volatility > 1.5) {
      marketRegime = 'volatile';
    }
    
    // Determine volatility level
    let volatilityLevel: 'low' | 'medium' | 'high' = 'medium';
    if (volatility < 0.8) {
      volatilityLevel = 'low';
    } else if (volatility > 1.5) {
      volatilityLevel = 'high';
    }
    
    // Determine market sentiment
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);
    
    let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (sma50[sma50.length - 1] > sma200[sma200.length - 1]) {
      marketSentiment = 'bullish';
    } else if (sma50[sma50.length - 1] < sma200[sma200.length - 1]) {
      marketSentiment = 'bearish';
    }
    
    // Update market analysis
    this.marketAnalysis = {
      regime: marketRegime,
      volatility: volatilityLevel,
      sentiment: marketSentiment
    };
  }
  
  /**
   * Calculate ADX (Average Directional Index)
   */
  private calculateADX(highs: number[], lows: number[], closes: number[], period: number): number[] {
    // Implementation of ADX calculation
    // This is a simplified version for demonstration
    const adx: number[] = [];
    
    // In a real implementation, this would calculate:
    // 1. +DM and -DM (Directional Movement)
    // 2. TR (True Range)
    // 3. +DI and -DI (Directional Indicators)
    // 4. DX (Directional Index)
    // 5. ADX (Average of DX)
    
    // For now, we'll return a dummy array
    for (let i = 0; i < closes.length - period; i++) {
      adx.push(25 + Math.random() * 10); // Random values around 25-35
    }
    
    return adx;
  }
  
  /**
   * Check for trading signals
   */
  private checkForSignals(): void {
    if (!this.isRunning || !this.indicatorValues) {
      return;
    }
    
    // Get current indicator values
    const { rsi, macd, ma, bb } = this.indicatorValues;
    
    // Calculate individual indicator signals
    // RSI Signal: -1 (sell), 0 (neutral), 1 (buy)
    let rsiSignal = 0;
    if (rsi <= this.parameters.oversoldThreshold) {
      rsiSignal = 1; // Buy signal
    } else if (rsi >= this.parameters.overboughtThreshold) {
      rsiSignal = -1; // Sell signal
    }
    
    // MACD Signal: -1 (sell), 0 (neutral), 1 (buy)
    let macdSignal = 0;
    if (macd.histogram > 0 && macd.macdLine > 0) {
      macdSignal = 1; // Buy signal
    } else if (macd.histogram < 0 && macd.macdLine < 0) {
      macdSignal = -1; // Sell signal
    }
    
    // Moving Average Signal: -1 (sell), 0 (neutral), 1 (buy)
    let maSignal = 0;
    if (ma.fast > ma.slow) {
      maSignal = 1; // Buy signal
    } else if (ma.fast < ma.slow) {
      maSignal = -1; // Sell signal
    }
    
    // Bollinger Bands Signal: -1 (sell), 0 (neutral), 1 (buy)
    let bbSignal = 0;
    if (this.currentPrice <= bb.lower) {
      bbSignal = 1; // Buy signal
    } else if (this.currentPrice >= bb.upper) {
      bbSignal = -1; // Sell signal
    }
    
    // Calculate weighted composite signal
    const compositeSignal = 
      (rsiSignal * this.parameters.rsiWeight) + 
      (macdSignal * this.parameters.macdWeight) + 
      (maSignal * this.parameters.maWeight) + 
      (bbSignal * this.parameters.bbWeight);
    
    // Store indicator signals for learning
    const indicatorSignals = {
      rsi: rsiSignal,
      macd: macdSignal,
      ma: maSignal,
      bb: bbSignal
    };
    
    // Check for open positions
    const openTrades = this.trades.filter(trade => trade.status === 'open');
    
    // Trading logic
    if (openTrades.length === 0) {
      // No open positions, check for entry signals
      if (compositeSignal >= 0.5) {
        // Buy signal
        this.executeTradeSignal('buy', indicatorSignals, compositeSignal);
      } else if (compositeSignal <= -0.5) {
        // Sell signal
        this.executeTradeSignal('sell', indicatorSignals, compositeSignal);
      }
    } else {
      // Check for exit signals
      for (const trade of openTrades) {
        let shouldClose = false;
        
        if (trade.type === 'buy') {
          // Check for sell signal
          if (compositeSignal <= -0.5) {
            shouldClose = true;
          }
          // Check stop loss
          else if (this.currentPrice <= trade.stopLoss) {
            shouldClose = true;
          }
          // Check take profit
          else if (this.currentPrice >= trade.takeProfit) {
            shouldClose = true;
          }
        } else { // trade.type === 'sell'
          // Check for buy signal
          if (compositeSignal >= 0.5) {
            shouldClose = true;
          }
          // Check stop loss
          else if (this.currentPrice >= trade.stopLoss) {
            shouldClose = true;
          }
          // Check take profit
          else if (this.currentPrice <= trade.takeProfit) {
            shouldClose = true;
          }
        }
        
        if (shouldClose) {
          this.closePosition(trade.id);
        }
      }
    }
  }
  
  /**
   * Execute a trade signal
   * @param type Trade type ('buy' or 'sell')
   * @param indicatorSignals Individual indicator signals
   * @param compositeSignal Weighted composite signal
   */
  private executeTradeSignal(
    type: 'buy' | 'sell',
    indicatorSignals: {[key: string]: number},
    compositeSignal: number
  ): void {
    if (!this.parameters.enableAutoTrading) {
      // Log signal but don't execute if auto-trading is disabled
      console.log(`${type.toUpperCase()} signal detected (${compositeSignal.toFixed(2)}), but auto-trading is disabled`);
      return;
    }
    
    // Calculate stop loss and take profit
    const stopLossPercent = this.parameters.stopLossPercent;
    const takeProfitPercent = this.parameters.takeProfitPercent;
    
    let stopLoss: number;
    let takeProfit: number;
    
    if (type === 'buy') {
      stopLoss = this.currentPrice * (1 - stopLossPercent / 100);
      takeProfit = this.currentPrice * (1 + takeProfitPercent / 100);
    } else {
      stopLoss = this.currentPrice * (1 + stopLossPercent / 100);
      takeProfit = this.currentPrice * (1 - takeProfitPercent / 100);
    }
    
    // Adjust stop loss based on ATR if available
    if (this.indicatorValues?.atr) {
      const atrMultiplier = 2; // Use 2x ATR for stop loss
      const atrValue = this.indicatorValues.atr;
      
      if (type === 'buy') {
        stopLoss = Math.min(stopLoss, this.currentPrice - (atrValue * atrMultiplier));
      } else {
        stopLoss = Math.max(stopLoss, this.currentPrice + (atrValue * atrMultiplier));
      }
    }
    
    // Execute trade
    this.capitalComService.executeTrade({
      symbol: this.parameters.symbol,
      direction: type === 'buy' ? 'BUY' : 'SELL',
      amount: this.parameters.positionSize,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      metadata: {
        indicators: indicatorSignals,
        compositeSignal: compositeSignal
      }
    })
    .then(result => {
      // Add trade to history
      const trade: Trade = {
        id: result.tradeId,
        type: type,
        entryPrice: this.currentPrice,
        exitPrice: null,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        entryTime: Date.now(),
        exitTime: null,
        profit: null,
        profitPercent: null,
        status: 'open',
        indicators: indicatorSignals
      };
      
      this.trades.push(trade);
      
      console.log(`Executed ${type.toUpperCase()} trade at ${this.currentPrice}`);
    })
    .catch(error => {
      console.error(`Failed to execute ${type} trade:`, error);
    });
  }
  
  /**
   * Close an open position
   * @param tradeId ID of the trade to close
   */
  private closePosition(tradeId: string): void {
    // Find the trade
    const tradeIndex = this.trades.findIndex(trade => trade.id === tradeId);
    
    if (tradeIndex === -1) {
      console.error(`Trade with ID ${tradeId} not found`);
      return;
    }
    
    const trade = this.trades[tradeIndex];
    
    // Close the position
    this.capitalComService.closeTrade(tradeId)
      .then(result => {
        // Update trade in history
        trade.exitPrice = this.currentPrice;
        trade.exitTime = Date.now();
        trade.status = 'closed';
        
        // Calculate profit
        if (trade.type === 'buy') {
          trade.profit = this.currentPrice - trade.entryPrice;
        } else {
          trade.profit = trade.entryPrice - this.currentPrice;
        }
        
        trade.profitPercent = (trade.profit / trade.entryPrice) * 100;
        
        // Update trade in array
        this.trades[tradeIndex] = trade;
        
        // Update performance metrics
        this.calculatePerformanceMetrics();
        
        // Update indicator success rates for learning
        this.updateIndicatorSuccessRates(trade);
        
        console.log(`Closed ${trade.type.toUpperCase()} trade at ${this.currentPrice}, profit: ${trade.profit.toFixed(5)} (${trade.profitPercent.toFixed(2)}%)`);
      })
      .catch(error => {
        console.error(`Failed to close trade ${tradeId}:`, error);
      });
  }
  
  /**
   * Update indicator success rates based on trade result
   * @param trade Closed trade
   */
  private updateIndicatorSuccessRates(trade: Trade): void {
    if (!trade.indicators || trade.profit === null) {
      return;
    }
    
    const isProfit = trade.profit > 0;
    
    // For each indicator that gave a signal, update its success rate
    for (const [indicator, signal] of Object.entries(trade.indicators)) {
      if (signal !== 0) {
        // Check if signal was correct
        const isCorrect = (trade.type === 'buy' && isProfit && signal > 0) ||
                         (trade.type === 'sell' && isProfit && signal < 0) ||
                         (trade.type === 'buy' && !isProfit && signal < 0) ||
                         (trade.type === 'sell' && !isProfit && signal > 0);
        
        // Add to success rate history (1 for success, 0 for failure)
        this.indicatorSuccessRates[indicator].push(isCorrect ? 1 : 0);
        
        // Keep only the last 50 trades for each indicator
        if (this.indicatorSuccessRates[indicator].length > 50) {
          this.indicatorSuccessRates[indicator].shift();
        }
      }
    }
  }
  
  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(): void {
    // Filter closed trades
    const closedTrades = this.trades.filter(trade => trade.status === 'closed' && trade.profit !== null);
    
    if (closedTrades.length === 0) {
      return;
    }
    
    // Calculate basic metrics
    const totalTrades = closedTrades.length;
    const profitableTrades = closedTrades.filter(trade => trade.profit! > 0).length;
    const winRate = (profitableTrades / totalTrades) * 100;
    
    // Calculate profit factor
    const totalProfit = closedTrades
      .filter(trade => trade.profit! > 0)
      .reduce((sum, trade) => sum + trade.profit!, 0);
    
    const totalLoss = closedTrades
      .filter(trade => trade.profit! < 0)
      .reduce((sum, trade) => sum + Math.abs(trade.profit!), 0);
    
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    
    // Calculate average win and loss
    const averageWin = profitableTrades > 0
      ? closedTrades
          .filter(trade => trade.profit! > 0)
          .reduce((sum, trade) => sum + trade.profit!, 0) / profitableTrades
      : 0;
    
    const averageLoss = totalTrades - profitableTrades > 0
      ? closedTrades
          .filter(trade => trade.profit! < 0)
          .reduce((sum, trade) => sum + Math.abs(trade.profit!), 0) / (totalTrades - profitableTrades)
      : 0;
    
    // Calculate consecutive wins and losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    
    // Sort trades by exit time
    const sortedTrades = [...closedTrades].sort((a, b) => (a.exitTime || 0) - (b.exitTime || 0));
    
    for (const trade of sortedTrades) {
      if (trade.profit! > 0) {
        currentWins++;
        currentLosses = 0;
        consecutiveWins = Math.max(consecutiveWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        consecutiveLosses = Math.max(consecutiveLosses, currentLosses);
      }
    }
    
    // Calculate indicator performance
    const indicatorPerformance: {[key: string]: {accuracy: number, trades: number}} = {};
    
    for (const indicator of ['rsi', 'macd', 'ma', 'bb']) {
      const indicatorTrades = closedTrades.filter(trade => 
        trade.indicators && trade.indicators[indicator] !== 0
      );
      
      const indicatorCorrectTrades = indicatorTrades.filter(trade => {
        const signal = trade.indicators[indicator];
        return (trade.type === 'buy' && trade.profit! > 0 && signal > 0) ||
               (trade.type === 'sell' && trade.profit! > 0 && signal < 0) ||
               (trade.type === 'buy' && trade.profit! < 0 && signal < 0) ||
               (trade.type === 'sell' && trade.profit! < 0 && signal > 0);
      });
      
      const accuracy = indicatorTrades.length > 0
        ? (indicatorCorrectTrades.length / indicatorTrades.length) * 100
        : 0;
      
      indicatorPerformance[indicator] = {
        accuracy,
        trades: indicatorTrades.length
      };
    }
    
    // Update performance metrics
    this.performanceMetrics = {
      winRate,
      profitFactor,
      totalTrades,
      profitableTrades,
      averageWin,
      averageLoss,
      consecutiveWins,
      consecutiveLosses,
      indicatorPerformance
    };
    
    // Store performance history
    this.performanceHistory.push({ ...this.performanceMetrics });
    
    // Keep only the last 10 performance snapshots
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }
  }
  
  /**
   * Apply self-correction to strategy parameters
   */
  private applySelfCorrection(): void {
    if (this.trades.length < 5 || this.performanceHistory.length < 2) {
      // Not enough data for self-correction
      return;
    }
    
    console.log('Applying self-correction to strategy parameters');
    
    // Get current and previous performance
    const currentPerformance = this.performanceHistory[this.performanceHistory.length - 1];
    const previousPerformance = this.performanceHistory[this.performanceHistory.length - 2];
    
    // Check if performance is deteriorating
    const isPerformanceDeteriorating = 
      currentPerformance.winRate < previousPerformance.winRate ||
      currentPerformance.profitFactor < previousPerformance.profitFactor;
    
    // Get current market conditions
    const { regime, volatility, sentiment } = this.marketAnalysis;
    
    // Create a copy of current parameters
    const newParameters = { ...this.parameters };
    
    // 1. Adjust indicator weights based on performance
    this.adjustIndicatorWeights(newParameters);
    
    // 2. Adjust RSI thresholds based on market conditions and performance
    this.adjustRsiThresholds(newParameters, isPerformanceDeteriorating);
    
    // 3. Adjust Moving Average periods based on market conditions
    this.adjustMovingAveragePeriods(newParameters, regime);
    
    // 4. Adjust Bollinger Bands parameters based on volatility
    this.adjustBollingerBands(newParameters, volatility);
    
    // 5. Adjust risk parameters based on performance
    this.adjustRiskParameters(newParameters, isPerformanceDeteriorating);
    
    // 6. Apply market regime specific adjustments
    this.applyMarketRegimeAdjustments(newParameters, regime, sentiment);
    
    // Apply the new parameters
    this.parameters = newParameters;
    
    // Store parameter history
    this.parameterHistory.push({ ...newParameters });
    
    // Keep only the last 10 parameter sets
    if (this.parameterHistory.length > 10) {
      this.parameterHistory.shift();
    }
    
    // Increment adaptation count
    this.adaptationCount++;
    
    console.log('Self-correction applied, new parameters:', this.parameters);
  }
  
  /**
   * Adjust indicator weights based on performance
   * @param parameters Parameters to adjust
   */
  private adjustIndicatorWeights(parameters: MultiIndicatorStrategyParams): void {
    // Calculate success rates for each indicator
    const successRates: {[key: string]: number} = {};
    
    for (const [indicator, rates] of Object.entries(this.indicatorSuccessRates)) {
      if (rates.length > 0) {
        successRates[indicator] = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      } else {
        successRates[indicator] = 0.5; // Default if no data
      }
    }
    
    // Calculate total success rate
    const totalSuccessRate = Object.values(successRates).reduce((sum, rate) => sum + rate, 0);
    
    // Adjust weights based on success rates
    if (totalSuccessRate > 0) {
      parameters.rsiWeight = successRates.rsi / totalSuccessRate;
      parameters.macdWeight = successRates.macd / totalSuccessRate;
      parameters.maWeight = successRates.ma / totalSuccessRate;
      parameters.bbWeight = successRates.bb / totalSuccessRate;
      
      // Ensure weights sum to 1
      const totalWeight = parameters.rsiWeight + parameters.macdWeight + parameters.maWeight + parameters.bbWeight;
      
      parameters.rsiWeight /= totalWeight;
      parameters.macdWeight /= totalWeight;
      parameters.maWeight /= totalWeight;
      parameters.bbWeight /= totalWeight;
    }
  }
  
  /**
   * Adjust RSI thresholds based on market conditions and performance
   * @param parameters Parameters to adjust
   * @param isPerformanceDeteriorating Whether performance is deteriorating
   */
  private adjustRsiThresholds(
    parameters: MultiIndicatorStrategyParams,
    isPerformanceDeteriorating: boolean
  ): void {
    const { regime, volatility } = this.marketAnalysis;
    
    if (regime === 'trending') {
      // In trending markets, use more extreme thresholds
      parameters.oversoldThreshold = Math.max(20, parameters.oversoldThreshold - 2);
      parameters.overboughtThreshold = Math.min(80, parameters.overboughtThreshold + 2);
    } else if (regime === 'ranging') {
      // In ranging markets, use less extreme thresholds
      parameters.oversoldThreshold = Math.min(35, parameters.oversoldThreshold + 2);
      parameters.overboughtThreshold = Math.max(65, parameters.overboughtThreshold - 2);
    }
    
    if (volatility === 'high') {
      // In high volatility, use more extreme thresholds
      parameters.oversoldThreshold = Math.max(20, parameters.oversoldThreshold - 2);
      parameters.overboughtThreshold = Math.min(80, parameters.overboughtThreshold + 2);
    } else if (volatility === 'low') {
      // In low volatility, use less extreme thresholds
      parameters.oversoldThreshold = Math.min(35, parameters.oversoldThreshold + 2);
      parameters.overboughtThreshold = Math.max(65, parameters.overboughtThreshold - 2);
    }
    
    if (isPerformanceDeteriorating) {
      // If performance is deteriorating, make more significant adjustments
      if (this.performanceMetrics.indicatorPerformance.rsi.accuracy < 50) {
        // If RSI accuracy is poor, adjust thresholds more aggressively
        parameters.oversoldThreshold = Math.max(15, parameters.oversoldThreshold - 5);
        parameters.overboughtThreshold = Math.min(85, parameters.overboughtThreshold + 5);
      }
    }
  }
  
  /**
   * Adjust Moving Average periods based on market conditions
   * @param parameters Parameters to adjust
   * @param regime Market regime
   */
  private adjustMovingAveragePeriods(
    parameters: MultiIndicatorStrategyParams,
    regime: 'trending' | 'ranging' | 'volatile'
  ): void {
    if (regime === 'trending') {
      // In trending markets, use longer periods
      parameters.fastMAPeriod = Math.min(15, parameters.fastMAPeriod + 1);
      parameters.slowMAPeriod = Math.min(30, parameters.slowMAPeriod + 2);
    } else if (regime === 'ranging') {
      // In ranging markets, use shorter periods
      parameters.fastMAPeriod = Math.max(5, parameters.fastMAPeriod - 1);
      parameters.slowMAPeriod = Math.max(15, parameters.slowMAPeriod - 2);
    } else if (regime === 'volatile') {
      // In volatile markets, use medium periods
      parameters.fastMAPeriod = 9;
      parameters.slowMAPeriod = 21;
    }
    
    // Ensure fast period is always less than slow period
    if (parameters.fastMAPeriod >= parameters.slowMAPeriod) {
      parameters.fastMAPeriod = parameters.slowMAPeriod - 5;
    }
  }
  
  /**
   * Adjust Bollinger Bands parameters based on volatility
   * @param parameters Parameters to adjust
   * @param volatility Volatility level
   */
  private adjustBollingerBands(
    parameters: MultiIndicatorStrategyParams,
    volatility: 'low' | 'medium' | 'high'
  ): void {
    if (volatility === 'high') {
      // In high volatility, use wider bands
      parameters.bbDeviation = Math.min(3, parameters.bbDeviation + 0.2);
    } else if (volatility === 'low') {
      // In low volatility, use narrower bands
      parameters.bbDeviation = Math.max(1.5, parameters.bbDeviation - 0.2);
    } else {
      // In medium volatility, use standard bands
      parameters.bbDeviation = 2;
    }
    
    // Adjust period based on volatility
    if (volatility === 'high') {
      parameters.bbPeriod = Math.max(15, parameters.bbPeriod - 2);
    } else if (volatility === 'low') {
      parameters.bbPeriod = Math.min(25, parameters.bbPeriod + 2);
    } else {
      parameters.bbPeriod = 20;
    }
  }
  
  /**
   * Adjust risk parameters based on performance
   * @param parameters Parameters to adjust
   * @param isPerformanceDeteriorating Whether performance is deteriorating
   */
  private adjustRiskParameters(
    parameters: MultiIndicatorStrategyParams,
    isPerformanceDeteriorating: boolean
  ): void {
    // Adjust position size based on win rate and profit factor
    const { winRate, profitFactor } = this.performanceMetrics;
    
    if (winRate >= 60 && profitFactor >= 1.5) {
      // Good performance, can increase position size
      parameters.positionSize = Math.min(2.0, parameters.positionSize * 1.1);
    } else if (winRate < 40 || profitFactor < 1.0) {
      // Poor performance, reduce position size
      parameters.positionSize = Math.max(0.5, parameters.positionSize * 0.9);
    }
    
    // Adjust stop loss and take profit based on average win/loss ratio
    const { averageWin, averageLoss } = this.performanceMetrics;
    
    if (averageLoss > 0) {
      const winLossRatio = averageWin / averageLoss;
      
      if (winLossRatio < 1.5) {
        // If win/loss ratio is poor, adjust take profit and stop loss
        parameters.takeProfitPercent = Math.min(5.0, parameters.takeProfitPercent * 1.1);
        parameters.stopLossPercent = Math.max(0.5, parameters.stopLossPercent * 0.9);
      } else if (winLossRatio > 2.5) {
        // If win/loss ratio is good, can be more aggressive
        parameters.takeProfitPercent = Math.max(1.0, parameters.takeProfitPercent * 0.95);
        parameters.stopLossPercent = Math.min(2.0, parameters.stopLossPercent * 1.05);
      }
    }
    
    if (isPerformanceDeteriorating) {
      // If performance is deteriorating, be more conservative
      parameters.positionSize = Math.max(0.5, parameters.positionSize * 0.8);
      parameters.stopLossPercent = Math.max(0.5, parameters.stopLossPercent * 0.9);
      parameters.takeProfitPercent = Math.min(5.0, parameters.takeProfitPercent * 1.2);
    }
  }
  
  /**
   * Apply market regime specific adjustments
   * @param parameters Parameters to adjust
   * @param regime Market regime
   * @param sentiment Market sentiment
   */
  private applyMarketRegimeAdjustments(
    parameters: MultiIndicatorStrategyParams,
    regime: 'trending' | 'ranging' | 'volatile',
    sentiment: 'bullish' | 'bearish' | 'neutral'
  ): void {
    // MACD adjustments based on regime
    if (regime === 'trending') {
      // In trending markets, use standard MACD settings
      parameters.macdFastPeriod = 12;
      parameters.macdSlowPeriod = 26;
      parameters.macdSignalPeriod = 9;
    } else if (regime === 'ranging') {
      // In ranging markets, use faster MACD settings
      parameters.macdFastPeriod = 8;
      parameters.macdSlowPeriod = 17;
      parameters.macdSignalPeriod = 9;
    } else if (regime === 'volatile') {
      // In volatile markets, use slower MACD settings
      parameters.macdFastPeriod = 16;
      parameters.macdSlowPeriod = 32;
      parameters.macdSignalPeriod = 9;
    }
    
    // ATR adjustments based on regime
    if (regime === 'trending') {
      parameters.atrPeriod = 14;
    } else if (regime === 'ranging') {
      parameters.atrPeriod = 10;
    } else if (regime === 'volatile') {
      parameters.atrPeriod = 20;
    }
    
    // Sentiment-based adjustments
    if (sentiment === 'bullish') {
      // In bullish markets, be more aggressive on buys
      if (parameters.rsiWeight > 0.2) {
        parameters.rsiWeight -= 0.05;
        parameters.maWeight += 0.05;
      }
    } else if (sentiment === 'bearish') {
      // In bearish markets, be more aggressive on sells
      if (parameters.maWeight > 0.2) {
        parameters.maWeight -= 0.05;
        parameters.rsiWeight += 0.05;
      }
    }
  }
  
  /**
   * Start the strategy
   */
  public start(): void {
    if (!this.isInitialized) {
      console.error('Strategy not initialized');
      return;
    }
    
    this.isRunning = true;
    console.log('Strategy started');
  }
  
  /**
   * Stop the strategy
   */
  public stop(): void {
    this.isRunning = false;
    console.log('Strategy stopped');
  }
  
  /**
   * Toggle the strategy (start/stop)
   */
  public toggle(): void {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }
  
  /**
   * Get current indicator values
   */
  public getIndicatorValues(): IndicatorValues | null {
    return this.indicatorValues;
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMetrics;
  }
  
  /**
   * Get current parameters
   */
  public getParameters(): MultiIndicatorStrategyParams {
    return { ...this.parameters };
  }
  
  /**
   * Get market analysis
   */
  public getMarketAnalysis(): MarketAnalysis {
    return { ...this.marketAnalysis };
  }
  
  /**
   * Get trade history
   */
  public getTrades(): Trade[] {
    return [...this.trades];
  }
  
  /**
   * Get parameter history
   */
  public getParameterHistory(): MultiIndicatorStrategyParams[] {
    return [...this.parameterHistory];
  }
  
  /**
   * Get performance history
   */
  public getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }
  
  /**
   * Get adaptation count
   */
  public getAdaptationCount(): number {
    return this.adaptationCount;
  }
  
  /**
   * Get error
   */
  public getError(): string | null {
    return this.error;
  }
  
  /**
   * Get initialization status
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Get running status
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Update strategy parameters
   * @param parameters New parameters
   */
  public updateParameters(parameters: Partial<MultiIndicatorStrategyParams>): void {
    // Store current parameters in history
    this.parameterHistory.push({ ...this.parameters });
    
    // Update parameters
    this.parameters = { ...this.parameters, ...parameters };
    
    // Keep only the last 10 parameter sets
    if (this.parameterHistory.length > 10) {
      this.parameterHistory.shift();
    }
    
    console.log('Parameters updated:', this.parameters);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Close WebSocket connection
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    
    // Stop strategy
    this.isRunning = false;
    
    console.log('Strategy resources cleaned up');
  }
}

/**
 * React hook for using the multi-indicator strategy
 * @param initialParameters Initial strategy parameters
 * @returns Strategy controller
 */
const useMultiIndicatorStrategy = (initialParameters: MultiIndicatorStrategyParams) => {
  const [strategy, setStrategy] = useState<MultiIndicatorStrategy | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [indicatorValues, setIndicatorValues] = useState<IndicatorValues | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [parameters, setParameters] = useState<MultiIndicatorStrategyParams>(initialParameters);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize strategy
  const initializeStrategy = useCallback(async (
    capitalComService: CapitalComService,
    sessionToken: string,
    isDemo: boolean
  ) => {
    try {
      // Create strategy instance
      const strategyInstance = new MultiIndicatorStrategy(capitalComService, initialParameters);
      
      // Initialize strategy
      await strategyInstance.initialize(sessionToken, isDemo);
      
      // Store strategy instance
      setStrategy(strategyInstance);
      setIsInitialized(true);
      setIsRunning(false);
      setIndicatorValues(strategyInstance.getIndicatorValues());
      setPerformanceMetrics(strategyInstance.getPerformanceMetrics());
      setParameters(strategyInstance.getParameters());
      setMarketAnalysis(strategyInstance.getMarketAnalysis());
      setTrades(strategyInstance.getTrades());
      setError(null);
      
      // Set up update interval
      const updateInterval = setInterval(() => {
        if (strategyInstance) {
          setIsRunning(strategyInstance.getIsRunning());
          setIndicatorValues(strategyInstance.getIndicatorValues());
          setPerformanceMetrics(strategyInstance.getPerformanceMetrics());
          setParameters(strategyInstance.getParameters());
          setMarketAnalysis(strategyInstance.getMarketAnalysis());
          setTrades(strategyInstance.getTrades());
          setError(strategyInstance.getError());
        }
      }, 1000);
      
      return () => {
        clearInterval(updateInterval);
        if (strategyInstance) {
          strategyInstance.cleanup();
        }
      };
    } catch (error) {
      console.error('Failed to initialize strategy:', error);
      setError(error.message || 'Initialization failed');
      setIsInitialized(false);
    }
  }, [initialParameters]);
  
  // Toggle strategy
  const toggleStrategy = useCallback(() => {
    if (strategy) {
      strategy.toggle();
      setIsRunning(strategy.getIsRunning());
    }
  }, [strategy]);
  
  // Update parameters
  const updateParameters = useCallback((newParameters: Partial<MultiIndicatorStrategyParams>) => {
    if (strategy) {
      strategy.updateParameters(newParameters);
      setParameters(strategy.getParameters());
    }
  }, [strategy]);
  
  return {
    initializeStrategy,
    isInitialized,
    isRunning,
    indicatorValues,
    performanceMetrics,
    parameters,
    marketAnalysis,
    trades,
    error,
    toggleStrategy,
    updateParameters
  };
};

export default useMultiIndicatorStrategy;
