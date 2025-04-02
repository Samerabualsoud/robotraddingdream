import { useState, useEffect } from 'react';
import CapitalComService from './CapitalComService';
import CapitalComWebSocket from './CapitalComWebSocket';
import { TradingStrategyProps } from './AdaptiveRsiStrategy';

// Enhanced machine learning model for strategy optimization
export class EnhancedStrategyOptimizer {
  private capitalComService: CapitalComService;
  private symbol: string;
  private timeframe: string;
  private historicalData: any[] = [];
  private trainingResults: any[] = [];
  private optimizedParameters: any = {};
  private marketRegime: 'trending' | 'ranging' | 'volatile' = 'ranging';
  private volatilityLevel: 'low' | 'medium' | 'high' = 'medium';
  private correlationMatrix: Map<string, number> = new Map();
  private marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  constructor(capitalComService: CapitalComService, symbol: string, timeframe: string) {
    this.capitalComService = capitalComService;
    this.symbol = symbol;
    this.timeframe = timeframe;
  }
  
  /**
   * Initialize the optimizer with historical data
   */
  public async initialize(): Promise<void> {
    try {
      // Load extensive historical data for training
      await this.loadHistoricalData();
      
      // Analyze market conditions
      this.analyzeMarketRegime();
      this.calculateVolatility();
      await this.analyzeCorrelations();
      await this.analyzeSentiment();
      
      // Train the model with historical data
      await this.trainModel();
      
      console.log('Strategy optimizer initialized successfully');
      console.log('Market regime:', this.marketRegime);
      console.log('Volatility level:', this.volatilityLevel);
      console.log('Market sentiment:', this.marketSentiment);
    } catch (error) {
      console.error('Failed to initialize strategy optimizer:', error);
      throw error;
    }
  }
  
