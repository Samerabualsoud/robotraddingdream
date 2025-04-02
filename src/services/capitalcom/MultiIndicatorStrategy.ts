import { useState, useEffect } from 'react';
import CapitalComService from './CapitalComService';
import CapitalComWebSocket from './CapitalComWebSocket';

export interface MultiIndicatorStrategyProps {
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

/**
 * Multi-indicator trading strategy implementation for Capital.com
 */
export class MultiIndicatorStrategy {
  private capitalComService: CapitalComService;
  private webSocket: CapitalComWebSocket | null = null;
  private symbol: string;
  private timeframe: string;
  
  // Strategy parameters
  private rsiPeriod: number;
  private overboughtThreshold: number;
  private oversoldThreshold: number;
  private fastMAPeriod: number;
  private slowMAPeriod: number;
  private macdFastPeriod: number;
  private macdSlowPeriod: number;
  private macdSignalPeriod: number;
  private bbPeriod: number;
  private bbDeviation: number;
  private atrPeriod: number;
  private positionSize: number;
  private stopLossPercent: number;
  private takeProfitPercent: number;
  private enableAutoTrading: boolean;
  
  // Indicator weights
  private rsiWeight: number;
  private macdWeight: number;
  private maWeight: number;
  private bbWeight: number;
  
  // State variables
  private isRunning: boolean = false;
  private currentPosition: any = null;
  private priceData: any[] = [];
  
  // Indicator values
  private rsiValues: number[] = [];
  private fastMAValues: number[] = [];
  private slowMAValues: number[] = [];
  private macdValues: { macd: number, signal: number, histogram: number }[] = [];
  private bbValues: { upper: number, middle: number, lower: number }[] = [];
  private atrValues: number[] = [];
  
  // Market analysis
  private marketRegime: 'trending' | 'ranging' | 'volatile' = 'ranging';
  private volatilityLevel: 'low' | 'medium' | 'high' = 'medium';
  private marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  // Performance metrics
  private performanceMetrics = {
    winRate: 0,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
    indicatorPerformance: {
      rsi: { correctSignals: 0, falseSignals: 0, accuracy: 0 },
      macd: { correctSignals: 0, falseSignals: 0, accuracy: 0 },
      ma: { correctSignals: 0, falseSignals: 0, accuracy: 0 },
      bb: { correctSignals: 0, falseSignals: 0, accuracy: 0 }
    }
  };
  
  /**
   * Creates a new instance of MultiIndicatorStrategy
   * @param capitalComService Capital.com service instance
   * @param config Strategy configuration
   */
  constructor(
    capitalComService: CapitalComService, 
    config: MultiIndicatorStrategyProps
  ) {
    this.capitalComService = capitalComService;
    
    // Initialize parameters from config
    this.symbol = config.symbol;
    this.timeframe = config.timeframe;
    this.rsiPeriod = config.rsiPeriod;
    this.overboughtThreshold = config.overboughtThreshold;
    this.oversoldThreshold = config.oversoldThreshold;
    this.fastMAPeriod = config.fastMAPeriod;
    this.slowMAPeriod = config.slowMAPeriod;
    this.macdFastPeriod = config.macdFastPeriod;
    this.macdSlowPeriod = config.macdSlowPeriod;
    this.macdSignalPeriod = config.macdSignalPeriod;
    this.bbPeriod = config.bbPeriod;
    this.bbDeviation = config.bbDeviation;
    this.atrPeriod = config.atrPeriod;
    this.positionSize = config.positionSize;
    this.stopLossPercent = config.stopLossPercent;
    this.takeProfitPercent = config.takeProfitPercent;
    this.enableAutoTrading = config.enableAutoTrading;
    
    // Initialize indicator weights
    this.rsiWeight = config.rsiWeight;
    this.macdWeight = config.macdWeight;
    this.maWeight = config.maWeight;
    this.bbWeight = config.bbWeight;
  }
  
  /**
   * Initialize the strategy with historical data and WebSocket connection
   * @param sessionToken Session token for WebSocket authentication
   * @param isDemo Whether to use demo environment
   */
  public async initialize(sessionToken: string, isDemo: boolean = false): Promise<void> {
    try {
      // Load historical price data
      await this.loadHistoricalData();
      
      // Calculate initial indicator values
      this.calculateIndicators();
      
      // Analyze market conditions
      this.analyzeMarketConditions();
      
      // Initialize WebSocket for real-time data
      this.webSocket = new CapitalComWebSocket(sessionToken, isDemo);
      
      // Subscribe to price updates
      this.webSocket.subscribe(
        this.symbol,
        'multi-indicator-strategy',
        this.handlePriceUpdate.bind(this)
      );
      
      // Check for existing position
      await this.checkExistingPosition();
      
      console.log(`Strategy initialized for ${this.symbol} with multiple indicators`);
      console.log(`Market regime: ${this.marketRegime}, Volatility: ${this.volatilityLevel}, Sentiment: ${this.marketSentiment}`);
    } catch (error) {
      console.error('Failed to initialize strategy:', error);
      throw error;
    }
  }
  
