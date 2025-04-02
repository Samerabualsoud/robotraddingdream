import axios from 'axios';
import { 
  MT4Credentials, 
  AccountInfo, 
  TradeRequest, 
  TradeResponse, 
  TradePosition, 
  TradeHistory,
  MarketData,
  ErrorResponse
} from '../types/mt4Types';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mt4_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.'
      });
    }
    
    // Handle API errors
    const errorResponse: ErrorResponse = {
      code: error.response.status,
      message: error.response.data.message || 'An unknown error occurred',
      details: error.response.data.details
    };
    
    // Log errors for debugging
    console.error('API error:', errorResponse);
    
    return Promise.reject(errorResponse);
  }
);

class MT4Service {
  private token: string | null = null;
  
  // Initialize service with stored token if available
  constructor() {
    this.token = localStorage.getItem('mt4_token');
  }
  
  /**
   * Authenticate with MT4/MT5 server
   * @param credentials MT4/MT5 login credentials
   * @returns Promise resolving to authentication success
   */
  async login(credentials: MT4Credentials): Promise<boolean> {
    try {
      const response = await apiClient.post('/mt4/login', credentials);
      this.token = response.data.token;
      
      // Store token securely
      if (this.token) {
        localStorage.setItem('mt4_token', this.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
  
  /**
   * Get account information
   * @returns Promise resolving to account information
   */
  async getAccountInfo(): Promise<AccountInfo | null> {
    if (!this.token) return null;
    
    try {
      const response = await apiClient.get('/mt4/account');
      return response.data;
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }
  
  /**
   * Get current market data for a symbol
   * @param symbol Currency pair symbol
   * @returns Promise resolving to market data
   */
  async getMarketData(symbol: string): Promise<MarketData | null> {
    if (!this.token) return null;
    
    try {
      const response = await apiClient.get(`/mt4/market/${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get market data for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Get open positions
   * @returns Promise resolving to array of open positions
   */
  async getPositions(): Promise<TradePosition[]> {
    if (!this.token) return [];
    
    try {
      const response = await apiClient.get('/mt4/positions');
      return response.data;
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }
  
  /**
   * Get trading history
   * @param from Optional start date
   * @param to Optional end date
   * @returns Promise resolving to array of historical trades
   */
  async getTradeHistory(from?: Date, to?: Date): Promise<TradeHistory[]> {
    if (!this.token) return [];
    
    try {
      const params: any = {};
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();
      
      const response = await apiClient.get('/mt4/history', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get trade history:', error);
      return [];
    }
  }
  
  /**
   * Place a trade
   * @param request Trade request details
   * @returns Promise resolving to trade response
   */
  async placeTrade(request: TradeRequest): Promise<TradeResponse | null> {
    if (!this.token) return null;
    
    try {
      const response = await apiClient.post('/mt4/trade', request);
      return response.data;
    } catch (error) {
      console.error('Failed to place trade:', error);
      return null;
    }
  }
  
  /**
   * Modify an existing position
   * @param ticket Position ticket number
   * @param stopLoss New stop loss price
   * @param takeProfit New take profit price
   * @returns Promise resolving to success status
   */
  async modifyPosition(ticket: number, stopLoss?: number, takeProfit?: number): Promise<boolean> {
    if (!this.token) return false;
    
    try {
      const response = await apiClient.put(`/mt4/position/${ticket}`, {
        stopLoss,
        takeProfit
      });
      return response.data.success;
    } catch (error) {
      console.error(`Failed to modify position ${ticket}:`, error);
      return false;
    }
  }
  
  /**
   * Close an open position
   * @param ticket Position ticket number
   * @returns Promise resolving to success status
   */
  async closePosition(ticket: number): Promise<boolean> {
    if (!this.token) return false;
    
    try {
      const response = await apiClient.delete(`/mt4/position/${ticket}`);
      return response.data.success;
    } catch (error) {
      console.error(`Failed to close position ${ticket}:`, error);
      return false;
    }
  }
  
  /**
   * Logout and clear authentication
   * @returns Promise resolving to success status
   */
  async logout(): Promise<boolean> {
    if (!this.token) return true;
    
    try {
      await apiClient.post('/mt4/logout');
      this.token = null;
      localStorage.removeItem('mt4_token');
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear token on client side even if server logout fails
      this.token = null;
      localStorage.removeItem('mt4_token');
      return false;
    }
  }
}

export default new MT4Service();
