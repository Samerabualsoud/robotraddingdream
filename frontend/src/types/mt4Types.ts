/**
 * Type definitions for MT4/MT5 API integration
 */

// MT4/MT5 Credentials interface
export interface MT4Credentials {
  server: string;
  login: string;
  password: string;
  type: 'mt4' | 'mt5';
}

// Account information interface
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
}

// Trade order types
export type OrderType = 'buy' | 'sell' | 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop';

// Trade request interface
export interface TradeRequest {
  symbol: string;
  type: OrderType;
  volume: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
  magic?: number;
  expiration?: Date;
}

// Trade response interface
export interface TradeResponse {
  ticket: number;
  openTime: Date;
  openPrice: number;
  success: boolean;
  message?: string;
}

// Trade position interface
export interface TradePosition {
  ticket: number;
  symbol: string;
  type: OrderType;
  volume: number;
  openTime: Date;
  openPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number;
  commission: number;
  swap: number;
  comment: string;
  magic: number;
}

// Trade history interface
export interface TradeHistory {
  ticket: number;
  symbol: string;
  type: OrderType;
  volume: number;
  openTime: Date;
  closeTime: Date;
  openPrice: number;
  closePrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number;
  commission: number;
  swap: number;
  comment: string;
  magic: number;
}

// Market data interface
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

// Error response interface
export interface ErrorResponse {
  code: number;
  message: string;
  details?: string;
}
