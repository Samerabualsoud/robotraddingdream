import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export interface CapitalComCredentials {
  login: string;
  password: string;
  apiKey: string;
  encryptedPassword?: boolean;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  time: Date;
  spread: number;
  high: number;
  low: number;
  volume: number;
}

export interface PriceHistory {
  symbol: string;
  resolution: string;
  from: number;
  to: number;
  prices: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface OrderDetails {
  symbol: string;
  direction: 'BUY' | 'SELL';
  size: number;
  stopLoss?: number;
  takeProfit?: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: 'FILL_OR_KILL' | 'IMMEDIATE_OR_CANCEL' | 'GOOD_TILL_CANCELLED' | 'GOOD_TILL_DATE';
  goodTillDate?: string;
}

export interface OrderResponse {
  dealId: string;
  dealReference: string;
  status: 'ACCEPTED' | 'REJECTED';
  reason?: string;
  dateTime: string;
}

export interface Position {
  dealId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  size: number;
  openLevel: number;
  currentLevel: number;
  stopLevel?: number;
  profitLevel?: number;
  openTime: string;
  profit: number;
  commission: number;
  swap: number;
}

export interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  name: string;
  server: string;
  currency: string;
  company: string;
  accountId: string;
}

export interface TradeHistory {
  dealId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  size: number;
  openLevel: number;
  closeLevel: number;
  openTime: string;
  closeTime: string;
  profit: number;
  commission: number;
  swap: number;
}

/**
 * Service for interacting with Capital.com API
 */
export class CapitalComService {
  private apiKey: string;
  private baseUrl: string;
  private sessionToken: string | null = null;
  private client: AxiosInstance;
  private encryptionKey: string | null = null;
  private timeStamp: string | null = null;
  