  /**
   * Load historical price data for the symbol
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      // Calculate time range based on timeframe and indicator periods
      const now = new Date();
      let from = new Date();
      
      // Determine maximum lookback period needed for all indicators
      const maxPeriod = Math.max(
        this.rsiPeriod,
        this.slowMAPeriod,
        this.macdSlowPeriod + this.macdSignalPeriod,
        this.bbPeriod,
        this.atrPeriod
      );
      
      // Add buffer for calculations
      const lookbackPeriods = maxPeriod + 50;
      
      // Determine how far back to fetch data based on timeframe
      switch (this.timeframe) {
        case 'MINUTE':
          from.setMinutes(from.getMinutes() - lookbackPeriods);
          break;
        case 'MINUTE_5':
          from.setMinutes(from.getMinutes() - lookbackPeriods * 5);
          break;
        case 'MINUTE_15':
          from.setMinutes(from.getMinutes() - lookbackPeriods * 15);
          break;
        case 'MINUTE_30':
          from.setMinutes(from.getMinutes() - lookbackPeriods * 30);
          break;
        case 'HOUR':
          from.setHours(from.getHours() - lookbackPeriods);
          break;
        case 'HOUR_4':
          from.setHours(from.getHours() - lookbackPeriods * 4);
          break;
        case 'DAY':
          from.setDate(from.getDate() - lookbackPeriods);
          break;
        default:
          from.setHours(from.getHours() - lookbackPeriods);
      }
      
      // Fetch price history
      const priceHistory = await this.capitalComService.getPriceHistory(
        this.symbol,
        this.timeframe,
        from.getTime(),
        now.getTime()
      );
      
      this.priceData = priceHistory.prices;
      
      console.log(`Loaded ${this.priceData.length} historical price points for ${this.symbol}`);
    } catch (error) {
      console.error('Failed to load historical data:', error);
      throw error;
    }
  }
  
  /**
   * Calculate all technical indicators
   */
  private calculateIndicators(): void {
    if (this.priceData.length < this.slowMAPeriod) {
      console.error('Not enough data to calculate indicators');
      return;
    }
    
    // Extract price data
    const closes = this.priceData.map(price => price.close);
    const highs = this.priceData.map(price => price.high);
    const lows = this.priceData.map(price => price.low);
    
    // Calculate RSI
    this.calculateRSI(closes);
    
    // Calculate Moving Averages
    this.calculateMovingAverages(closes);
    
    // Calculate MACD
    this.calculateMACD(closes);
    
    // Calculate Bollinger Bands
    this.calculateBollingerBands(closes);
    
    // Calculate ATR
    this.calculateATR(highs, lows, closes);
    
    console.log('All indicators calculated successfully');
  }
  
  /**
   * Calculate RSI values from price data
   * @param closes Array of closing prices
   */
  private calculateRSI(closes: number[]): void {
    if (closes.length < this.rsiPeriod + 1) {
      console.error('Not enough data to calculate RSI');
      return;
    }
    
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }
    
    // Calculate RSI for each period
    this.rsiValues = [];
    
    // Calculate first RSI
    let avgGain = 0;
    let avgLoss = 0;
    
    // First RSI calculation uses simple average
    for (let i = 0; i < this.rsiPeriod; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }
    
    avgGain /= this.rsiPeriod;
    avgLoss /= this.rsiPeriod;
    
    // Calculate first RSI value
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    this.rsiValues.push(rsi);
    
    // Calculate remaining RSI values using Wilder's smoothing method
    for (let i = this.rsiPeriod; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = ((avgGain * (this.rsiPeriod - 1)) + gain) / this.rsiPeriod;
      avgLoss = ((avgLoss * (this.rsiPeriod - 1)) + loss) / this.rsiPeriod;
      
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      this.rsiValues.push(rsi);
    }
    
    console.log(`Calculated ${this.rsiValues.length} RSI values, latest: ${this.rsiValues[this.rsiValues.length - 1]?.toFixed(2)}`);
  }
  
  /**
   * Calculate Moving Averages
   * @param closes Array of closing prices
   */
  private calculateMovingAverages(closes: number[]): void {
    // Calculate Fast MA (Simple Moving Average)
    this.fastMAValues = this.calculateSMA(closes, this.fastMAPeriod);
    
    // Calculate Slow MA (Simple Moving Average)
    this.slowMAValues = this.calculateSMA(closes, this.slowMAPeriod);
    
    console.log(`Calculated Moving Averages, latest Fast MA: ${this.fastMAValues[this.fastMAValues.length - 1]?.toFixed(5)}, Slow MA: ${this.slowMAValues[this.slowMAValues.length - 1]?.toFixed(5)}`);
  }
  
