import WebSocket from 'ws';

export interface WebSocketSubscription {
  symbol: string;
  clientId: string;
  callback: (data: any) => void;
}

/**
 * Service for handling real-time data via WebSocket from Capital.com
 */
export class CapitalComWebSocket {
  private socket: WebSocket | null = null;
  private subscriptions: Map<string, Set<WebSocketSubscription>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionToken: string;
  
  /**
   * Creates a new instance of CapitalComWebSocket
   * @param sessionToken Session token from authentication
   * @param isDemo Whether to use demo environment
   */
  constructor(sessionToken: string, isDemo: boolean = false) {
    this.sessionToken = sessionToken;
    const wsUrl = isDemo 
      ? 'wss://demo-api-capital.backend-capital.com/ws'
      : 'wss://api-capital.backend-capital.com/ws';
    
    this.initialize(wsUrl);
  }
  
  /**
   * Initialize WebSocket connection
   * @param url WebSocket URL
   */
  private initialize(url: string): void {
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.attemptReconnect();
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Authenticate the WebSocket connection
    this.authenticate();
    
    // Start heartbeat to keep connection alive
    this.startHeartbeat();
    
    // Resubscribe to all active subscriptions
    this.resubscribeAll();
  }
  
  /**
   * Authenticate the WebSocket connection
   */
  private authenticate(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const authMessage = {
      action: 'AUTHENTICATE',
      token: this.sessionToken
    };
    
    this.socket.send(JSON.stringify(authMessage));
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ action: 'HEARTBEAT' }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }
  
  /**
   * Handle WebSocket message event
   * @param event WebSocket message event
   */
  private handleMessage(event: WebSocket.MessageEvent): void {
    try {
      const data = JSON.parse(event.data.toString());
      
      // Handle different message types
      if (data.type === 'PRICE_UPDATE') {
        this.handlePriceUpdate(data);
      } else if (data.type === 'AUTHENTICATE_RESPONSE') {
        console.log('WebSocket authenticated:', data.status);
      } else if (data.type === 'SUBSCRIPTION_RESPONSE') {
        console.log('Subscription response:', data.status, data.symbol);
      } else if (data.type === 'ERROR') {
        console.error('WebSocket error:', data.message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }
  
  /**
   * Handle price update message
   * @param data Price update data
   */
  private handlePriceUpdate(data: any): void {
    const symbol = data.symbol;
    
    if (!this.subscriptions.has(symbol)) {
      return;
    }
    
    const subscribers = this.subscriptions.get(symbol);
    
    if (subscribers) {
      subscribers.forEach(subscription => {
        try {
          subscription.callback(data);
        } catch (error) {
          console.error(`Error in subscription callback for ${symbol}:`, error);
        }
      });
    }
  }
  
  /**
   * Handle WebSocket error event
   * @param event WebSocket error event
   */
  private handleError(event: WebSocket.ErrorEvent): void {
    console.error('WebSocket error:', event);
  }
  
  /**
   * Handle WebSocket close event
   * @param event WebSocket close event
   */
  private handleClose(event: WebSocket.CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Attempt to reconnect if not closed intentionally
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      console.log('Reconnecting to WebSocket...');
      this.initialize(this.socket?.url || '');
    }, delay);
  }
  
  /**
   * Resubscribe to all active subscriptions
   */
  private resubscribeAll(): void {
    for (const [symbol, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.size > 0) {
        this.sendSubscription(symbol);
      }
    }
  }
  
  /**
   * Send subscription request for a symbol
   * @param symbol Symbol to subscribe to
   */
  private sendSubscription(symbol: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const subscriptionMessage = {
      action: 'SUBSCRIBE',
      symbol: symbol
    };
    
    this.socket.send(JSON.stringify(subscriptionMessage));
  }
  
  /**
   * Subscribe to real-time updates for a symbol
   * @param symbol Symbol to subscribe to
   * @param clientId Unique client identifier
   * @param callback Callback function for price updates
   */
  public subscribe(
    symbol: string, 
    clientId: string, 
    callback: (data: any) => void
  ): void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
      
      // Send subscription request if connected
      if (this.isConnected) {
        this.sendSubscription(symbol);
      }
    }
    
    const subscription: WebSocketSubscription = {
      symbol,
      clientId,
      callback
    };
    
    this.subscriptions.get(symbol)?.add(subscription);
  }
  
  /**
   * Unsubscribe from real-time updates for a symbol
   * @param symbol Symbol to unsubscribe from
   * @param clientId Client identifier to unsubscribe
   */
  public unsubscribe(symbol: string, clientId: string): void {
    if (!this.subscriptions.has(symbol)) {
      return;
    }
    
    const subscriptions = this.subscriptions.get(symbol);
    
    if (subscriptions) {
      // Remove subscriptions with matching clientId
      for (const subscription of [...subscriptions]) {
        if (subscription.clientId === clientId) {
          subscriptions.delete(subscription);
        }
      }
      
      // If no more subscriptions for this symbol, unsubscribe from server
      if (subscriptions.size === 0) {
        this.sendUnsubscription(symbol);
        this.subscriptions.delete(symbol);
      }
    }
  }
  
  /**
   * Send unsubscription request for a symbol
   * @param symbol Symbol to unsubscribe from
   */
  private sendUnsubscription(symbol: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const unsubscriptionMessage = {
      action: 'UNSUBSCRIBE',
      symbol: symbol
    };
    
    this.socket.send(JSON.stringify(unsubscriptionMessage));
  }
  
  /**
   * Close the WebSocket connection
   */
  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'Client closed connection');
      this.socket = null;
    }
    
    this.isConnected = false;
    this.subscriptions.clear();
  }
  
  /**
   * Check if WebSocket is connected
   * @returns True if connected
   */
  public isActive(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }
}

export default CapitalComWebSocket;