  /**
   * Creates a new instance of CapitalComService
   * @param isDemo Whether to use demo environment
   */
  constructor(isDemo: boolean = false) {
    this.baseUrl = isDemo 
      ? 'https://demo-api-capital.backend-capital.com/'
      : 'https://api-capital.backend-capital.com/';
    this.apiKey = '';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Set request headers with authentication
   */
  private setAuthHeaders() {
    if (!this.sessionToken) {
      throw new Error('Not authenticated. Call login() first.');
    }
    
    this.client.defaults.headers.common['X-SECURITY-TOKEN'] = this.sessionToken;
    this.client.defaults.headers.common['CST'] = this.sessionToken;
  }
  
  /**
   * Encrypt password using Capital.com encryption method
   * @param password Plain password
   * @returns Encrypted password
   */
  private async encryptPassword(password: string): Promise<string> {
    if (!this.encryptionKey || !this.timeStamp) {
      throw new Error('Encryption key not available. Call getEncryptionKey() first.');
    }
    
    try {
      // Combine password with timestamp as per Capital.com docs
      const input = Buffer.from(password + '|' + this.timeStamp);
      
      // Base64 encode the input
      const base64Input = input.toString('base64');
      
      // Use RSA encryption with the provided key
      const keyFactory = crypto.createPublicKey(this.encryptionKey);
      const cipher = crypto.publicEncrypt(
        {
          key: keyFactory,
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(base64Input)
      );
      
      // Return base64 encoded result
      return cipher.toString('base64');
    } catch (error) {
      console.error('Password encryption failed:', error);
      throw new Error('Failed to encrypt password');
    }
  }
  
  /**
   * Get encryption key for secure password authentication
   */
  private async getEncryptionKey(): Promise<void> {
    try {
      const response = await this.client.get('/session/encryptionKey', {
        headers: {
          'X-CAP-API-KEY': this.apiKey
        }
      });
      
      if (response.data && response.data.encryptionKey) {
        this.encryptionKey = response.data.encryptionKey;
        this.timeStamp = response.data.timeStamp;
      } else {
        throw new Error('Invalid response from encryption key endpoint');
      }
    } catch (error) {
      console.error('Failed to get encryption key:', error);
      throw error;
    }
  }
  
  /**
   * Login to Capital.com API
   * @param credentials User credentials
   * @returns True if login successful
   */
  async login(credentials: CapitalComCredentials): Promise<boolean> {
    try {
      this.apiKey = credentials.apiKey;
      
      let password = credentials.password;
      
      // If using encrypted password, get encryption key and encrypt
      if (credentials.encryptedPassword) {
        await this.getEncryptionKey();
        password = await this.encryptPassword(credentials.password);
      }
      
      // Prepare login request
      const loginData = {
        identifier: credentials.login,
        password: password,
        encryptedPassword: credentials.encryptedPassword || false
      };
      
      // Make login request
      const response = await this.client.post('/session', loginData, {
        headers: {
          'X-CAP-API-KEY': this.apiKey
        }
      });
      
      // Extract session token
      if (response.data && response.headers['cst']) {
        this.sessionToken = response.headers['cst'];
        this.setAuthHeaders();
        return true;
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
  
  /**
   * Logout from Capital.com API
   * @returns True if logout successful
   */
  async logout(): Promise<boolean> {
    try {
      if (!this.sessionToken) {
        return true; // Already logged out
      }
      
      await this.client.delete('/session');
      this.sessionToken = null;
      delete this.client.defaults.headers.common['X-SECURITY-TOKEN'];
      delete this.client.defaults.headers.common['CST'];
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }
  
  /**
   * Get market data for a symbol
   * @param symbol Trading symbol
   * @returns Market data
   */
  async getMarketData(symbol: string): Promise<MarketData> {
    try {
      const response = await this.client.get(`/market/${symbol}`);
      
      if (!response.data || !response.data.bid) {
        throw new Error('Invalid market data response');
      }
      
      return {
        symbol: response.data.epic,
        bid: response.data.bid,
        ask: response.data.offer,
        time: new Date(response.data.updateTime),
        spread: response.data.offer - response.data.bid,
        high: response.data.high,
        low: response.data.low,
        volume: response.data.marketSize || 0
      };
    } catch (error) {
      console.error(`Failed to get market data for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get price history for a symbol
   * @param symbol Trading symbol
   * @param resolution Timeframe (e.g., "MINUTE", "HOUR", "DAY")
   * @param from Start timestamp
   * @param to End timestamp
   * @returns Price history
   */
  async getPriceHistory(
    symbol: string, 
    resolution: string, 
    from: number, 
    to: number
  ): Promise<PriceHistory> {
    try {
      const response = await this.client.get(`/market/${symbol}/prices`, {
        params: {
          resolution,
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString()
        }
      });
      
      if (!response.data || !response.data.prices) {
        throw new Error('Invalid price history response');
      }
      
      return {
        symbol,
        resolution,
        from,
        to,
        prices: response.data.prices.map((price: any) => ({
          time: new Date(price.snapshotTime).getTime(),
          open: price.openPrice.bid,
          high: price.highPrice.bid,
          low: price.lowPrice.bid,
          close: price.closePrice.bid,
          volume: price.lastTradedVolume || 0
        }))
      };
    } catch (error) {
      console.error(`Failed to get price history for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Place a trade
   * @param orderDetails Order details
   * @returns Order response
   */
  async placeTrade(orderDetails: OrderDetails): Promise<OrderResponse> {
    try {
      const orderData = {
        epic: orderDetails.symbol,
        direction: orderDetails.direction,
        size: orderDetails.size,
        orderType: orderDetails.orderType,
        timeInForce: orderDetails.timeInForce || 'FILL_OR_KILL',
        guaranteedStop: false,
        stopDistance: orderDetails.stopLoss ? Math.abs(orderDetails.stopLoss) : undefined,
        limitDistance: orderDetails.takeProfit ? Math.abs(orderDetails.takeProfit) : undefined,
        limitLevel: orderDetails.limitPrice,
        stopLevel: orderDetails.stopPrice,
        goodTillDate: orderDetails.goodTillDate
      };
      
      const response = await this.client.post('/positions', orderData);
      
      if (!response.data || !response.data.dealReference) {
        throw new Error('Invalid order response');
      }
      
      return {
        dealId: response.data.dealId || '',
        dealReference: response.data.dealReference,
        status: response.data.status,
        reason: response.data.reason,
        dateTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to place trade:', error);
      throw error;
    }
  }
  
  /**
   * Close a position
   * @param dealId Deal ID of the position to close
   * @returns True if position closed successfully
   */
  async closePosition(dealId: string): Promise<boolean> {
    try {
      const response = await this.client.delete(`/positions/${dealId}`);
      
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to close position ${dealId}:`, error);
      return false;
    }
  }
  
  /**
   * Modify a position
   * @param dealId Deal ID of the position to modify
   * @param stopLoss New stop loss level
   * @param takeProfit New take profit level
   * @returns True if position modified successfully
   */
  async modifyPosition(
    dealId: string, 
    stopLoss?: number, 
    takeProfit?: number
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (stopLoss !== undefined) {
        updateData.stopLevel = stopLoss;
      }
      
      if (takeProfit !== undefined) {
        updateData.limitLevel = takeProfit;
      }
      
      if (Object.keys(updateData).length === 0) {
        return true; // Nothing to update
      }
      
      const response = await this.client.put(`/positions/${dealId}`, updateData);
      
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to modify position ${dealId}:`, error);
      return false;
    }
  }
  
  /**
   * Get account information
   * @returns Account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const response = await this.client.get('/accounts');
      
      if (!response.data || !response.data.accounts || response.data.accounts.length === 0) {
        throw new Error('Invalid account info response');
      }
      
      const account = response.data.accounts[0];
      
      return {
        balance: account.balance,
        equity: account.balance + account.profitLoss,
        margin: account.deposit,
        freeMargin: account.available,
        leverage: account.leverage || 1,
        name: account.accountName,
        server: this.baseUrl,
        currency: account.currency,
        company: 'Capital.com',
        accountId: account.accountId
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }
  
  /**
   * Get open positions
   * @returns List of open positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get('/positions');
      
      if (!response.data || !response.data.positions) {
        throw new Error('Invalid positions response');
      }
      
      return response.data.positions.map((pos: any) => ({
        dealId: pos.dealId,
        symbol: pos.market.epic,
        direction: pos.direction,
        size: pos.size,
        openLevel: pos.level,
        currentLevel: pos.market.bid,
        stopLevel: pos.stopLevel,
        profitLevel: pos.limitLevel,
        openTime: pos.createdDate,
        profit: pos.profit,
        commission: pos.commission || 0,
        swap: pos.funding || 0
      }));
    } catch (error) {
      console.error('Failed to get positions:', error);
      throw error;
    }
  }
  
  /**
   * Get trade history
   * @param from Optional start date
   * @param to Optional end date
   * @returns List of historical trades
   */
  async getTradeHistory(
    from?: Date, 
    to?: Date
  ): Promise<TradeHistory[]> {
    try {
      const params: any = {};
      
      if (from) {
        params.from = from.toISOString();
      }
      
      if (to) {
        params.to = to.toISOString();
      }
      
      const response = await this.client.get('/history/transactions', { params });
      
      if (!response.data || !response.data.transactions) {
        throw new Error('Invalid trade history response');
      }
      
      return response.data.transactions
        .filter((tx: any) => tx.type === 'TRADE')
        .map((tx: any) => ({
          dealId: tx.dealId,
          symbol: tx.instrument.name,
          direction: tx.direction,
          size: tx.size,
          openLevel: tx.openLevel,
          closeLevel: tx.closeLevel,
          openTime: tx.openDateUtc,
          closeTime: tx.dateUtc,
          profit: tx.profitAndLoss,
          commission: tx.commission || 0,
          swap: tx.funding || 0
        }));
    } catch (error) {
      console.error('Failed to get trade history:', error);
      throw error;
    }
  }
}

export default CapitalComService;