  /**
   * Calculate Simple Moving Average
   * @param data Array of values
   * @param period Period for SMA calculation
   * @returns Array of SMA values
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
   * Calculate MACD values
   * @param closes Array of closing prices
   */
  private calculateMACD(closes: number[]): void {
    // Calculate EMA for fast period
    const fastEMA = this.calculateEMA(closes, this.macdFastPeriod);
    
    // Calculate EMA for slow period
    const slowEMA = this.calculateEMA(closes, this.macdSlowPeriod);
    
    // Calculate MACD line (fast EMA - slow EMA)
    const macdLine: number[] = [];
    const maxLength = Math.min(fastEMA.length, slowEMA.length);
    
    for (let i = 0; i < maxLength; i++) {
      macdLine.push(fastEMA[fastEMA.length - maxLength + i] - slowEMA[slowEMA.length - maxLength + i]);
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateEMA(macdLine, this.macdSignalPeriod);
    
    // Calculate histogram (MACD line - signal line)
    this.macdValues = [];
    
    for (let i = 0; i < signalLine.length; i++) {
      const macd = macdLine[macdLine.length - signalLine.length + i];
      const signal = signalLine[i];
      const histogram = macd - signal;
      
      this.macdValues.push({ macd, signal, histogram });
    }
    
    console.log(`Calculated ${this.macdValues.length} MACD values, latest: MACD ${this.macdValues[this.macdValues.length - 1]?.macd.toFixed(5)}, Signal ${this.macdValues[this.macdValues.length - 1]?.signal.toFixed(5)}, Histogram ${this.macdValues[this.macdValues.length - 1]?.histogram.toFixed(5)}`);
  }
  
  /**
   * Calculate Exponential Moving Average
   * @param data Array of values
   * @param period Period for EMA calculation
   * @returns Array of EMA values
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
   * @param closes Array of closing prices
   */
  private calculateBollingerBands(closes: number[]): void {
    // Calculate middle band (SMA)
    const middleBand = this.calculateSMA(closes, this.bbPeriod);
    
    // Calculate standard deviation for each period
    this.bbValues = [];
    
    for (let i = this.bbPeriod - 1; i < closes.length; i++) {
      const periodData = closes.slice(i - this.bbPeriod + 1, i + 1);
      const mean = middleBand[i - (this.bbPeriod - 1)];
      
      // Calculate sum of squared differences from mean
      const squaredDifferences = periodData.map(price => Math.pow(price - mean, 2));
      const sumSquaredDiff = squaredDifferences.reduce((total, diff) => total + diff, 0);
      
      // Calculate standard deviation
      const stdDev = Math.sqrt(sumSquaredDiff / this.bbPeriod);
      
      // Calculate upper and lower bands
      const upperBand = mean + (this.bbDeviation * stdDev);
      const lowerBand = mean - (this.bbDeviation * stdDev);
      
      this.bbValues.push({ upper: upperBand, middle: mean, lower: lowerBand });
    }
    
    console.log(`Calculated ${this.bbValues.length} Bollinger Bands values, latest: Upper ${this.bbValues[this.bbValues.length - 1]?.upper.toFixed(5)}, Middle ${this.bbValues[this.bbValues.length - 1]?.middle.toFixed(5)}, Lower ${this.bbValues[this.bbValues.length - 1]?.lower.toFixed(5)}`);
  }
  
  /**
   * Calculate Average True Range
   * @param highs Array of high prices
   * @param lows Array of low prices
   * @param closes Array of closing prices
   */
  private calculateATR(highs: number[], lows: number[], closes: number[]): void {
    // Calculate True Range for each period
    const trueRanges: number[] = [];
    
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
    this.atrValues = [];
    
    // First ATR is simple average of first period's true ranges
    let atr = trueRanges.slice(0, this.atrPeriod).reduce((total, tr) => total + tr, 0) / this.atrPeriod;
    this.atrValues.push(atr);
    
    // Calculate remaining ATR values
    for (let i = this.atrPeriod; i < trueRanges.length; i++) {
      atr = ((atr * (this.atrPeriod - 1)) + trueRanges[i]) / this.atrPeriod;
      this.atrValues.push(atr);
    }
    
    console.log(`Calculated ${this.atrValues.length} ATR values, latest: ${this.atrValues[this.atrValues.length - 1]?.toFixed(5)}`);
  }
  
  /**
   * Analyze market conditions to determine regime, volatility, and sentiment
   */
  private analyzeMarketConditions(): void {
    // Determine market regime (trending, ranging, volatile)
    this.determineMarketRegime();
    
    // Determine volatility level
    this.determineVolatilityLevel();
    
    // Determine market sentiment
    this.determineMarketSentiment();
    
    // Adjust indicator weights based on market conditions
    this.adjustIndicatorWeights();
    
    console.log(`Market analysis: Regime=${this.marketRegime}, Volatility=${this.volatilityLevel}, Sentiment=${this.marketSentiment}`);
    console.log(`Adjusted weights: RSI=${this.rsiWeight}, MACD=${this.macdWeight}, MA=${this.maWeight}, BB=${this.bbWeight}`);
  }
  
  /**
   * Determine market regime (trending, ranging, volatile)
   */
  private determineMarketRegime(): void {
    // Use ADX to determine trend strength
    const adxValues = this.calculateADX(14);
    const recentADX = adxValues.slice(-10).reduce((sum, val) => sum + val, 0) / 10;
    
    // Calculate price volatility
    const volatility = this.calculateVolatilityMetric();
    
    // Determine market regime based on ADX and volatility
    if (recentADX > 25) {
      this.marketRegime = 'trending';
    } else if (volatility > 1.5) {
      this.marketRegime = 'volatile';
    } else {
      this.marketRegime = 'ranging';
    }
  }
  
  /**
   * Calculate ADX (Average Directional Index)
   * @param period Period for ADX calculation
   * @returns Array of ADX values
   */
  private calculateADX(period: number): number[] {
    const adxValues: number[] = [];
    
    // Need at least period+1 data points
    if (this.priceData.length <= period + 1) {
      return adxValues;
    }
    
    try {
      // Calculate +DI and -DI
      const plusDM: number[] = [];
      const minusDM: number[] = [];
      const trueRange: number[] = [];
      
      // Calculate initial values
      for (let i = 1; i < this.priceData.length; i++) {
        const high = this.priceData[i].high;
        const low = this.priceData[i].low;
        const prevHigh = this.priceData[i-1].high;
        const prevLow = this.priceData[i-1].low;
        const prevClose = this.priceData[i-1].close;
        
        // Calculate directional movement
        const upMove = high - prevHigh;
        const downMove = prevLow - low;
        
        // +DM
        if (upMove > downMove && upMove > 0) {
          plusDM.push(upMove);
        } else {
          plusDM.push(0);
        }
        
        // -DM
        if (downMove > upMove && downMove > 0) {
          minusDM.push(downMove);
        } else {
          minusDM.push(0);
        }
        
        // True Range
        const tr1 = high - low;
        const tr2 = Math.abs(high - prevClose);
        const tr3 = Math.abs(low - prevClose);
        trueRange.push(Math.max(tr1, tr2, tr3));
      }
      
      // Calculate smoothed values
      const smoothedPlusDM: number[] = this.calculateSmoothedValues(plusDM, period);
      const smoothedMinusDM: number[] = this.calculateSmoothedValues(minusDM, period);
      const smoothedTR: number[] = this.calculateSmoothedValues(trueRange, period);
      
      // Calculate +DI and -DI
      const plusDI: number[] = [];
      const minusDI: number[] = [];
      
      for (let i = 0; i < smoothedPlusDM.length; i++) {
        plusDI.push((smoothedPlusDM[i] / smoothedTR[i]) * 100);
        minusDI.push((smoothedMinusDM[i] / smoothedTR[i]) * 100);
      }
      
      // Calculate DX
      const dx: number[] = [];
      
      for (let i = 0; i < plusDI.length; i++) {
        const diff = Math.abs(plusDI[i] - minusDI[i]);
        const sum = plusDI[i] + minusDI[i];
        dx.push((diff / sum) * 100);
      }
      
      // Calculate ADX (smoothed DX)
      let adxSum = 0;
      
      for (let i = 0; i < dx.length; i++) {
        adxSum += dx[i];
        
        if (i >= period - 1) {
          if (i === period - 1) {
            // First ADX value is simple average
            adxValues.push(adxSum / period);
          } else {
            // Subsequent ADX values use smoothing
            adxValues.push(((adxValues[adxValues.length - 1] * (period - 1)) + dx[i]) / period);
          }
        }
      }
      
      return adxValues;
    } catch (error) {
      console.error('Error calculating ADX:', error);
      return [];
    }
  }
  
  /**
   * Calculate smoothed values for technical indicators
   * @param values Array of values to smooth
   * @param period Smoothing period
   * @returns Array of smoothed values
   */
  private calculateSmoothedValues(values: number[], period: number): number[] {
    const smoothed: number[] = [];
    let sum = 0;
    
    // Calculate first smoothed value (simple average)
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    
    smoothed.push(sum / period);
    
    // Calculate subsequent smoothed values
    for (let i = period; i < values.length; i++) {
      smoothed.push(((smoothed[smoothed.length - 1] * (period - 1)) + values[i]) / period);
    }
    
    return smoothed;
  }
  
  /**
   * Calculate volatility metric (normalized ATR)
   * @returns Volatility metric
   */
  private calculateVolatilityMetric(): number {
    // Use ATR for volatility measurement
    if (this.atrValues.length === 0) {
      return 1.0; // Default to medium volatility if ATR not calculated
    }
    
    // Get recent ATR
    const recentATR = this.atrValues[this.atrValues.length - 1];
    
    // Normalize ATR by dividing by average price
    const avgPrice = this.priceData.slice(-this.atrPeriod).reduce((sum, price) => sum + price.close, 0) / this.atrPeriod;
    
    return (recentATR / avgPrice) * 100;
  }
  
  /**
   * Determine volatility level
   */
  private determineVolatilityLevel(): void {
    const volatility = this.calculateVolatilityMetric();
    
    // Determine volatility level
    if (volatility < 0.8) {
      this.volatilityLevel = 'low';
    } else if (volatility > 1.5) {
      this.volatilityLevel = 'high';
    } else {
      this.volatilityLevel = 'medium';
    }
  }
  
  /**
   * Determine market sentiment
   */
  private determineMarketSentiment(): void {
    // Use moving averages and recent price action to determine sentiment
    if (this.fastMAValues.length === 0 || this.slowMAValues.length === 0) {
      this.marketSentiment = 'neutral';
      return;
    }
    
    // Get latest values
    const latestFastMA = this.fastMAValues[this.fastMAValues.length - 1];
    const latestSlowMA = this.slowMAValues[this.slowMAValues.length - 1];
    
    // Count recent bullish and bearish candles
    const recentCandles = this.priceData.slice(-10);
    let bullishCount = 0;
    let bearishCount = 0;
    
    for (let i = 0; i < recentCandles.length; i++) {
      if (recentCandles[i].close > recentCandles[i].open) {
        bullishCount++;
      } else if (recentCandles[i].close < recentCandles[i].open) {
        bearishCount++;
      }
    }
    
    // Determine sentiment based on moving averages and recent price action
    if (latestFastMA > latestSlowMA && bullishCount > bearishCount) {
      this.marketSentiment = 'bullish';
    } else if (latestFastMA < latestSlowMA && bearishCount > bullishCount) {
      this.marketSentiment = 'bearish';
    } else {
      this.marketSentiment = 'neutral';
    }
  }
  
  /**
   * Adjust indicator weights based on market conditions
   */
  private adjustIndicatorWeights(): void {
    // Default weights
    let rsiWeight = 0.25;
    let macdWeight = 0.25;
    let maWeight = 0.25;
    let bbWeight = 0.25;
    
    // Adjust based on market regime
    switch (this.marketRegime) {
      case 'trending':
        // In trending markets, favor MA and MACD
        maWeight = 0.35;
        macdWeight = 0.35;
        rsiWeight = 0.15;
        bbWeight = 0.15;
        break;
      case 'ranging':
        // In ranging markets, favor RSI and Bollinger Bands
        rsiWeight = 0.35;
        bbWeight = 0.35;
        macdWeight = 0.15;
        maWeight = 0.15;
        break;
      case 'volatile':
        // In volatile markets, favor Bollinger Bands and ATR (included in signal generation)
        bbWeight = 0.40;
        rsiWeight = 0.20;
        macdWeight = 0.20;
        maWeight = 0.20;
        break;
    }
    
    // Adjust based on volatility
    if (this.volatilityLevel === 'high') {
      // In high volatility, increase Bollinger Bands weight
      bbWeight += 0.05;
      rsiWeight -= 0.05;
    } else if (this.volatilityLevel === 'low') {
      // In low volatility, increase RSI weight
      rsiWeight += 0.05;
      bbWeight -= 0.05;
    }
    
    // Adjust based on sentiment
    if (this.marketSentiment === 'bullish') {
      // In bullish markets, slightly favor MA and MACD
      maWeight += 0.05;
      macdWeight += 0.05;
      rsiWeight -= 0.05;
      bbWeight -= 0.05;
    } else if (this.marketSentiment === 'bearish') {
      // In bearish markets, slightly favor RSI and Bollinger Bands
      rsiWeight += 0.05;
      bbWeight += 0.05;
      maWeight -= 0.05;
      macdWeight -= 0.05;
    }
    
    // Normalize weights to ensure they sum to 1
    const totalWeight = rsiWeight + macdWeight + maWeight + bbWeight;
    this.rsiWeight = rsiWeight / totalWeight;
    this.macdWeight = macdWeight / totalWeight;
    this.maWeight = maWeight / totalWeight;
    this.bbWeight = bbWeight / totalWeight;
  }
  
  /**
   * Check for existing position in the symbol
   */
  private async checkExistingPosition(): Promise<void> {
    try {
      const positions = await this.capitalComService.getPositions();
      
      // Find position for this symbol
      this.currentPosition = positions.find(pos => pos.symbol === this.symbol);
      
      if (this.currentPosition) {
        console.log(`Found existing position for ${this.symbol}: ${this.currentPosition.direction} ${this.currentPosition.size}`);
      }
    } catch (error) {
      console.error('Failed to check existing position:', error);
    }
  }
  
  /**
   * Handle real-time price update
   * @param data Price update data
   */
  private handlePriceUpdate(data: any): void {
    try {
      if (!data || !data.bid || !data.ask) {
        return;
      }
      
      // Add new price point
      const newPrice = {
        time: new Date().getTime(),
        open: data.bid,
        high: data.bid,
        low: data.bid,
        close: data.bid,
        volume: data.volume || 0
      };
      
      this.priceData.push(newPrice);
      
      // Keep only necessary amount of data
      const maxPeriod = Math.max(
        this.rsiPeriod,
        this.slowMAPeriod,
        this.macdSlowPeriod + this.macdSignalPeriod,
        this.bbPeriod,
        this.atrPeriod
      );
      
      if (this.priceData.length > maxPeriod + 100) {
        this.priceData.shift();
      }
      
      // Recalculate indicators
      this.calculateIndicators();
      
      // Check for trading signals if auto-trading is enabled
      if (this.isRunning && this.enableAutoTrading) {
        this.checkTradingSignals(data.bid, data.ask);
      }
    } catch (error) {
      console.error('Error handling price update:', error);
    }
  }
  
  /**
   * Check for trading signals based on multiple indicators
   * @param bid Current bid price
   * @param ask Current ask price
   */
  private async checkTradingSignals(bid: number, ask: number): Promise<void> {
    if (this.rsiValues.length < 2 || this.macdValues.length < 2 || 
        this.fastMAValues.length < 2 || this.bbValues.length < 2) {
      return;
    }
    
    // Get latest indicator values
    const currentRSI = this.rsiValues[this.rsiValues.length - 1];
    const previousRSI = this.rsiValues[this.rsiValues.length - 2];
    
    const currentMACD = this.macdValues[this.macdValues.length - 1];
    const previousMACD = this.macdValues[this.macdValues.length - 2];
    
    const currentFastMA = this.fastMAValues[this.fastMAValues.length - 1];
    const currentSlowMA = this.slowMAValues[this.slowMAValues.length - 1];
    const previousFastMA = this.fastMAValues[this.fastMAValues.length - 2];
    const previousSlowMA = this.slowMAValues[this.slowMAValues.length - 2];
    
    const currentBB = this.bbValues[this.bbValues.length - 1];
    const currentPrice = this.priceData[this.priceData.length - 1].close;
    
    // Calculate individual indicator signals
    // RSI Signal: -1 (sell), 0 (neutral), 1 (buy)
    let rsiSignal = 0;
    if (previousRSI < this.oversoldThreshold && currentRSI >= this.oversoldThreshold) {
      rsiSignal = 1; // Buy signal
    } else if (previousRSI > this.overboughtThreshold && currentRSI <= this.overboughtThreshold) {
      rsiSignal = -1; // Sell signal
    }
    
    // MACD Signal: -1 (sell), 0 (neutral), 1 (buy)
    let macdSignal = 0;
    if (previousMACD.histogram < 0 && currentMACD.histogram >= 0) {
      macdSignal = 1; // Buy signal (histogram crosses above zero)
    } else if (previousMACD.histogram > 0 && currentMACD.histogram <= 0) {
      macdSignal = -1; // Sell signal (histogram crosses below zero)
    }
    
    // Moving Average Signal: -1 (sell), 0 (neutral), 1 (buy)
    let maSignal = 0;
    if (previousFastMA <= previousSlowMA && currentFastMA > currentSlowMA) {
      maSignal = 1; // Buy signal (fast MA crosses above slow MA)
    } else if (previousFastMA >= previousSlowMA && currentFastMA < currentSlowMA) {
      maSignal = -1; // Sell signal (fast MA crosses below slow MA)
    }
    
    // Bollinger Bands Signal: -1 (sell), 0 (neutral), 1 (buy)
    let bbSignal = 0;
    if (currentPrice <= currentBB.lower) {
      bbSignal = 1; // Buy signal (price touches or crosses below lower band)
    } else if (currentPrice >= currentBB.upper) {
      bbSignal = -1; // Sell signal (price touches or crosses above upper band)
    }
    
    // Calculate weighted composite signal
    const compositeSignal = 
      (rsiSignal * this.rsiWeight) + 
      (macdSignal * this.macdWeight) + 
      (maSignal * this.maWeight) + 
      (bbSignal * this.bbWeight);
    
    // Log signals for debugging
    console.log(`Signals - RSI: ${rsiSignal}, MACD: ${macdSignal}, MA: ${maSignal}, BB: ${bbSignal}, Composite: ${compositeSignal.toFixed(2)}`);
    
    // Determine trading action based on composite signal
    if (compositeSignal >= 0.5) {
      console.log(`Buy signal: Composite signal ${compositeSignal.toFixed(2)} >= 0.5`);
      
      // If we have an open position in the opposite direction, close it first
      if (this.currentPosition && this.currentPosition.direction === 'SELL') {
        await this.closePosition();
      }
      
      // Open a new long position if we don't have one already
      if (!this.currentPosition || this.currentPosition.direction !== 'BUY') {
        await this.openPosition('BUY', ask);
      }
    } else if (compositeSignal <= -0.5) {
      console.log(`Sell signal: Composite signal ${compositeSignal.toFixed(2)} <= -0.5`);
      
      // If we have an open position in the opposite direction, close it first
      if (this.currentPosition && this.currentPosition.direction === 'BUY') {
        await this.closePosition();
      }
      
      // Open a new short position if we don't have one already
      if (!this.currentPosition || this.currentPosition.direction !== 'SELL') {
        await this.openPosition('SELL', bid);
      }
    }
  }
  
  /**
   * Open a new position
   * @param direction Trade direction (BUY or SELL)
   * @param price Current price
   */
  private async openPosition(direction: 'BUY' | 'SELL', price: number): Promise<void> {
    if (!this.enableAutoTrading) {
      console.log('Auto-trading is disabled, not opening position');
      return;
    }
    
    try {
      // Get current ATR for dynamic stop loss and take profit
      const currentATR = this.atrValues[this.atrValues.length - 1] || 0;
      
      // Calculate stop loss and take profit levels based on ATR
      let stopLossDistance = this.stopLossPercent / 100 * price;
      let takeProfitDistance = this.takeProfitPercent / 100 * price;
      
      // If ATR is available, use it to adjust stop loss and take profit
      if (currentATR > 0) {
        // Use ATR multiplier based on volatility
        let atrMultiplier = 1.5; // Default multiplier
        
        if (this.volatilityLevel === 'high') {
          atrMultiplier = 2.0; // Wider stops in high volatility
        } else if (this.volatilityLevel === 'low') {
          atrMultiplier = 1.0; // Tighter stops in low volatility
        }
        
        // Calculate ATR-based stop loss and take profit
        const atrBasedStop = currentATR * atrMultiplier;
        const atrBasedTakeProfit = currentATR * atrMultiplier * 1.5; // Risk:reward of 1:1.5
        
        // Use the larger of percentage-based or ATR-based for safety
        stopLossDistance = Math.max(stopLossDistance, atrBasedStop);
        takeProfitDistance = Math.max(takeProfitDistance, atrBasedTakeProfit);
      }
      
      // Calculate final stop loss and take profit levels
      const stopLoss = direction === 'BUY'
        ? price - stopLossDistance
        : price + stopLossDistance;
      
      const takeProfit = direction === 'BUY'
        ? price + takeProfitDistance
        : price - takeProfitDistance;
      
      // Place the trade
      const orderResponse = await this.capitalComService.placeTrade({
        symbol: this.symbol,
        direction: direction,
        size: this.positionSize,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        orderType: 'MARKET'
      });
      
      console.log(`Position opened: ${direction} ${this.positionSize} ${this.symbol} at ${price}, SL: ${stopLoss}, TP: ${takeProfit}`);
      
      // Update current position
      await this.checkExistingPosition();
    } catch (error) {
      console.error('Failed to open position:', error);
    }
  }
  
  /**
   * Close the current position
   */
  private async closePosition(): Promise<void> {
    if (!this.currentPosition) {
      return;
    }
    
    try {
      const result = await this.capitalComService.closePosition(this.currentPosition.dealId);
      
      if (result) {
        console.log(`Position closed: ${this.currentPosition.direction} ${this.currentPosition.size} ${this.symbol}`);
        
        // Update performance metrics
        this.updatePerformanceMetrics({
          profit: this.currentPosition.profit,
          direction: this.currentPosition.direction,
          openPrice: this.currentPosition.openLevel,
          closePrice: this.currentPosition.currentLevel,
          size: this.currentPosition.size,
          signals: {
            rsi: this.getLastSignal('rsi'),
            macd: this.getLastSignal('macd'),
            ma: this.getLastSignal('ma'),
            bb: this.getLastSignal('bb')
          }
        });
        
        this.currentPosition = null;
      } else {
        console.error('Failed to close position');
      }
    } catch (error) {
      console.error('Error closing position:', error);
    }
  }
  
  /**
   * Get the last signal generated by an indicator
   * @param indicator Indicator name
   * @returns Signal value (-1, 0, or 1)
   */
  private getLastSignal(indicator: 'rsi' | 'macd' | 'ma' | 'bb'): number {
    // This would normally track the last signal generated by each indicator
    // For simplicity, we're returning 0 (neutral) here
    return 0;
  }
  
  /**
   * Update performance metrics based on trade result
   * @param trade Trade result
   */
  private updatePerformanceMetrics(trade: any): void {
    this.performanceMetrics.totalTrades++;
    
    if (trade.profit > 0) {
      this.performanceMetrics.profitableTrades++;
      this.performanceMetrics.totalProfit += trade.profit;
      this.performanceMetrics.consecutiveWins++;
      this.performanceMetrics.consecutiveLosses = 0;
      
      // Update average win
      this.performanceMetrics.averageWin = this.performanceMetrics.totalProfit / this.performanceMetrics.profitableTrades;
    } else {
      this.performanceMetrics.totalLoss += Math.abs(trade.profit);
      this.performanceMetrics.consecutiveLosses++;
      this.performanceMetrics.consecutiveWins = 0;
      
      // Update average loss
      const unprofitableTrades = this.performanceMetrics.totalTrades - this.performanceMetrics.profitableTrades;
      this.performanceMetrics.averageLoss = unprofitableTrades > 0 
        ? this.performanceMetrics.totalLoss / unprofitableTrades
        : 0;
    }
    
    // Update win rate
    this.performanceMetrics.winRate = this.performanceMetrics.totalTrades > 0
      ? (this.performanceMetrics.profitableTrades / this.performanceMetrics.totalTrades) * 100
      : 0;
    
    // Update profit factor
    this.performanceMetrics.profitFactor = this.performanceMetrics.totalLoss > 0
      ? this.performanceMetrics.totalProfit / this.performanceMetrics.totalLoss
      : this.performanceMetrics.totalProfit > 0 ? 999 : 0;
    
    // Update indicator performance
    this.updateIndicatorPerformance(trade);
    
    console.log('Updated performance metrics:', this.performanceMetrics);
    
    // Adjust strategy parameters based on performance
    this.adjustStrategyParameters();
  }
  
  /**
   * Update indicator performance metrics
   * @param trade Trade result
   */
  private updateIndicatorPerformance(trade: any): void {
    // For each indicator, track if it gave correct or false signal
    const signals = trade.signals || { rsi: 0, macd: 0, ma: 0, bb: 0 };
    const profitable = trade.profit > 0;
    
    // For each indicator, update correct/false signal count
    for (const [indicator, signal] of Object.entries(signals)) {
      if (signal !== 0) { // If indicator gave a signal
        const correctSignal = (signal > 0 && trade.direction === 'BUY' && profitable) || 
                             (signal < 0 && trade.direction === 'SELL' && profitable);
        
        if (correctSignal) {
          this.performanceMetrics.indicatorPerformance[indicator].correctSignals++;
        } else {
          this.performanceMetrics.indicatorPerformance[indicator].falseSignals++;
        }
        
        // Update accuracy
        const totalSignals = this.performanceMetrics.indicatorPerformance[indicator].correctSignals + 
                            this.performanceMetrics.indicatorPerformance[indicator].falseSignals;
        
        if (totalSignals > 0) {
          this.performanceMetrics.indicatorPerformance[indicator].accuracy = 
            (this.performanceMetrics.indicatorPerformance[indicator].correctSignals / totalSignals) * 100;
        }
      }
    }
  }
  
  /**
   * Adjust strategy parameters based on performance
   */
  private adjustStrategyParameters(): void {
    // Only adjust if we have enough trades
    if (this.performanceMetrics.totalTrades < 5) {
      return;
    }
    
    // Adjust RSI thresholds based on win rate
    if (this.performanceMetrics.winRate < 40) {
      // If win rate is low, make thresholds more extreme
      this.overboughtThreshold = Math.min(80, this.overboughtThreshold + 2);
      this.oversoldThreshold = Math.max(20, this.oversoldThreshold - 2);
      console.log(`Adjusted RSI thresholds to ${this.oversoldThreshold}/${this.overboughtThreshold} due to low win rate`);
    } else if (this.performanceMetrics.winRate > 60) {
      // If win rate is high, make thresholds less extreme
      this.overboughtThreshold = Math.max(70, this.overboughtThreshold - 1);
      this.oversoldThreshold = Math.min(30, this.oversoldThreshold + 1);
      console.log(`Adjusted RSI thresholds to ${this.oversoldThreshold}/${this.overboughtThreshold} due to high win rate`);
    }
    
    // Adjust position size based on profit factor
    if (this.performanceMetrics.profitFactor < 1.0) {
      // Reduce position size if losing money
      this.positionSize = Math.max(0.1, this.positionSize * 0.8);
      console.log(`Reduced position size to ${this.positionSize} due to low profit factor`);
    } else if (this.performanceMetrics.profitFactor > 2.0) {
      // Increase position size if very profitable
      this.positionSize = Math.min(this.positionSize * 1.2, 10);
      console.log(`Increased position size to ${this.positionSize} due to high profit factor`);
    }
    
    // Adjust stop loss and take profit based on average win/loss ratio
    if (this.performanceMetrics.averageWin > 0 && this.performanceMetrics.averageLoss > 0) {
      const ratio = this.performanceMetrics.averageWin / this.performanceMetrics.averageLoss;
      
      if (ratio < 1.5) {
        // Increase take profit if average win is too small compared to average loss
        this.takeProfitPercent = Math.min(10, this.takeProfitPercent * 1.2);
        console.log(`Increased take profit to ${this.takeProfitPercent}% due to low win/loss ratio`);
      } else if (ratio > 3.0) {
        // Decrease take profit if average win is much larger than average loss
        this.takeProfitPercent = Math.max(1, this.takeProfitPercent * 0.9);
        console.log(`Decreased take profit to ${this.takeProfitPercent}% due to high win/loss ratio`);
      }
    }
    
    // Adjust indicator weights based on performance
    this.adjustIndicatorWeightsBasedOnPerformance();
  }
  
  /**
   * Adjust indicator weights based on their performance
   */
  private adjustIndicatorWeightsBasedOnPerformance(): void {
    // Get indicator accuracies
    const rsiAccuracy = this.performanceMetrics.indicatorPerformance.rsi.accuracy;
    const macdAccuracy = this.performanceMetrics.indicatorPerformance.macd.accuracy;
    const maAccuracy = this.performanceMetrics.indicatorPerformance.ma.accuracy;
    const bbAccuracy = this.performanceMetrics.indicatorPerformance.bb.accuracy;
    
    // Only adjust if we have enough data
    if (rsiAccuracy === 0 && macdAccuracy === 0 && maAccuracy === 0 && bbAccuracy === 0) {
      return;
    }
    
    // Calculate total accuracy
    const totalAccuracy = rsiAccuracy + macdAccuracy + maAccuracy + bbAccuracy;
    
    if (totalAccuracy > 0) {
      // Adjust weights based on relative accuracy
      this.rsiWeight = rsiAccuracy / totalAccuracy;
      this.macdWeight = macdAccuracy / totalAccuracy;
      this.maWeight = maAccuracy / totalAccuracy;
      this.bbWeight = bbAccuracy / totalAccuracy;
      
      // Ensure minimum weight of 0.1 for each indicator
      const minWeight = 0.1;
      let totalWeight = this.rsiWeight + this.macdWeight + this.maWeight + this.bbWeight;
      
      if (this.rsiWeight < minWeight) {
        this.rsiWeight = minWeight;
      }
      if (this.macdWeight < minWeight) {
        this.macdWeight = minWeight;
      }
      if (this.maWeight < minWeight) {
        this.maWeight = minWeight;
      }
      if (this.bbWeight < minWeight) {
        this.bbWeight = minWeight;
      }
      
      // Normalize weights to ensure they sum to 1
      totalWeight = this.rsiWeight + this.macdWeight + this.maWeight + this.bbWeight;
      this.rsiWeight = this.rsiWeight / totalWeight;
      this.macdWeight = this.macdWeight / totalWeight;
      this.maWeight = this.maWeight / totalWeight;
      this.bbWeight = this.bbWeight / totalWeight;
      
      console.log(`Adjusted indicator weights based on performance: RSI=${this.rsiWeight.toFixed(2)}, MACD=${this.macdWeight.toFixed(2)}, MA=${this.maWeight.toFixed(2)}, BB=${this.bbWeight.toFixed(2)}`);
    }
  }
  
  /**
   * Start the strategy
   */
  public start(): void {
    this.isRunning = true;
    console.log(`Strategy started for ${this.symbol}`);
  }
  
  /**
   * Stop the strategy
   */
  public stop(): void {
    this.isRunning = false;
    console.log(`Strategy stopped for ${this.symbol}`);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.webSocket) {
      this.webSocket.unsubscribe(this.symbol, 'multi-indicator-strategy');
      this.webSocket.close();
      this.webSocket = null;
    }
    
    this.isRunning = false;
    console.log(`Strategy cleaned up for ${this.symbol}`);
  }
  
