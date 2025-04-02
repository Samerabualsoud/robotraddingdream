import { useState, useEffect } from 'react';
import CapitalComService from './CapitalComService';
import { MultiIndicatorStrategy } from './MultiIndicatorStrategy';

export interface StrategyOptimizerProps {
  symbol: string;
  timeframe: string;
  historyDays: number;
  optimizationMethod: 'walkForward' | 'genetic' | 'gridSearch';
  optimizationMetric: 'profitFactor' | 'winRate' | 'netProfit' | 'sharpeRatio';
  enableAutoUpdate: boolean;
}

/**
 * Enhanced Strategy Optimizer for multi-indicator strategies
 * Implements advanced optimization techniques and indicator combination logic
 */
export class IndicatorCombinationOptimizer {
  private capitalComService: CapitalComService;
  private symbol: string;
  private timeframe: string;
  private historyDays: number;
  private optimizationMethod: 'walkForward' | 'genetic' | 'gridSearch';
  private optimizationMetric: 'profitFactor' | 'winRate' | 'netProfit' | 'sharpeRatio';
  private enableAutoUpdate: boolean;
  
  // Historical data
  private priceData: any[] = [];
  
  // Optimization results
  private optimizedParameters: any = null;
  private marketAnalysis: any = null;
  private correlationMatrix: any = null;
  private indicatorPerformance: any = null;
  private combinationRules: any = null;
  
  // Status
  private isOptimizing: boolean = false;
  private lastOptimizationTime: number = 0;
  private error: string | null = null;
  
  /**
   * Creates a new instance of IndicatorCombinationOptimizer
   * @param capitalComService Capital.com service instance
   * @param config Optimizer configuration
   */
  constructor(
    capitalComService: CapitalComService,
    config: StrategyOptimizerProps
  ) {
    this.capitalComService = capitalComService;
    this.symbol = config.symbol;
    this.timeframe = config.timeframe;
    this.historyDays = config.historyDays;
    this.optimizationMethod = config.optimizationMethod;
    this.optimizationMetric = config.optimizationMetric;
    this.enableAutoUpdate = config.enableAutoUpdate;
  }
  
  /**
   * Initialize the optimizer with historical data
   */
  public async initialize(): Promise<void> {
    try {
      // Load historical price data
      await this.loadHistoricalData();
      
      // Analyze market conditions
      await this.analyzeMarketConditions();
      
      // Analyze indicator correlations
      this.analyzeIndicatorCorrelations();
      
      // Generate initial combination rules
      this.generateCombinationRules();
      
      // Run initial optimization
      await this.optimizeStrategy();
      
      console.log('Indicator Combination Optimizer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize optimizer:', error);
      this.error = error.message || 'Initialization failed';
      throw error;
    }
  }
  
