import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import CapitalComService from '../../services/capitalcom/CapitalComService';
import CapitalComWebSocket from '../../services/capitalcom/CapitalComWebSocket';

export interface TradingStrategyProps {
  symbol: string;
  timeframe: string;
  rsiPeriod: number;
  overboughtThreshold: number;
  oversoldThreshold: number;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  enableAutoTrading: boolean;
}

/**
 * Trading strategy implementation for Capital.com using RSI indicator
 */
export class AdaptiveRsiStrategy {
  private capitalComService: CapitalComService;
  private webSocket: CapitalComWebSocket | null = null;
  private symbol: string;
  private timeframe: string;
  private rsiPeriod: number;
  private overboughtThreshold: number;
  private oversoldThreshold: number;
  private positionSize: number;
  private stopLossPercent: number;
  private takeProfitPercent: number;
  private enableAutoTrading: boolean;
  private isRunning: boolean = false;
  private currentPosition: any = null;
  private priceData: any[] = [];
  private rsiValues: number[] = [];
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
    totalLoss: 0
  };
  
  /**
   * Creates a new instance of AdaptiveRsiStrategy
   * @param capitalComService Capital.com service instance
   * @param config Strategy configuration
   */
  constructor(
    capitalComService: CapitalComService, 
    config: TradingStrategyProps
  ) {
    this.capitalComService = capitalComService;
    this.symbol = config.symbol;
    this.timeframe = config.timeframe;
    this.rsiPeriod = config.rsiPeriod;
    this.overboughtThreshold = config.overboughtThreshold;
    this.oversoldThreshold = config.oversoldThreshold;
    this.positionSize = config.positionSize;
    this.stopLossPercent = config.stopLossPercent;
    this.takeProfitPercent = config.takeProfitPercent;
    this.enableAutoTrading = config.enableAutoTrading;
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
      
      // Calculate initial RSI values
      this.calculateRSI();
      
      // Initialize WebSocket for real-time data
      this.webSocket = new CapitalComWebSocket(sessionToken, isDemo);
      
      // Subscribe to price updates
      this.webSocket.subscribe(
        this.symbol,
        'adaptive-rsi-strategy',
        this.handlePriceUpdate.bind(this)
      );
      
      // Check for existing position
      await this.checkExistingPosition();
      
      console.log(`Strategy initialized for ${this.symbol} with RSI period ${this.rsiPeriod}`);
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
      // Calculate time range based on timeframe and RSI period
      const now = new Date();
      let from = new Date();
      
      // Determine how far back to fetch data based on timeframe
      switch (this.timeframe) {
        case 'MINUTE':
          from.setMinutes(from.getMinutes() - (this.rsiPeriod + 50));
          break;
        case 'HOUR':
          from.setHours(from.getHours() - (this.rsiPeriod + 50));
          break;
        case 'DAY':
          from.setDate(from.getDate() - (this.rsiPeriod + 50));
          break;
        default:
          from.setHours(from.getHours() - (this.rsiPeriod + 50));
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
   * Calculate RSI values from price data
   */
  private calculateRSI(): void {
    if (this.priceData.length < this.rsiPeriod + 1) {
      console.error('Not enough data to calculate RSI');
      return;
    }
    
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < this.priceData.length; i++) {
      changes.push(this.priceData[i].close - this.priceData[i - 1].close);
    }
    
    // Calculate RSI for each period
    this.rsiValues = [];
    
    for (let i = this.rsiPeriod; i < changes.length; i++) {
      const period = changes.slice(i - this.rsiPeriod, i);
      const gains = period.filter(change => change > 0).reduce((sum, change) => sum + change, 0);
      const losses = period.filter(change => change < 0).reduce((sum, change) => sum + Math.abs(change), 0);
      
      const avgGain = gains / this.rsiPeriod;
      const avgLoss = losses / this.rsiPeriod;
      
      if (avgLoss === 0) {
        this.rsiValues.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        this.rsiValues.push(rsi);
      }
    }
    
    console.log(`Calculated ${this.rsiValues.length} RSI values, latest: ${this.rsiValues[this.rsiValues.length - 1]?.toFixed(2)}`);
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
      if (this.priceData.length > this.rsiPeriod + 100) {
        this.priceData.shift();
      }
      
      // Recalculate RSI
      this.calculateRSI();
      
      // Check for trading signals if auto-trading is enabled
      if (this.isRunning && this.enableAutoTrading) {
        this.checkTradingSignals(data.bid, data.ask);
      }
    } catch (error) {
      console.error('Error handling price update:', error);
    }
  }
  
  /**
   * Check for trading signals based on RSI values
   * @param bid Current bid price
   * @param ask Current ask price
   */
  private async checkTradingSignals(bid: number, ask: number): Promise<void> {
    if (this.rsiValues.length < 2) {
      return;
    }
    
    const currentRSI = this.rsiValues[this.rsiValues.length - 1];
    const previousRSI = this.rsiValues[this.rsiValues.length - 2];
    
    // Check for buy signal (RSI crosses above oversold threshold)
    if (previousRSI < this.oversoldThreshold && currentRSI >= this.oversoldThreshold) {
      console.log(`Buy signal: RSI crossed above ${this.oversoldThreshold} (${currentRSI.toFixed(2)})`);
      
      // If we have an open position in the opposite direction, close it first
      if (this.currentPosition && this.currentPosition.direction === 'SELL') {
        await this.closePosition();
      }
      
      // Open a new long position if we don't have one already
      if (!this.currentPosition || this.currentPosition.direction !== 'BUY') {
        await this.openPosition('BUY', ask);
      }
    }
    // Check for sell signal (RSI crosses below overbought threshold)
    else if (previousRSI > this.overboughtThreshold && currentRSI <= this.overboughtThreshold) {
      console.log(`Sell signal: RSI crossed below ${this.overboughtThreshold} (${currentRSI.toFixed(2)})`);
      
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
      // Calculate stop loss and take profit levels
      const stopLoss = direction === 'BUY'
        ? price * (1 - this.stopLossPercent / 100)
        : price * (1 + this.stopLossPercent / 100);
      
      const takeProfit = direction === 'BUY'
        ? price * (1 + this.takeProfitPercent / 100)
        : price * (1 - this.takeProfitPercent / 100);
      
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
          size: this.currentPosition.size
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
    
    console.log('Updated performance metrics:', this.performanceMetrics);
    
    // Adjust strategy parameters based on performance
    this.adjustStrategyParameters();
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
      this.webSocket.unsubscribe(this.symbol, 'adaptive-rsi-strategy');
      this.webSocket.close();
      this.webSocket = null;
    }
    
    this.isRunning = false;
    console.log(`Strategy cleaned up for ${this.symbol}`);
  }
  
  /**
   * Get current RSI value
   * @returns Current RSI value
   */
  public getCurrentRSI(): number {
    return this.rsiValues.length > 0 ? this.rsiValues[this.rsiValues.length - 1] : 0;
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
      positionSize: this.positionSize,
      stopLossPercent: this.stopLossPercent,
      takeProfitPercent: this.takeProfitPercent,
      enableAutoTrading: this.enableAutoTrading
    };
  }
}

