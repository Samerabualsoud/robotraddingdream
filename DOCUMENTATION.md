# Capital.com Trading Integration Documentation

## Overview

This documentation provides comprehensive information about the integration of the Forex Trading platform with Capital.com. The integration enables users to connect to Capital.com's trading API, access real-time market data, execute trades, and utilize advanced trading strategies with self-correction mechanisms.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Authentication](#authentication)
6. [Trading Features](#trading-features)
7. [Strategy Components](#strategy-components)
8. [Self-Correction Mechanisms](#self-correction-mechanisms)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [API Reference](#api-reference)

## Introduction

The Capital.com integration extends the Forex Trading platform with professional-grade trading capabilities, connecting to Capital.com's robust trading infrastructure. This integration provides:

- Real-time market data for forex pairs and other instruments
- Execution of market and limit orders
- Account management and position tracking
- Advanced trading strategies with machine learning optimization
- Self-correction mechanisms that adapt to changing market conditions

## Architecture

The integration follows a modular architecture with clear separation of concerns:

### Core Components

1. **API Service Layer** (`CapitalComService.ts`)
   - Handles authentication, API requests, and data transformation
   - Manages session state and error handling

2. **Real-time Data Layer** (`CapitalComWebSocket.ts`)
   - Establishes and maintains WebSocket connections
   - Handles subscription management and data streaming

3. **Trading Strategy Layer** (`AdaptiveRsiStrategy.ts`)
   - Implements trading logic based on technical indicators
   - Manages position sizing and risk parameters

4. **Strategy Optimization Layer** (`EnhancedStrategyOptimizer.ts`)
   - Analyzes market conditions and optimizes strategy parameters
   - Implements machine learning techniques for strategy improvement

5. **UI Components**
   - Strategy Dashboard for monitoring and control
   - Strategy Optimizer for parameter optimization
   - Real-time price charts and indicators

### Data Flow

```
User Authentication → Capital.com API → WebSocket Connection → 
Real-time Data → Strategy Processing → Trading Signals → 
Order Execution → Position Management → Performance Analysis → 
Strategy Optimization
```

## Installation

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- A Capital.com trading account (live or demo)
- API credentials from Capital.com

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Samerabualsoud/robotraddingdream.git
   cd robotraddingdream
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_BASE_URL=https://api-capital.backend-capital.com/api/v1
REACT_APP_WS_BASE_URL=wss://api-capital.backend-capital.com/ws
REACT_APP_DEMO_API_BASE_URL=https://demo-api-capital.backend-capital.com/api/v1
REACT_APP_DEMO_WS_BASE_URL=wss://demo-api-capital.backend-capital.com/ws
```

### Application Settings

Additional configuration options can be set in the `src/config/config.js` file:

- Default trading instruments
- Risk management parameters
- UI preferences
- Logging levels

## Authentication

### Obtaining API Credentials

1. Log in to your Capital.com account
2. Navigate to Account Settings > API Access
3. Generate a new API key
4. Note your username, password, and API key for authentication

### Authentication Flow

The platform uses a secure authentication flow:

1. User enters Capital.com credentials (username, password, API key)
2. Credentials are securely transmitted to Capital.com's authentication endpoint
3. Upon successful authentication, a session token is returned
4. The session token is used for subsequent API requests and WebSocket connections
5. Sessions are automatically refreshed to maintain connectivity

## Trading Features

### Market Data

- Real-time price quotes for forex pairs and other instruments
- Historical price data for analysis and backtesting
- Market depth and order book information
- Economic calendar and news integration

### Order Types

- Market orders for immediate execution
- Limit orders for execution at specified price levels
- Stop orders for risk management
- Take profit orders for profit realization

### Position Management

- Open and close positions
- Modify stop loss and take profit levels
- Partial position closing
- Position monitoring and P&L tracking

### Risk Management

- Position sizing based on account balance and risk tolerance
- Stop loss placement based on technical levels and volatility
- Take profit targets based on risk-reward ratios
- Maximum drawdown controls

## Strategy Components

### Adaptive RSI Strategy

The Adaptive RSI Strategy is a core trading strategy that uses the Relative Strength Index (RSI) indicator with adaptive parameters:

- **Key Features**:
  - Dynamic RSI period adjustment based on market volatility
  - Adaptive overbought/oversold thresholds
  - Position sizing based on account balance and risk tolerance
  - Automatic stop loss and take profit placement
  - Performance tracking and self-correction

- **Parameters**:
  - `symbol`: Trading instrument (e.g., "EURUSD")
  - `timeframe`: Chart timeframe (e.g., "HOUR")
  - `rsiPeriod`: Period for RSI calculation
  - `overboughtThreshold`: Level for sell signals
  - `oversoldThreshold`: Level for buy signals
  - `positionSize`: Size of trading positions
  - `stopLossPercent`: Stop loss distance as percentage
  - `takeProfitPercent`: Take profit distance as percentage
  - `enableAutoTrading`: Toggle for automated execution

### Strategy Dashboard

The Strategy Dashboard provides a comprehensive interface for monitoring and controlling trading strategies:

- Real-time price chart with TradingView integration
- Current RSI value and signal indicators
- Strategy parameter display and editing
- Performance metrics visualization
- Trading controls (start/stop)

## Self-Correction Mechanisms

### Enhanced Strategy Optimizer

The Enhanced Strategy Optimizer implements advanced self-correction mechanisms:

- **Market Analysis**:
  - Market regime detection (trending, ranging, volatile)
  - Volatility level assessment
  - Correlation analysis with related instruments
  - Market sentiment evaluation

- **Parameter Optimization**:
  - Walk-forward optimization
  - Multiple timeframe analysis
  - Adaptive parameter selection
  - Performance metrics evaluation

- **Strategy Adaptation**:
  - Dynamic parameter adjustment
  - Risk management optimization
  - Market condition-based strategy selection
  - Continuous performance monitoring

### Optimization Process

1. **Data Collection**: Gather extensive historical data for the selected instrument
2. **Market Analysis**: Analyze market conditions and determine regime
3. **Parameter Testing**: Test multiple parameter combinations using walk-forward optimization
4. **Performance Evaluation**: Evaluate results based on profit factor, win rate, and other metrics
5. **Parameter Selection**: Select optimal parameters based on market conditions
6. **Strategy Adjustment**: Apply optimized parameters to the trading strategy
7. **Continuous Monitoring**: Track performance and re-optimize as needed

## Testing

### Integration Tests

The platform includes comprehensive integration tests to ensure proper functionality:

- **API Integration Tests** (`CapitalComIntegration.test.ts`):
  - Authentication flow
  - Market data retrieval
  - Order execution
  - WebSocket connectivity

- **UI Component Tests** (`UIComponents.test.tsx`):
  - Strategy Dashboard rendering
  - Strategy Optimizer functionality
  - User interaction handling

- **Authentication Tests** (`Authentication.test.tsx`):
  - Login process
  - Credential validation
  - Error handling

### Running Tests

```bash
npm test
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Verify API credentials are correct
   - Check if IP restrictions are in place
   - Ensure account has API access enabled

2. **WebSocket Disconnections**:
   - Check internet connectivity
   - Verify session token is valid
   - Ensure heartbeat messages are being sent

3. **Order Execution Errors**:
   - Check account balance and margin requirements
   - Verify instrument is available for trading
   - Check for trading hour restrictions

### Logging

The platform implements comprehensive logging:

- API request and response logging
- WebSocket connection events
- Strategy execution details
- Error and exception tracking

Logs can be accessed in the browser console during development or in the server logs in production.

## API Reference

### CapitalComService

```typescript
// Authentication
login(credentials: LoginCredentials): Promise<boolean>
logout(): Promise<boolean>

// Market Data
getMarketData(symbol: string): Promise<MarketData>
getPriceHistory(symbol: string, timeframe: string, from: number, to: number): Promise<PriceHistory>

// Trading
placeTrade(orderParams: OrderParameters): Promise<OrderResponse>
closePosition(dealId: string): Promise<ClosePositionResponse>
getPositions(): Promise<Position[]>
getAccountInfo(): Promise<AccountInfo>
```

### CapitalComWebSocket

```typescript
// Connection Management
subscribe(symbol: string, clientId: string, callback: (data: any) => void): void
unsubscribe(symbol: string, clientId: string): void
close(): void
isActive(): boolean

// Event Handlers
handleOpen(): void
handleMessage(event: WebSocket.MessageEvent): void
handleError(event: WebSocket.ErrorEvent): void
handleClose(event: WebSocket.CloseEvent): void
```

### AdaptiveRsiStrategy

```typescript
// Initialization
initialize(sessionToken: string, isDemo: boolean): Promise<void>

// Strategy Control
start(): void
stop(): void
cleanup(): void

// Data Access
getCurrentRSI(): number
getPerformanceMetrics(): any
getParameters(): any

// Trading Logic
checkTradingSignals(bid: number, ask: number): Promise<void>
openPosition(direction: 'BUY' | 'SELL', price: number): Promise<void>
closePosition(): Promise<void>
```

### EnhancedStrategyOptimizer

```typescript
// Initialization
initialize(): Promise<void>

// Analysis Methods
analyzeMarketRegime(): void
calculateVolatility(): void
analyzeCorrelations(): Promise<void>
analyzeSentiment(): Promise<void>

// Optimization Methods
trainModel(): Promise<void>
performWalkForwardOptimization(trainingData: any[]): void
backtest(data: any[], rsiPeriod: number, overboughtLevel: number, oversoldLevel: number): any
optimizeParameters(): void

// Data Access
getOptimizedParameters(): TradingStrategyProps
getMarketAnalysis(): any
```

---

This documentation provides a comprehensive overview of the Capital.com integration with the Forex Trading platform. For additional support or questions, please contact the development team.
