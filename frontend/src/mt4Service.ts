import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface MT4Credentials {
  server: string;
  login: string;
  password: string;
}

export interface TradeRequest {
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
}

export interface Trade {
  id: number;
  symbol: string;
  type: string;
  openTime: string;
  closeTime: string | null;
  openPrice: number;
  closePrice: number | null;
  volume: number;
  profit: number;
}

class MT4Service {
  private token: string | null = null;
  
  async login(credentials: MT4Credentials) : Promise<boolean> {
    try {
      // In a real app, this would connect to your backend which interfaces with MT4
      // For demo purposes, we'll simulate a successful login
      // const response = await axios.post(`${API_URL}/mt4/login`, credentials);
      // this.token = response.data.token;
      
      // Simulate successful login
      this.token = 'demo-token-123';
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
  
  async getAccountInfo(): Promise<AccountInfo | null> {
    if (!this.token) return null;
    
    try {
      // In a real app, this would fetch from your backend
      // const response = await axios.get(`${API_URL}/mt4/account`, {
      //   headers: { Authorization: `Bearer ${this.token}` }
      // });
      // return response.data;
      
      // Return mock data
      return {
        balance: 10000.00,
        equity: 10250.75,
        margin: 1200.50,
        freeMargin: 9050.25,
        leverage: 100
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }
  
  async getTrades(): Promise<Trade[]> {
    if (!this.token) return [];
    
    try {
      // In a real app, this would fetch from your backend
      // const response = await axios.get(`${API_URL}/mt4/trades`, {
      //   headers: { Authorization: `Bearer ${this.token}` }
      // });
      // return response.data;
      
      // Return mock data
      return [
        {
          id: 1,
          symbol: 'EURUSD',
          type: 'buy',
          openTime: '2025-04-01 09:30:00',
          closeTime: '2025-04-01 14:45:00',
          openPrice: 1.0765,
          closePrice: 1.0792,
          volume: 0.1,
          profit: 27.0
        },
        {
          id: 2,
          symbol: 'GBPUSD',
          type: 'sell',
          openTime: '2025-03-31 11:15:00',
          closeTime: '2025-03-31 16:20:00',
          openPrice: 1.2650,
          closePrice: 1.2610,
          volume: 0.05,
          profit: 20.0
        },
        {
          id: 3,
          symbol: 'USDJPY',
          type: 'buy',
          openTime: '2025-03-30 08:45:00',
          closeTime: '2025-03-30 15:30:00',
          openPrice: 151.25,
          closePrice: 151.05,
          volume: 0.1,
          profit: -20.0
        }
      ];
    } catch (error) {
      console.error('Failed to get trades:', error);
      return [];
    }
  }
  
  async placeTrade(request: TradeRequest): Promise<boolean> {
    if (!this.token) return false;
    
    try {
      // In a real app, this would send to your backend
      // const response = await axios.post(`${API_URL}/mt4/trade`, request, {
      //   headers: { Authorization: `Bearer ${this.token}` }
      // });
      // return response.data.success;
      
      // Simulate successful trade
      console.log('Trade placed:', request);
      return true;
    } catch (error) {
      console.error('Failed to place trade:', error);
      return false;
    }
  }
  
  async logout(): Promise<boolean> {
    if (!this.token) return true;
    
    try {
      // In a real app, this would call your backend
      // await axios.post(`${API_URL}/mt4/logout`, {}, {
      //   headers: { Authorization: `Bearer ${this.token}` }
      // });
      
      this.token = null;
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }
}

export default new MT4Service();