  /**
   * Load extensive historical data for training
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      // Calculate time range based on timeframe
      const now = new Date();
      let from = new Date();
      
      // Get at least 6 months of data for proper training
      from.setMonth(from.getMonth() - 6);
      
      // Fetch price history
      const priceHistory = await this.capitalComService.getPriceHistory(
        this.symbol,
        this.timeframe,
        from.getTime(),
        now.getTime()
      );
      
      this.historicalData = priceHistory.prices;
      
      console.log(`Loaded ${this.historicalData.length} historical data points for training`);
    } catch (error) {
      console.error('Failed to load historical data for training:', error);
      throw error;
    }
  }
  
  /**
   * Analyze market regime (trending, ranging, volatile)
   */
  private analyzeMarketRegime(): void {
    if (this.historicalData.length < 20) {
      console.warn('Not enough data to analyze market regime');
      return;
    }
    
    try {
      // Calculate ADX (Average Directional Index) to determine trend strength
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
      
      console.log(`Market regime analysis: ADX=${recentADX.toFixed(2)}, Volatility=${volatility.toFixed(2)}, Regime=${this.marketRegime}`);
    } catch (error) {
      console.error('Error analyzing market regime:', error);
      this.marketRegime = 'ranging'; // Default to ranging if analysis fails
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
    if (this.historicalData.length <= period + 1) {
      return adxValues;
    }
    
    try {
      // Calculate +DI and -DI
      const plusDM: number[] = [];
      const minusDM: number[] = [];
      const trueRange: number[] = [];
      
      // Calculate initial values
      for (let i = 1; i < this.historicalData.length; i++) {
        const high = this.historicalData[i].high;
        const low = this.historicalData[i].low;
        const prevHigh = this.historicalData[i-1].high;
        const prevLow = this.historicalData[i-1].low;
        const prevClose = this.historicalData[i-1].close;
        
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
   * Calculate volatility level
   */
  private calculateVolatility(): void {
    if (this.historicalData.length < 20) {
      console.warn('Not enough data to calculate volatility');
      return;
    }
    
    try {
      const volatility = this.calculateVolatilityMetric();
      
      // Determine volatility level
      if (volatility < 0.8) {
        this.volatilityLevel = 'low';
      } else if (volatility > 1.5) {
        this.volatilityLevel = 'high';
      } else {
        this.volatilityLevel = 'medium';
      }
      
      console.log(`Volatility analysis: Metric=${volatility.toFixed(2)}, Level=${this.volatilityLevel}`);
    } catch (error) {
      console.error('Error calculating volatility:', error);
      this.volatilityLevel = 'medium'; // Default to medium if calculation fails
    }
  }
  
  /**
   * Calculate volatility metric (normalized ATR)
   * @returns Volatility metric
   */
  private calculateVolatilityMetric(): number {
    // Calculate Average True Range (ATR)
    const period = 14;
    const trueRanges: number[] = [];
    
    for (let i = 1; i < this.historicalData.length; i++) {
      const high = this.historicalData[i].high;
      const low = this.historicalData[i].low;
      const prevClose = this.historicalData[i-1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate ATR
    const atr = trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
    
    // Normalize ATR by dividing by average price
    const avgPrice = this.historicalData.slice(-period).reduce((sum, price) => sum + price.close, 0) / period;
    
    return (atr / avgPrice) * 100;
  }
  
  /**
   * Analyze correlations with other markets
   */
  private async analyzeCorrelations(): Promise<void> {
    try {
      // List of related symbols to check for correlation
      const relatedSymbols = this.getRelatedSymbols(this.symbol);
      
      if (relatedSymbols.length === 0) {
        console.log('No related symbols to analyze correlations');
        return;
      }
      
      // Get current time range
      const endTime = new Date();
      const startTime = new Date();
      startTime.setMonth(startTime.getMonth() - 1); // 1 month of data
      
      // Get price data for main symbol
      const mainPrices = this.historicalData.map(price => price.close);
      
      // Calculate correlations with each related symbol
      for (const symbol of relatedSymbols) {
        try {
          const priceHistory = await this.capitalComService.getPriceHistory(
            symbol,
            this.timeframe,
            startTime.getTime(),
            endTime.getTime()
          );
          
          const relatedPrices = priceHistory.prices.map(price => price.close);
          
          // Use the shorter length of the two arrays
          const length = Math.min(mainPrices.length, relatedPrices.length);
          
          // Calculate correlation coefficient
          const correlation = this.calculateCorrelation(
            mainPrices.slice(-length),
            relatedPrices.slice(-length)
          );
          
          this.correlationMatrix.set(symbol, correlation);
          
          console.log(`Correlation between ${this.symbol} and ${symbol}: ${correlation.toFixed(2)}`);
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      }
    } catch (error) {
      console.error('Error analyzing correlations:', error);
    }
  }
  
  /**
   * Get related symbols for correlation analysis
   * @param symbol Main symbol
   * @returns Array of related symbols
   */
  private getRelatedSymbols(symbol: string): string[] {
    // Map of related symbols for common forex pairs
    const relatedSymbolsMap: Record<string, string[]> = {
      'EURUSD': ['GBPUSD', 'USDCHF', 'EURGBP', 'EURJPY'],
      'GBPUSD': ['EURUSD', 'USDCHF', 'EURGBP', 'GBPJPY'],
      'USDJPY': ['EURJPY', 'GBPJPY', 'AUDJPY', 'EURUSD'],
      'AUDUSD': ['NZDUSD', 'USDCAD', 'EURUSD', 'GBPUSD'],
      'USDCAD': ['AUDUSD', 'NZDUSD', 'EURUSD', 'GBPUSD'],
      'USDCHF': ['EURUSD', 'GBPUSD', 'EURCHF', 'GBPCHF'],
      'NZDUSD': ['AUDUSD', 'USDCAD', 'EURUSD', 'GBPUSD'],
      'EURGBP': ['EURUSD', 'GBPUSD', 'GBPJPY', 'EURJPY'],
      'EURJPY': ['USDJPY', 'GBPJPY', 'EURUSD', 'EURGBP'],
      'GBPJPY': ['USDJPY', 'EURJPY', 'GBPUSD', 'EURGBP'],
      'GOLD': ['SILVER', 'USDCHF', 'EURUSD', 'USDJPY'],
      'SILVER': ['GOLD', 'USDCHF', 'EURUSD', 'USDJPY'],
      'BTCUSD': ['ETHUSD', 'GOLD', 'USDJPY', 'EURUSD'],
      'ETHUSD': ['BTCUSD', 'GOLD', 'USDJPY', 'EURUSD']
    };
    
    return relatedSymbolsMap[symbol] || [];
  }
  
  /**
   * Calculate correlation coefficient between two arrays
   * @param x First array
   * @param y Second array
   * @returns Correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / x.length;
    const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
    
    // Calculate covariance and variances
    let covariance = 0;
    let xVariance = 0;
    let yVariance = 0;
    
    for (let i = 0; i < x.length; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      
      covariance += xDiff * yDiff;
      xVariance += xDiff * xDiff;
      yVariance += yDiff * yDiff;
    }
    
    // Calculate correlation coefficient
    if (xVariance === 0 || yVariance === 0) {
      return 0;
    }
    
    return covariance / (Math.sqrt(xVariance) * Math.sqrt(yVariance));
  }
  
  /**
   * Analyze market sentiment
   */
  private async analyzeSentiment(): Promise<void> {
    try {
      // Simple sentiment analysis based on price action
      const prices = this.historicalData.map(price => price.close);
      
      // Use last 20 periods for sentiment analysis
      const recentPrices = prices.slice(-20);
      
      // Calculate simple moving averages
      const sma5 = this.calculateSMA(prices, 5);
      const sma20 = this.calculateSMA(prices, 20);
      
      // Count bullish and bearish candles
      let bullishCount = 0;
      let bearishCount = 0;
      
      for (let i = 1; i < recentPrices.length; i++) {
        if (recentPrices[i] > recentPrices[i-1]) {
          bullishCount++;
        } else if (recentPrices[i] < recentPrices[i-1]) {
          bearishCount++;
        }
      }
      
      // Determine sentiment based on price action and moving averages
      const latestSMA5 = sma5[sma5.length - 1];
      const latestSMA20 = sma20[sma20.length - 1];
      
      if (latestSMA5 > latestSMA20 && bullishCount > bearishCount) {
        this.marketSentiment = 'bullish';
      } else if (latestSMA5 < latestSMA20 && bearishCount > bullishCount) {
        this.marketSentiment = 'bearish';
      } else {
        this.marketSentiment = 'neutral';
      }
      
      console.log(`Sentiment analysis: Bullish=${bullishCount}, Bearish=${bearishCount}, SMA5=${latestSMA5.toFixed(5)}, SMA20=${latestSMA20.toFixed(5)}, Sentiment=${this.marketSentiment}`);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      this.marketSentiment = 'neutral'; // Default to neutral if analysis fails
    }
  }
  
  /**
   * Calculate Simple Moving Average
   * @param prices Array of prices
   * @param period Period for SMA calculation
   * @returns Array of SMA values
   */
  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((total, price) => total + price, 0);
      sma.push(sum / period);
    }
    
    return sma;
  }
  
  /**
   * Train the model with historical data
   */
  private async trainModel(): Promise<void> {
    try {
      console.log('Training strategy optimization model...');
      
      // Prepare training data
      const trainingData = this.prepareTrainingData();
      
      // Perform walk-forward optimization
      this.performWalkForwardOptimization(trainingData);
      
      // Optimize parameters based on market conditions
      this.optimizeParameters();
      
      console.log('Model training completed');
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }
  
  /**
   * Prepare training data from historical data
   * @returns Training data
   */
  private prepareTrainingData(): any[] {
    const trainingData: any[] = [];
    
    // Need at least 100 data points for meaningful training
    if (this.historicalData.length < 100) {
      console.warn('Not enough historical data for training');
      return trainingData;
    }
    
    // Create training windows
    const windowSize = 50; // 50 periods per window
    const step = 10; // Step 10 periods at a time
    
    for (let i = 0; i + windowSize <= this.historicalData.length; i += step) {
      const window = this.historicalData.slice(i, i + windowSize);
      trainingData.push(window);
    }
    
    console.log(`Prepared ${trainingData.length} training windows`);
    return trainingData;
  }
  
  /**
   * Perform walk-forward optimization
   * @param trainingData Training data windows
   */
  private performWalkForwardOptimization(trainingData: any[]): void {
    // Test different parameter combinations
    const rsiPeriods = [7, 9, 11, 14, 21];
    const overboughtLevels = [65, 70, 75, 80];
    const oversoldLevels = [35, 30, 25, 20];
    
    // Store results for each parameter combination
    this.trainingResults = [];
    
    // Test each parameter combination on each training window
    for (const rsiPeriod of rsiPeriods) {
      for (const overboughtLevel of overboughtLevels) {
        for (const oversoldLevel of oversoldLevels) {
          // Skip invalid combinations
          if (oversoldLevel >= overboughtLevel) {
            continue;
          }
          
          let totalProfit = 0;
          let winRate = 0;
          let profitFactor = 0;
          let totalTrades = 0;
          
          // Test on each window
          for (const window of trainingData) {
            const result = this.backtest(window, rsiPeriod, overboughtLevel, oversoldLevel);
            
            totalProfit += result.profit;
            winRate += result.winRate;
            profitFactor += result.profitFactor;
            totalTrades += result.trades;
          }
          
          // Average results across all windows
          const avgProfit = totalProfit / trainingData.length;
          const avgWinRate = winRate / trainingData.length;
          const avgProfitFactor = profitFactor / trainingData.length;
          const avgTrades = totalTrades / trainingData.length;
          
          // Store results
          this.trainingResults.push({
            rsiPeriod,
            overboughtLevel,
            oversoldLevel,
            profit: avgProfit,
            winRate: avgWinRate,
            profitFactor: avgProfitFactor,
            trades: avgTrades
          });
        }
      }
    }
    
    // Sort results by profit factor (most important metric)
    this.trainingResults.sort((a, b) => b.profitFactor - a.profitFactor);
    
    console.log(`Completed walk-forward optimization with ${this.trainingResults.length} parameter combinations`);
    console.log('Top 3 parameter combinations:');
    for (let i = 0; i < Math.min(3, this.trainingResults.length); i++) {
      const result = this.trainingResults[i];
      console.log(`${i+1}. RSI(${result.rsiPeriod}) [${result.oversoldLevel}/${result.overboughtLevel}] - PF: ${result.profitFactor.toFixed(2)}, WR: ${(result.winRate * 100).toFixed(1)}%, Profit: ${result.profit.toFixed(2)}`);
    }
  }
  
  /**
   * Backtest a parameter combination on a data window
   * @param data Data window
   * @param rsiPeriod RSI period
   * @param overboughtLevel Overbought threshold
   * @param oversoldLevel Oversold threshold
   * @returns Backtest results
   */
  private backtest(data: any[], rsiPeriod: number, overboughtLevel: number, oversoldLevel: number): any {
    // Calculate RSI values
    const closes = data.map(candle => candle.close);
    const rsiValues = this.calculateRSI(closes, rsiPeriod);
    
    // Initialize results
    let position: 'long' | 'short' | null = null;
    let entryPrice = 0;
    let profit = 0;
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    
    // Simulate trading
    for (let i = rsiPeriod + 1; i < data.length; i++) {
      const currentRSI = rsiValues[i - rsiPeriod];
      const previousRSI = rsiValues[i - rsiPeriod - 1];
      const currentPrice = data[i].close;
      
      // Check for buy signal (RSI crosses above oversold)
      if (previousRSI < oversoldLevel && currentRSI >= oversoldLevel) {
        // Close existing short position if any
        if (position === 'short') {
          const tradeProfit = entryPrice - currentPrice;
          profit += tradeProfit;
          
          if (tradeProfit > 0) {
            wins++;
            totalProfit += tradeProfit;
          } else {
            losses++;
            totalLoss += Math.abs(tradeProfit);
          }
        }
        
        // Open long position
        position = 'long';
        entryPrice = currentPrice;
      }
      // Check for sell signal (RSI crosses below overbought)
      else if (previousRSI > overboughtLevel && currentRSI <= overboughtLevel) {
        // Close existing long position if any
        if (position === 'long') {
          const tradeProfit = currentPrice - entryPrice;
          profit += tradeProfit;
          
          if (tradeProfit > 0) {
            wins++;
            totalProfit += tradeProfit;
          } else {
            losses++;
            totalLoss += Math.abs(tradeProfit);
          }
        }
        
        // Open short position
        position = 'short';
        entryPrice = currentPrice;
      }
    }
    
    // Close any open position at the end
    if (position) {
      const currentPrice = data[data.length - 1].close;
      
      if (position === 'long') {
        const tradeProfit = currentPrice - entryPrice;
        profit += tradeProfit;
        
        if (tradeProfit > 0) {
          wins++;
          totalProfit += tradeProfit;
        } else {
          losses++;
          totalLoss += Math.abs(tradeProfit);
        }
      } else if (position === 'short') {
        const tradeProfit = entryPrice - currentPrice;
        profit += tradeProfit;
        
        if (tradeProfit > 0) {
          wins++;
          totalProfit += tradeProfit;
        } else {
          losses++;
          totalLoss += Math.abs(tradeProfit);
        }
      }
    }
    
    // Calculate metrics
    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? wins / totalTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    
    return {
      profit,
      winRate,
      profitFactor,
      trades: totalTrades
    };
  }
  
  /**
   * Calculate RSI values
   * @param prices Array of prices
   * @param period RSI period
   * @returns Array of RSI values
   */
  private calculateRSI(prices: number[], period: number): number[] {
    if (prices.length <= period) {
      return [];
    }
    
    const rsiValues: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    // Calculate first RSI
    let rs = avgLoss === 0 ? 999 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
    
    // Calculate remaining RSI values
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      rs = avgLoss === 0 ? 999 : avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return rsiValues;
  }
  
  /**
   * Optimize parameters based on market conditions
   */
  private optimizeParameters(): void {
    // Start with the best overall parameters
    const bestResult = this.trainingResults[0];
    
    // Base parameters
    let rsiPeriod = bestResult.rsiPeriod;
    let overboughtLevel = bestResult.overboughtLevel;
    let oversoldLevel = bestResult.oversoldLevel;
    let stopLossPercent = 1.0;
    let takeProfitPercent = 2.0;
    
    // Adjust based on market regime
    if (this.marketRegime === 'trending') {
      // In trending markets, use wider thresholds and larger take profit
      overboughtLevel = Math.min(85, overboughtLevel + 5);
      oversoldLevel = Math.max(15, oversoldLevel - 5);
      takeProfitPercent = 2.5;
      stopLossPercent = 1.0;
    } else if (this.marketRegime === 'ranging') {
      // In ranging markets, use tighter thresholds and balanced risk/reward
      overboughtLevel = Math.max(65, overboughtLevel - 5);
      oversoldLevel = Math.min(35, oversoldLevel + 5);
      takeProfitPercent = 1.5;
      stopLossPercent = 1.0;
    } else if (this.marketRegime === 'volatile') {
      // In volatile markets, use wider stops and more conservative entries
      overboughtLevel = Math.min(80, overboughtLevel + 3);
      oversoldLevel = Math.max(20, oversoldLevel - 3);
      takeProfitPercent = 2.0;
      stopLossPercent = 1.5;
    }
    
    // Adjust based on volatility
    if (this.volatilityLevel === 'high') {
      // Increase stop loss in high volatility
      stopLossPercent *= 1.5;
      // Use longer RSI period for more stability
      rsiPeriod = Math.max(rsiPeriod, 14);
    } else if (this.volatilityLevel === 'low') {
      // Decrease take profit in low volatility
      takeProfitPercent *= 0.8;
      // Use shorter RSI period for more sensitivity
      rsiPeriod = Math.min(rsiPeriod, 14);
    }
    
    // Adjust based on market sentiment
    if (this.marketSentiment === 'bullish') {
      // In bullish markets, favor long positions
      oversoldLevel = Math.min(35, oversoldLevel + 5);
    } else if (this.marketSentiment === 'bearish') {
      // In bearish markets, favor short positions
      overboughtLevel = Math.max(65, overboughtLevel - 5);
    }
    
    // Store optimized parameters
    this.optimizedParameters = {
      rsiPeriod,
      overboughtLevel,
      oversoldLevel,
      stopLossPercent,
      takeProfitPercent
    };
    
    console.log('Optimized parameters based on market conditions:');
    console.log(`RSI Period: ${rsiPeriod}`);
    console.log(`Thresholds: ${oversoldLevel}/${overboughtLevel}`);
    console.log(`SL/TP: ${stopLossPercent.toFixed(1)}%/${takeProfitPercent.toFixed(1)}%`);
  }
  
  /**
   * Get optimized strategy parameters
   * @returns Optimized parameters
   */
  public getOptimizedParameters(): TradingStrategyProps {
    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      rsiPeriod: this.optimizedParameters.rsiPeriod || 14,
      overboughtThreshold: this.optimizedParameters.overboughtLevel || 70,
      oversoldThreshold: this.optimizedParameters.oversoldLevel || 30,
      positionSize: 1.0, // Default position size
      stopLossPercent: this.optimizedParameters.stopLossPercent || 1.0,
      takeProfitPercent: this.optimizedParameters.takeProfitPercent || 2.0,
      enableAutoTrading: false // Default to manual trading
    };
  }
  
  /**
   * Get market analysis results
   * @returns Market analysis
   */
  public getMarketAnalysis(): any {
    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      marketRegime: this.marketRegime,
      volatilityLevel: this.volatilityLevel,
      marketSentiment: this.marketSentiment,
      correlations: Object.fromEntries(this.correlationMatrix)
    };
  }
}

/**
 * React hook for using the enhanced strategy optimizer
 * @param symbol Trading symbol
 * @param timeframe Timeframe
 * @returns Optimizer controller
 */
export const useEnhancedStrategyOptimizer = (symbol: string, timeframe: string) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedParameters, setOptimizedParameters] = useState<TradingStrategyProps | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize optimizer
  const initializeOptimizer = async (capitalComService: CapitalComService) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const optimizer = new EnhancedStrategyOptimizer(capitalComService, symbol, timeframe);
      await optimizer.initialize();
      
      setOptimizedParameters(optimizer.getOptimizedParameters());
      setMarketAnalysis(optimizer.getMarketAnalysis());
      setIsInitialized(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize optimizer:', error);
      setError('Failed to initialize strategy optimizer');
      setIsLoading(false);
    }
  };
  
  return {
    isInitialized,
    isLoading,
    optimizedParameters,
    marketAnalysis,
    error,
    initializeOptimizer
  };
};

export default useEnhancedStrategyOptimizer;