  /**
   * Load historical price data for the symbol
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      // Calculate time range
      const now = new Date();
      const from = new Date();
      from.setDate(from.getDate() - this.historyDays);
      
      // Fetch price history
      const priceHistory = await this.capitalComService.getPriceHistory(
        this.symbol,
        this.timeframe,
        from.getTime(),
        now.getTime()
      );
      
      this.priceData = priceHistory.prices;
      
      console.log(`Loaded ${this.priceData.length} historical price points for optimization`);
    } catch (error) {
      console.error('Failed to load historical data for optimization:', error);
      throw error;
    }
  }
  
  /**
   * Analyze market conditions for optimization
   */
  private async analyzeMarketConditions(): Promise<void> {
    try {
      // Extract price data
      const closes = this.priceData.map(price => price.close);
      const highs = this.priceData.map(price => price.high);
      const lows = this.priceData.map(price => price.low);
      
      // Calculate trend strength (ADX)
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
      
      // Store market analysis
      this.marketAnalysis = {
        regime: marketRegime,
        volatility: volatilityLevel,
        sentiment: marketSentiment,
        adx: recentADX,
        atr: atr[atr.length - 1],
        volatilityPercent: volatility
      };
      
      console.log('Market analysis completed:', this.marketAnalysis);
    } catch (error) {
      console.error('Failed to analyze market conditions:', error);
      throw error;
    }
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
   * Calculate ATR (Average True Range)
   */
  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
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
   * Calculate Simple Moving Average
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
   * Analyze correlations between different indicators
   */
  private analyzeIndicatorCorrelations(): void {
    try {
      // Extract price data
      const closes = this.priceData.map(price => price.close);
      
      // Calculate indicators
      const rsi = this.calculateRSI(closes, 14);
      const macd = this.calculateMACD(closes, 12, 26, 9);
      const fastMA = this.calculateSMA(closes, 9);
      const slowMA = this.calculateSMA(closes, 21);
      const bbUpper = this.calculateBollingerBands(closes, 20, 2).upper;
      const bbLower = this.calculateBollingerBands(closes, 20, 2).lower;
      
      // Align data lengths
      const minLength = Math.min(
        rsi.length,
        macd.length,
        fastMA.length,
        slowMA.length,
        bbUpper.length,
        bbLower.length
      );
      
      const alignedRSI = rsi.slice(-minLength);
      const alignedMACD = macd.slice(-minLength);
      const alignedFastMA = fastMA.slice(-minLength);
      const alignedSlowMA = slowMA.slice(-minLength);
      const alignedBBUpper = bbUpper.slice(-minLength);
      const alignedBBLower = bbLower.slice(-minLength);
      
      // Calculate correlation matrix
      this.correlationMatrix = {
        rsi_macd: this.calculateCorrelation(alignedRSI, alignedMACD),
        rsi_fastMA: this.calculateCorrelation(alignedRSI, alignedFastMA),
        rsi_slowMA: this.calculateCorrelation(alignedRSI, alignedSlowMA),
        rsi_bbUpper: this.calculateCorrelation(alignedRSI, alignedBBUpper),
        rsi_bbLower: this.calculateCorrelation(alignedRSI, alignedBBLower),
        macd_fastMA: this.calculateCorrelation(alignedMACD, alignedFastMA),
        macd_slowMA: this.calculateCorrelation(alignedMACD, alignedSlowMA),
        macd_bbUpper: this.calculateCorrelation(alignedMACD, alignedBBUpper),
        macd_bbLower: this.calculateCorrelation(alignedMACD, alignedBBLower),
        fastMA_slowMA: this.calculateCorrelation(alignedFastMA, alignedSlowMA),
        fastMA_bbUpper: this.calculateCorrelation(alignedFastMA, alignedBBUpper),
        fastMA_bbLower: this.calculateCorrelation(alignedFastMA, alignedBBLower),
        slowMA_bbUpper: this.calculateCorrelation(alignedSlowMA, alignedBBUpper),
        slowMA_bbLower: this.calculateCorrelation(alignedSlowMA, alignedBBLower),
        bbUpper_bbLower: this.calculateCorrelation(alignedBBUpper, alignedBBLower)
      };
      
      console.log('Indicator correlation analysis completed');
    } catch (error) {
      console.error('Failed to analyze indicator correlations:', error);
      this.error = 'Correlation analysis failed';
    }
  }
  
  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(closes: number[], period: number): number[] {
    if (closes.length < period + 1) {
      return [];
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
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(closes: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): number[] {
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
    
    return histogram;
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
  private calculateBollingerBands(closes: number[], period: number, deviation: number): { upper: number[], middle: number[], lower: number[] } {
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
   * Calculate correlation between two data series
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length) {
      throw new Error('Data series must have the same length');
    }
    
    const n = x.length;
    
    // Calculate means
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate covariance and standard deviations
    let covariance = 0;
    let varX = 0;
    let varY = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      
      covariance += diffX * diffY;
      varX += diffX * diffX;
      varY += diffY * diffY;
    }
    
    // Calculate correlation coefficient
    const correlation = covariance / (Math.sqrt(varX) * Math.sqrt(varY));
    
    return correlation;
  }
  
  /**
   * Generate indicator combination rules based on market conditions and correlations
   */
  private generateCombinationRules(): void {
    try {
      // Default weights
      let rsiWeight = 0.25;
      let macdWeight = 0.25;
      let maWeight = 0.25;
      let bbWeight = 0.25;
      
      // Adjust based on market regime
      if (this.marketAnalysis) {
        switch (this.marketAnalysis.regime) {
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
            // In volatile markets, favor Bollinger Bands and ATR
            bbWeight = 0.40;
            rsiWeight = 0.20;
            macdWeight = 0.20;
            maWeight = 0.20;
            break;
        }
        
        // Adjust based on volatility
        if (this.marketAnalysis.volatility === 'high') {
          // In high volatility, increase Bollinger Bands weight
          bbWeight += 0.05;
          rsiWeight -= 0.05;
        } else if (this.marketAnalysis.volatility === 'low') {
          // In low volatility, increase RSI weight
          rsiWeight += 0.05;
          bbWeight -= 0.05;
        }
        
        // Adjust based on sentiment
        if (this.marketAnalysis.sentiment === 'bullish') {
          // In bullish markets, slightly favor MA and MACD
          maWeight += 0.05;
          macdWeight += 0.05;
          rsiWeight -= 0.05;
          bbWeight -= 0.05;
        } else if (this.marketAnalysis.sentiment === 'bearish') {
          // In bearish markets, slightly favor RSI and Bollinger Bands
          rsiWeight += 0.05;
          bbWeight += 0.05;
          maWeight -= 0.05;
          macdWeight -= 0.05;
        }
      }
      
      // Adjust based on correlations
      if (this.correlationMatrix) {
        // If RSI and MACD are highly correlated, reduce one of them
        if (Math.abs(this.correlationMatrix.rsi_macd) > 0.7) {
          if (rsiWeight > macdWeight) {
            rsiWeight -= 0.05;
            bbWeight += 0.05;
          } else {
            macdWeight -= 0.05;
            bbWeight += 0.05;
          }
        }
        
        // If fast and slow MAs are highly correlated, reduce MA weight
        if (Math.abs(this.correlationMatrix.fastMA_slowMA) > 0.9) {
          maWeight -= 0.05;
          
          // Distribute to least correlated indicator
          const correlations = [
            { indicator: 'rsi', value: Math.abs(this.correlationMatrix.rsi_fastMA) },
            { indicator: 'macd', value: Math.abs(this.correlationMatrix.macd_fastMA) },
            { indicator: 'bb', value: Math.abs(this.correlationMatrix.fastMA_bbUpper) }
          ];
          
          correlations.sort((a, b) => a.value - b.value);
          
          switch (correlations[0].indicator) {
            case 'rsi':
              rsiWeight += 0.05;
              break;
            case 'macd':
              macdWeight += 0.05;
              break;
            case 'bb':
              bbWeight += 0.05;
              break;
          }
        }
      }
      
      // Normalize weights to ensure they sum to 1
      const totalWeight = rsiWeight + macdWeight + maWeight + bbWeight;
      rsiWeight = rsiWeight / totalWeight;
      macdWeight = macdWeight / totalWeight;
      maWeight = maWeight / totalWeight;
      bbWeight = bbWeight / totalWeight;
      
      // Generate signal combination rules
      this.combinationRules = {
        weights: {
          rsi: rsiWeight,
          macd: macdWeight,
          ma: maWeight,
          bb: bbWeight
        },
        thresholds: {
          buy: 0.5,  // Composite signal threshold for buy
          sell: -0.5 // Composite signal threshold for sell
        },
        confirmationRules: []
      };
      
      // Add confirmation rules based on market regime
      if (this.marketAnalysis) {
        switch (this.marketAnalysis.regime) {
          case 'trending':
            // In trending markets, require trend confirmation
            this.combinationRules.confirmationRules.push({
              name: 'trendConfirmation',
              description: 'In trending markets, MA crossover must confirm the signal',
              logic: 'if (signal > 0 && fastMA <= slowMA) return false; if (signal < 0 && fastMA >= slowMA) return false;'
            });
            break;
          case 'ranging':
            // In ranging markets, require RSI confirmation
            this.combinationRules.confirmationRules.push({
              name: 'rangeConfirmation',
              description: 'In ranging markets, RSI must be in extreme zones',
              logic: 'if (signal > 0 && rsi > 40) return false; if (signal < 0 && rsi < 60) return false;'
            });
            break;
          case 'volatile':
            // In volatile markets, require stronger signals
            this.combinationRules.thresholds.buy = 0.6;
            this.combinationRules.thresholds.sell = -0.6;
            this.combinationRules.confirmationRules.push({
              name: 'volatilityConfirmation',
              description: 'In volatile markets, require stronger signals',
              logic: 'if (Math.abs(signal) < 0.6) return false;'
            });
            break;
        }
      }
      
      console.log('Generated indicator combination rules:', this.combinationRules);
    } catch (error) {
      console.error('Failed to generate combination rules:', error);
      this.error = 'Rule generation failed';
    }
  }
  
  /**
   * Optimize strategy parameters based on historical data
   */
  private async optimizeStrategy(): Promise<void> {
    try {
      this.isOptimizing = true;
      
      console.log(`Starting strategy optimization using ${this.optimizationMethod} method`);
      
      // Determine parameter ranges for optimization
      const parameterRanges = this.getParameterRanges();
      
      // Run optimization based on selected method
      let optimizedParameters;
      
      switch (this.optimizationMethod) {
        case 'walkForward':
          optimizedParameters = await this.runWalkForwardOptimization(parameterRanges);
          break;
        case 'genetic':
          optimizedParameters = await this.runGeneticOptimization(parameterRanges);
          break;
        case 'gridSearch':
        default:
          optimizedParameters = await this.runGridSearchOptimization(parameterRanges);
          break;
      }
      
      // Store optimized parameters
      this.optimizedParameters = optimizedParameters;
      
      // Update last optimization time
      this.lastOptimizationTime = Date.now();
      
      console.log('Strategy optimization completed:', this.optimizedParameters);
      
      this.isOptimizing = false;
    } catch (error) {
      console.error('Strategy optimization failed:', error);
      this.error = 'Optimization failed: ' + error.message;
      this.isOptimizing = false;
      throw error;
    }
  }
  
  /**
   * Get parameter ranges for optimization based on market conditions
   */
  private getParameterRanges(): any {
    // Default parameter ranges
    const ranges = {
      // RSI parameters
      rsiPeriod: { min: 8, max: 20, step: 2 },
      overboughtThreshold: { min: 65, max: 80, step: 5 },
      oversoldThreshold: { min: 20, max: 35, step: 5 },
      
      // Moving Average parameters
      fastMAPeriod: { min: 5, max: 15, step: 2 },
      slowMAPeriod: { min: 15, max: 30, step: 5 },
      
      // MACD parameters
      macdFastPeriod: { min: 8, max: 16, step: 2 },
      macdSlowPeriod: { min: 20, max: 32, step: 4 },
      macdSignalPeriod: { min: 7, max: 12, step: 1 },
      
      // Bollinger Bands parameters
      bbPeriod: { min: 15, max: 25, step: 5 },
      bbDeviation: { min: 1.5, max: 2.5, step: 0.5 },
      
      // ATR parameters
      atrPeriod: { min: 10, max: 20, step: 2 },
      
      // Risk management
      stopLossPercent: { min: 0.5, max: 2.0, step: 0.5 },
      takeProfitPercent: { min: 1.0, max: 4.0, step: 1.0 }
    };
    
    // Adjust ranges based on market conditions
    if (this.marketAnalysis) {
      switch (this.marketAnalysis.regime) {
        case 'trending':
          // In trending markets, favor longer periods for trend following
          ranges.rsiPeriod.min = 12;
          ranges.fastMAPeriod.min = 8;
          ranges.slowMAPeriod.min = 20;
          ranges.takeProfitPercent.max = 5.0; // Allow larger take profits in trends
          break;
        case 'ranging':
          // In ranging markets, favor shorter periods for oscillators
          ranges.rsiPeriod.max = 14;
          ranges.bbPeriod.min = 10;
          ranges.takeProfitPercent.min = 0.8; // Smaller take profits in ranges
          ranges.takeProfitPercent.max = 2.0;
          break;
        case 'volatile':
          // In volatile markets, adjust risk parameters
          ranges.bbDeviation.min = 2.0; // Wider Bollinger Bands
          ranges.bbDeviation.max = 3.0;
          ranges.stopLossPercent.min = 1.0; // Wider stops
          ranges.stopLossPercent.max = 3.0;
          break;
      }
      
      // Adjust based on volatility
      if (this.marketAnalysis.volatility === 'high') {
        ranges.stopLossPercent.min = 1.5;
        ranges.stopLossPercent.max = 3.0;
      } else if (this.marketAnalysis.volatility === 'low') {
        ranges.stopLossPercent.min = 0.5;
        ranges.stopLossPercent.max = 1.5;
      }
    }
    
    return ranges;
  }
  
  /**
   * Run walk-forward optimization
   * @param parameterRanges Parameter ranges for optimization
   */
  private async runWalkForwardOptimization(parameterRanges: any): Promise<any> {
    console.log('Running walk-forward optimization');
    
    // Divide historical data into in-sample and out-of-sample periods
    const totalBars = this.priceData.length;
    const numWindows = 3; // Number of optimization windows
    const windowSize = Math.floor(totalBars / numWindows);
    
    let bestParameters = null;
    let bestPerformance = -Infinity;
    
    // For each window, optimize on in-sample and validate on out-of-sample
    for (let i = 0; i < numWindows - 1; i++) {
      const inSampleStart = i * windowSize;
      const inSampleEnd = (i + 1) * windowSize;
      const outOfSampleStart = inSampleEnd;
      const outOfSampleEnd = (i + 2) * windowSize;
      
      const inSampleData = this.priceData.slice(inSampleStart, inSampleEnd);
      const outOfSampleData = this.priceData.slice(outOfSampleStart, outOfSampleEnd);
      
      // Run grid search on in-sample data
      const candidateParameters = await this.runGridSearchOptimization(
        parameterRanges,
        inSampleData
      );
      
      // Evaluate on out-of-sample data
      const performance = this.evaluateStrategy(candidateParameters, outOfSampleData);
      
      // Track best parameters across all windows
      if (performance.performanceMetric > bestPerformance) {
        bestPerformance = performance.performanceMetric;
        bestParameters = candidateParameters;
      }
    }
    
    return bestParameters;
  }
  
  /**
   * Run genetic algorithm optimization
   * @param parameterRanges Parameter ranges for optimization
   */
  private async runGeneticOptimization(parameterRanges: any): Promise<any> {
    console.log('Running genetic algorithm optimization');
    
    // Genetic algorithm parameters
    const populationSize = 20;
    const generations = 5;
    const mutationRate = 0.1;
    const eliteCount = 2;
    
    // Generate initial population
    let population = this.generateInitialPopulation(parameterRanges, populationSize);
    
    // Evaluate initial population
    let populationFitness = await Promise.all(
      population.map(individual => this.evaluateStrategy(individual))
    );
    
    // Sort by fitness
    let sortedPopulation = population
      .map((individual, index) => ({
        individual,
        fitness: populationFitness[index].performanceMetric
      }))
      .sort((a, b) => b.fitness - a.fitness);
    
    // Run generations
    for (let gen = 0; gen < generations; gen++) {
      console.log(`Generation ${gen + 1}/${generations}`);
      
      // Select elite individuals
      const elites = sortedPopulation.slice(0, eliteCount).map(item => item.individual);
      
      // Create new population through selection, crossover, and mutation
      const newPopulation = [...elites];
      
      while (newPopulation.length < populationSize) {
        // Tournament selection
        const parent1 = this.tournamentSelection(sortedPopulation);
        const parent2 = this.tournamentSelection(sortedPopulation);
        
        // Crossover
        const child = this.crossover(parent1, parent2);
        
        // Mutation
        this.mutate(child, parameterRanges, mutationRate);
        
        newPopulation.push(child);
      }
      
      // Replace population
      population = newPopulation;
      
      // Evaluate new population
      populationFitness = await Promise.all(
        population.map(individual => this.evaluateStrategy(individual))
      );
      
      // Sort by fitness
      sortedPopulation = population
        .map((individual, index) => ({
          individual,
          fitness: populationFitness[index].performanceMetric
        }))
        .sort((a, b) => b.fitness - a.fitness);
      
      console.log(`Best fitness: ${sortedPopulation[0].fitness}`);
    }
    
    // Return best individual
    return sortedPopulation[0].individual;
  }
  
  /**
   * Generate initial population for genetic algorithm
   */
  private generateInitialPopulation(parameterRanges: any, size: number): any[] {
    const population = [];
    
    for (let i = 0; i < size; i++) {
      const individual = {};
      
      // Generate random values for each parameter
      for (const [param, range] of Object.entries(parameterRanges)) {
        if (typeof range.min === 'number' && typeof range.max === 'number') {
          if (Number.isInteger(range.min) && Number.isInteger(range.max)) {
            // Integer parameter
            individual[param] = Math.floor(
              range.min + Math.random() * (range.max - range.min + 1)
            );
          } else {
            // Float parameter
            individual[param] = range.min + Math.random() * (range.max - range.min);
            // Round to 2 decimal places
            individual[param] = Math.round(individual[param] * 100) / 100;
          }
        }
      }
      
      // Add fixed parameters
      individual['symbol'] = this.symbol;
      individual['timeframe'] = this.timeframe;
      individual['positionSize'] = 1.0;
      individual['enableAutoTrading'] = false;
      individual['rsiWeight'] = 0.25;
      individual['macdWeight'] = 0.25;
      individual['maWeight'] = 0.25;
      individual['bbWeight'] = 0.25;
      
      population.push(individual);
    }
    
    return population;
  }
  
  /**
   * Tournament selection for genetic algorithm
   */
  private tournamentSelection(sortedPopulation: any[]): any {
    const tournamentSize = 3;
    const tournament = [];
    
    // Select random individuals for tournament
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * sortedPopulation.length);
      tournament.push(sortedPopulation[randomIndex]);
    }
    
    // Return the fittest individual from tournament
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0].individual;
  }
  
  /**
   * Crossover operation for genetic algorithm
   */
  private crossover(parent1: any, parent2: any): any {
    const child = {};
    
    // For each parameter, randomly select from either parent
    for (const param in parent1) {
      if (Math.random() < 0.5) {
        child[param] = parent1[param];
      } else {
        child[param] = parent2[param];
      }
    }
    
    return child;
  }
  
  /**
   * Mutation operation for genetic algorithm
   */
  private mutate(individual: any, parameterRanges: any, mutationRate: number): void {
    for (const param in parameterRanges) {
      if (Math.random() < mutationRate) {
        const range = parameterRanges[param];
        
        if (typeof range.min === 'number' && typeof range.max === 'number') {
          if (Number.isInteger(range.min) && Number.isInteger(range.max)) {
            // Integer parameter
            individual[param] = Math.floor(
              range.min + Math.random() * (range.max - range.min + 1)
            );
          } else {
            // Float parameter
            individual[param] = range.min + Math.random() * (range.max - range.min);
            // Round to 2 decimal places
            individual[param] = Math.round(individual[param] * 100) / 100;
          }
        }
      }
    }
  }
  
  /**
   * Run grid search optimization
   * @param parameterRanges Parameter ranges for optimization
   * @param data Optional data to use for optimization (defaults to this.priceData)
   */
  private async runGridSearchOptimization(parameterRanges: any, data?: any[]): Promise<any> {
    console.log('Running grid search optimization');
    
    const priceData = data || this.priceData;
    
    // Generate parameter combinations
    const parameterCombinations = this.generateParameterCombinations(parameterRanges);
    
    console.log(`Testing ${parameterCombinations.length} parameter combinations`);
    
    // Evaluate each combination
    const results = [];
    
    for (let i = 0; i < parameterCombinations.length; i++) {
      const parameters = parameterCombinations[i];
      const performance = await this.evaluateStrategy(parameters, priceData);
      
      results.push({
        parameters,
        performance: performance.performanceMetric,
        metrics: performance
      });
      
      // Log progress
      if ((i + 1) % 10 === 0 || i === parameterCombinations.length - 1) {
        console.log(`Evaluated ${i + 1}/${parameterCombinations.length} combinations`);
      }
    }
    
    // Sort by performance metric
    results.sort((a, b) => b.performance - a.performance);
    
    // Return best parameters
    return results[0].parameters;
  }
  
  /**
   * Generate parameter combinations for grid search
   */
  private generateParameterCombinations(parameterRanges: any): any[] {
    // For simplicity, we'll use a reduced set of parameters to avoid combinatorial explosion
    const keyParameters = [
      'rsiPeriod',
      'overboughtThreshold',
      'oversoldThreshold',
      'fastMAPeriod',
      'slowMAPeriod'
    ];
    
    // Generate combinations for key parameters
    const combinations = [];
    
    // Start with a base configuration
    const baseConfig = {
      symbol: this.symbol,
      timeframe: this.timeframe,
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
    
    // Generate variations of the base config
    for (const param of keyParameters) {
      const range = parameterRanges[param];
      
      for (let value = range.min; value <= range.max; value += range.step) {
        const config = { ...baseConfig };
        config[param] = value;
        combinations.push(config);
      }
    }
    
    // Add some combined variations for important parameter pairs
    // RSI thresholds
    for (let overbought = parameterRanges.overboughtThreshold.min; 
         overbought <= parameterRanges.overboughtThreshold.max; 
         overbought += parameterRanges.overboughtThreshold.step) {
      
      for (let oversold = parameterRanges.oversoldThreshold.min; 
           oversold <= parameterRanges.oversoldThreshold.max; 
           oversold += parameterRanges.oversoldThreshold.step) {
        
        if (overbought > oversold) {
          const config = { ...baseConfig };
          config.overboughtThreshold = overbought;
          config.oversoldThreshold = oversold;
          combinations.push(config);
        }
      }
    }
    
    // MA periods
    for (let fast = parameterRanges.fastMAPeriod.min; 
         fast <= parameterRanges.fastMAPeriod.max; 
         fast += parameterRanges.fastMAPeriod.step) {
      
      for (let slow = parameterRanges.slowMAPeriod.min; 
           slow <= parameterRanges.slowMAPeriod.max; 
           slow += parameterRanges.slowMAPeriod.step) {
        
        if (slow > fast) {
          const config = { ...baseConfig };
          config.fastMAPeriod = fast;
          config.slowMAPeriod = slow;
          combinations.push(config);
        }
      }
    }
    
    return combinations;
  }
  
  /**
   * Evaluate strategy performance with given parameters
   * @param parameters Strategy parameters to evaluate
   * @param data Optional data to use for evaluation (defaults to this.priceData)
   */
  private async evaluateStrategy(parameters: any, data?: any[]): Promise<any> {
    const priceData = data || this.priceData;
    
    // Create a strategy instance with the parameters
    const strategy = new MultiIndicatorStrategy(this.capitalComService, parameters);
    
    // Backtest the strategy
    const results = this.backtest(strategy, priceData);
    
    // Calculate performance metric based on optimization criteria
    let performanceMetric = 0;
    
    switch (this.optimizationMetric) {
      case 'profitFactor':
        performanceMetric = results.profitFactor;
        break;
      case 'winRate':
        performanceMetric = results.winRate;
        break;
      case 'netProfit':
        performanceMetric = results.netProfit;
        break;
      case 'sharpeRatio':
        performanceMetric = results.sharpeRatio;
        break;
    }
    
    return {
      ...results,
      performanceMetric
    };
  }
  
  /**
   * Backtest a strategy on historical data
   * @param strategy Strategy instance to backtest
   * @param data Price data for backtesting
   */
  private backtest(strategy: MultiIndicatorStrategy, data: any[]): any {
    // This is a simplified backtest implementation
    // In a real system, this would be much more comprehensive
    
    // Initialize results
    const trades = [];
    let winCount = 0;
    let lossCount = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let equity = 10000; // Starting equity
    const equityCurve = [equity];
    
    // Extract closes for indicator calculation
    const closes = data.map(price => price.close);
    
    // Calculate indicators
    const rsi = this.calculateRSI(closes, strategy['rsiPeriod']);
    const macd = this.calculateMACD(
      closes, 
      strategy['macdFastPeriod'], 
      strategy['macdSlowPeriod'], 
      strategy['macdSignalPeriod']
    );
    const fastMA = this.calculateSMA(closes, strategy['fastMAPeriod']);
    const slowMA = this.calculateSMA(closes, strategy['slowMAPeriod']);
    const bb = this.calculateBollingerBands(
      closes, 
      strategy['bbPeriod'], 
      strategy['bbDeviation']
    );
    
    // Align data lengths
    const minLength = Math.min(
      rsi.length,
      macd.length,
      fastMA.length,
      slowMA.length,
      bb.upper.length
    );
    
    // Simulate trading
    let position = null;
    
    for (let i = 1; i < minLength; i++) {
      const currentRSI = rsi[i];
      const previousRSI = rsi[i - 1];
      const currentMACD = macd[i];
      const previousMACD = macd[i - 1];
      const currentFastMA = fastMA[i];
      const previousFastMA = fastMA[i - 1];
      const currentSlowMA = slowMA[i];
      const previousSlowMA = slowMA[i - 1];
      const currentBB = {
        upper: bb.upper[i],
        middle: bb.middle[i],
        lower: bb.lower[i]
      };
      const currentPrice = closes[closes.length - minLength + i];
      
      // Calculate individual indicator signals
      // RSI Signal: -1 (sell), 0 (neutral), 1 (buy)
      let rsiSignal = 0;
      if (previousRSI < strategy['oversoldThreshold'] && currentRSI >= strategy['oversoldThreshold']) {
        rsiSignal = 1; // Buy signal
      } else if (previousRSI > strategy['overboughtThreshold'] && currentRSI <= strategy['overboughtThreshold']) {
        rsiSignal = -1; // Sell signal
      }
      
      // MACD Signal: -1 (sell), 0 (neutral), 1 (buy)
      let macdSignal = 0;
      if (previousMACD < 0 && currentMACD >= 0) {
        macdSignal = 1; // Buy signal (histogram crosses above zero)
      } else if (previousMACD > 0 && currentMACD <= 0) {
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
        (rsiSignal * strategy['rsiWeight']) + 
        (macdSignal * strategy['macdWeight']) + 
        (maSignal * strategy['maWeight']) + 
        (bbSignal * strategy['bbWeight']);
      
      // Trading logic
      if (!position) {
        // No position, check for entry
        if (compositeSignal >= 0.5) {
          // Buy signal
          position = {
            type: 'buy',
            entryPrice: currentPrice,
            entryIndex: i,
            stopLoss: currentPrice * (1 - strategy['stopLossPercent'] / 100),
            takeProfit: currentPrice * (1 + strategy['takeProfitPercent'] / 100)
          };
        } else if (compositeSignal <= -0.5) {
          // Sell signal
          position = {
            type: 'sell',
            entryPrice: currentPrice,
            entryIndex: i,
            stopLoss: currentPrice * (1 + strategy['stopLossPercent'] / 100),
            takeProfit: currentPrice * (1 - strategy['takeProfitPercent'] / 100)
          };
        }
      } else {
        // Check for exit
        let exitReason = null;
        let exitPrice = currentPrice;
        
        if (position.type === 'buy') {
          // Check stop loss
          if (currentPrice <= position.stopLoss) {
            exitReason = 'stopLoss';
          }
          // Check take profit
          else if (currentPrice >= position.takeProfit) {
            exitReason = 'takeProfit';
          }
          // Check for reversal signal
          else if (compositeSignal <= -0.5) {
            exitReason = 'signal';
          }
        } else { // position.type === 'sell'
          // Check stop loss
          if (currentPrice >= position.stopLoss) {
            exitReason = 'stopLoss';
          }
          // Check take profit
          else if (currentPrice <= position.takeProfit) {
            exitReason = 'takeProfit';
          }
          // Check for reversal signal
          else if (compositeSignal >= 0.5) {
            exitReason = 'signal';
          }
        }
        
        // If we have an exit reason, close the position
        if (exitReason) {
          // Calculate profit/loss
          const priceDiff = position.type === 'buy'
            ? exitPrice - position.entryPrice
            : position.entryPrice - exitPrice;
          
          const profitLoss = priceDiff / position.entryPrice * 100; // Percentage
          
          // Record trade
          trades.push({
            type: position.type,
            entryPrice: position.entryPrice,
            exitPrice: exitPrice,
            entryIndex: position.entryIndex,
            exitIndex: i,
            profitLoss: profitLoss,
            exitReason: exitReason
          });
          
          // Update statistics
          if (profitLoss > 0) {
            winCount++;
            totalProfit += profitLoss;
          } else {
            lossCount++;
            totalLoss += Math.abs(profitLoss);
          }
          
          // Update equity
          equity = equity * (1 + profitLoss / 100);
          equityCurve.push(equity);
          
          // Reset position
          position = null;
        }
      }
    }
    
    // Calculate performance metrics
    const totalTrades = winCount + lossCount;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    const netProfit = totalProfit - totalLoss;
    
    // Calculate Sharpe ratio
    let sharpeRatio = 0;
    if (equityCurve.length > 1) {
      const returns = [];
      for (let i = 1; i < equityCurve.length; i++) {
        returns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1]);
      }
      
      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const stdDev = Math.sqrt(
        returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length
      );
      
      sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    }
    
    return {
      totalTrades,
      winCount,
      lossCount,
      winRate,
      totalProfit,
      totalLoss,
      netProfit,
      profitFactor,
      sharpeRatio,
      finalEquity: equity,
      trades
    };
  }
  
  /**
   * Get optimized parameters
   */
  public getOptimizedParameters(): any {
    return this.optimizedParameters;
  }
  
  /**
   * Get market analysis
   */
  public getMarketAnalysis(): any {
    return this.marketAnalysis;
  }
  
  /**
   * Get indicator correlation matrix
   */
  public getCorrelationMatrix(): any {
    return this.correlationMatrix;
  }
  
  /**
   * Get indicator combination rules
   */
  public getCombinationRules(): any {
    return this.combinationRules;
  }
  
  /**
   * Get optimization status
   */
  public getStatus(): any {
    return {
      isOptimizing: this.isOptimizing,
      lastOptimizationTime: this.lastOptimizationTime,
      error: this.error
    };
  }
}