  /**
   * Get current indicator values
   * @returns Current indicator values
   */
  public getCurrentIndicatorValues(): any {
    return {
      rsi: this.rsiValues.length > 0 ? this.rsiValues[this.rsiValues.length - 1] : 0,
      macd: this.macdValues.length > 0 ? this.macdValues[this.macdValues.length - 1] : { macd: 0, signal: 0, histogram: 0 },
      ma: {
        fast: this.fastMAValues.length > 0 ? this.fastMAValues[this.fastMAValues.length - 1] : 0,
        slow: this.slowMAValues.length > 0 ? this.slowMAValues[this.slowMAValues.length - 1] : 0
      },
      bb: this.bbValues.length > 0 ? this.bbValues[this.bbValues.length - 1] : { upper: 0, middle: 0, lower: 0 },
      atr: this.atrValues.length > 0 ? this.atrValues[this.atrValues.length - 1] : 0
    };
  }
  
  /**
   * Get performance metrics
   * @returns Performance metrics
   */
  public getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Get current strategy parameters
   * @returns Strategy parameters
   */
  public getParameters(): any {
    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      rsiPeriod: this.rsiPeriod,
      overboughtThreshold: this.overboughtThreshold,
      oversoldThreshold: this.oversoldThreshold,
      fastMAPeriod: this.fastMAPeriod,
      slowMAPeriod: this.slowMAPeriod,
      macdFastPeriod: this.macdFastPeriod,
      macdSlowPeriod: this.macdSlowPeriod,
      macdSignalPeriod: this.macdSignalPeriod,
      bbPeriod: this.bbPeriod,
      bbDeviation: this.bbDeviation,
      atrPeriod: this.atrPeriod,
      positionSize: this.positionSize,
      stopLossPercent: this.stopLossPercent,
      takeProfitPercent: this.takeProfitPercent,
      enableAutoTrading: this.enableAutoTrading,
      rsiWeight: this.rsiWeight,
      macdWeight: this.macdWeight,
      maWeight: this.maWeight,
      bbWeight: this.bbWeight,
      marketRegime: this.marketRegime,
      volatilityLevel: this.volatilityLevel,
      marketSentiment: this.marketSentiment
    };
  }
  
  /**
   * Get market analysis
   * @returns Market analysis
   */
  public getMarketAnalysis(): any {
    return {
      regime: this.marketRegime,
      volatility: this.volatilityLevel,
      sentiment: this.marketSentiment
    };
  }
}