/**
 * React hook for using the adaptive RSI strategy
 * @param config Strategy configuration
 * @returns Strategy controller
 */
export const useAdaptiveRsiStrategy = (config: TradingStrategyProps) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [strategy, setStrategy] = useState<AdaptiveRsiStrategy | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRSI, setCurrentRSI] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [parameters, setParameters] = useState(config);
  
  // Initialize strategy when authenticated
  useEffect(() => {
    let strategyInstance: AdaptiveRsiStrategy | null = null;
    
    const initStrategy = async () => {
      if (isAuthenticated && user) {
        try {
          // Create Capital.com service
          const capitalComService = new CapitalComService(user.isDemo);
          
          // Login to Capital.com
          const loginSuccess = await capitalComService.login({
            login: user.username,
            password: user.password,
            apiKey: user.apiKey,
            encryptedPassword: false
          });
          
          if (!loginSuccess) {
            console.error('Failed to login to Capital.com');
            return;
          }
          
          // Create and initialize strategy
          strategyInstance = new AdaptiveRsiStrategy(capitalComService, config);
          await strategyInstance.initialize(user.sessionToken || '', user.isDemo);
          
          setStrategy(strategyInstance);
          
          // Start polling for updates
          const updateInterval = setInterval(() => {
            if (strategyInstance) {
              setCurrentRSI(strategyInstance.getCurrentRSI());
              setPerformanceMetrics(strategyInstance.getPerformanceMetrics());
              setParameters(strategyInstance.getParameters());
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
        }
      }
    };
    
    initStrategy();
    
    return () => {
      if (strategyInstance) {
        strategyInstance.cleanup();
      }
    };
  }, [isAuthenticated, user, config]);
  
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
    isInitialized: !!strategy,
    isRunning,
    currentRSI,
    performanceMetrics,
    parameters,
    toggleStrategy
  };
};

export default useAdaptiveRsiStrategy;