/**
 * React hook for using the indicator combination optimizer
 * @param config Optimizer configuration
 * @returns Optimizer controller
 */
export const useIndicatorCombinationOptimizer = (config: StrategyOptimizerProps) => {
  const [optimizer, setOptimizer] = useState<IndicatorCombinationOptimizer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedParameters, setOptimizedParameters] = useState<any>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<any>(null);
  const [combinationRules, setCombinationRules] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize optimizer
  const initializeOptimizer = async (capitalComService: CapitalComService) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create and initialize optimizer
      const optimizerInstance = new IndicatorCombinationOptimizer(capitalComService, config);
      await optimizerInstance.initialize();
      
      setOptimizer(optimizerInstance);
      setOptimizedParameters(optimizerInstance.getOptimizedParameters());
      setMarketAnalysis(optimizerInstance.getMarketAnalysis());
      setCorrelationMatrix(optimizerInstance.getCorrelationMatrix());
      setCombinationRules(optimizerInstance.getCombinationRules());
      setIsInitialized(true);
      setIsLoading(false);
      
      // Set up auto-update if enabled
      if (config.enableAutoUpdate) {
        const updateInterval = setInterval(() => {
          if (optimizerInstance) {
            const status = optimizerInstance.getStatus();
            if (!status.isOptimizing) {
              setOptimizedParameters(optimizerInstance.getOptimizedParameters());
              setMarketAnalysis(optimizerInstance.getMarketAnalysis());
              setCorrelationMatrix(optimizerInstance.getCorrelationMatrix());
              setCombinationRules(optimizerInstance.getCombinationRules());
            }
          }
        }, 60000); // Update every minute
        
        return () => {
          clearInterval(updateInterval);
        };
      }
    } catch (error) {
      console.error('Failed to initialize optimizer:', error);
      setError(error.message || 'Initialization failed');
      setIsLoading(false);
    }
  };
  
  return {
    initializeOptimizer,
    isInitialized,
    isLoading,
    optimizedParameters,
    marketAnalysis,
    correlationMatrix,
    combinationRules,
    error
  };
};

export default useIndicatorCombinationOptimizer;