/**
 * React hook for using the multi-indicator strategy
 * @param config Strategy configuration
 * @returns Strategy controller
 */
export const useMultiIndicatorStrategy = (config: MultiIndicatorStrategyProps) => {
  const [strategy, setStrategy] = useState<MultiIndicatorStrategy | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [indicatorValues, setIndicatorValues] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [parameters, setParameters] = useState(config);
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  
  // Initialize strategy
  const initializeStrategy = async (capitalComService: CapitalComService, sessionToken: string, isDemo: boolean) => {
    try {
      // Create and initialize strategy
      const strategyInstance = new MultiIndicatorStrategy(capitalComService, config);
      await strategyInstance.initialize(sessionToken, isDemo);
      
      setStrategy(strategyInstance);
      setIsInitialized(true);
      
      // Start polling for updates
      const updateInterval = setInterval(() => {
        if (strategyInstance) {
          setIndicatorValues(strategyInstance.getCurrentIndicatorValues());
          setPerformanceMetrics(strategyInstance.getPerformanceMetrics());
          setParameters(strategyInstance.getParameters());
          setMarketAnalysis(strategyInstance.getMarketAnalysis());
        }
      }, 5000);
      
      return () => {
        clearInterval(updateInterval);
        if (strategyInstance) {
          strategyInstance.cleanup();
        }
      };
    } catch (error) {
      console.error('Failed to initialize strategy:', error);
      throw error;
    }
  };
  
  // Start/stop strategy
  const toggleStrategy = () => {
    if (!strategy) return;
    
    if (isRunning) {
      strategy.stop();
      setIsRunning(false);
    } else {
      strategy.start();
      setIsRunning(true);
    }
  };
  
  return {
    initializeStrategy,
    isInitialized,
    isRunning,
    indicatorValues,
    performanceMetrics,
    parameters,
    marketAnalysis,
    toggleStrategy
  };
};

export default useMultiIndicatorStrategy;
