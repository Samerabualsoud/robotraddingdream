# Detailed Connection Guide for MT4, MT5, and Capital.com

This comprehensive guide will walk you through the process of connecting the RobotRaddingDream trading platform to MetaTrader 4 (MT4), MetaTrader 5 (MT5), and Capital.com. Follow these step-by-step instructions to set up your trading environment and start using the advanced multi-indicator trading strategy with self-correction mechanisms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Capital.com Connection Guide](#capitalcom-connection-guide)
3. [MetaTrader 4 (MT4) Connection Guide](#metatrader-4-mt4-connection-guide)
4. [MetaTrader 5 (MT5) Connection Guide](#metatrader-5-mt5-connection-guide)
5. [Troubleshooting](#troubleshooting)
6. [Security Best Practices](#security-best-practices)

## Prerequisites

Before connecting to any trading platform, ensure you have:

- Node.js (version 14 or higher) installed
- Git installed
- A registered account with Capital.com, MT4, or MT5
- API access enabled on your trading account
- The RobotRaddingDream repository cloned to your local machine

```bash
git clone https://github.com/Samerabualsoud/robotraddingdream.git
cd robotraddingdream
npm install
```

## Capital.com Connection Guide

Capital.com offers a modern REST API and WebSocket interface that allows our platform to connect directly for automated trading.

### Step 1: Obtain API Credentials from Capital.com

1. Log in to your Capital.com account
2. Navigate to **Account Settings** > **API Management**
3. Click on **Create API Key**
4. Set appropriate permissions:
   - Read account information
   - Read market data
   - Create and manage orders
5. Note down your:
   - API Key
   - API Secret
   - Access Token (if provided)

### Step 2: Configure the RobotRaddingDream Platform

1. Create a `.env` file in the root directory of the project:

```bash
touch .env
```

2. Add your Capital.com credentials to the `.env` file:

```
CAPITAL_COM_API_KEY=your_api_key_here
CAPITAL_COM_API_SECRET=your_api_secret_here
CAPITAL_COM_ACCESS_TOKEN=your_access_token_here
CAPITAL_COM_DEMO_MODE=true  # Set to false for live trading
```

### Step 3: Test the Connection

1. Run the connection test script:

```bash
npm run test:capital-connection
```

2. Verify that the test completes successfully with output similar to:

```
✓ Successfully connected to Capital.com API
✓ Account information retrieved
✓ Market data access confirmed
✓ Order capabilities verified
```

### Step 4: Launch the Trading Platform

1. Start the RobotRaddingDream platform:

```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`
3. Log in using your Capital.com credentials
4. Navigate to the **Trading Dashboard** to access the multi-indicator strategy interface

### Step 5: Configure Trading Parameters

1. In the Trading Dashboard, click on **Strategy Settings**
2. Configure your preferred parameters:
   - Select trading pairs (e.g., EUR/USD, GBP/USD)
   - Set timeframes (e.g., 5m, 15m, 1h, 4h)
   - Adjust indicator weights and parameters
   - Set risk management rules (position size, stop-loss, take-profit)
3. Click **Save Settings** to apply your configuration

### Step 6: Enable Auto-Trading (Optional)

1. Review the strategy performance in simulation mode
2. When satisfied with the results, toggle the **Enable Auto-Trading** switch
3. Confirm the auto-trading activation in the confirmation dialog
4. Monitor the trading activity in the **Trading History** section

## MetaTrader 4 (MT4) Connection Guide

Connecting to MT4 requires setting up a bridge between the RobotRaddingDream platform and your MT4 terminal.

### Step 1: Install MT4 and Required Components

1. Download and install MetaTrader 4 from your broker's website
2. Log in to your MT4 account
3. Install the ZeroMQ bridge for MT4:
   - Download the [ZeroMQ for MT4 package](https://github.com/dingmaotu/mql-zmq/releases)
   - Copy the DLL files to your MT4's `Library` folder (typically `C:\Program Files (x86)\MetaTrader 4\MQL4\Libraries`)
   - Copy the MQH files to your MT4's `Include` folder (typically `C:\Program Files (x86)\MetaTrader 4\MQL4\Include`)

### Step 2: Install the RobotRaddingDream MT4 Bridge

1. In the RobotRaddingDream repository, navigate to the MT4 bridge folder:

```bash
cd tools/mt4-bridge
```

2. Install the bridge dependencies:

```bash
npm install
```

3. Copy the MT4 Expert Advisor (EA) to your MT4 installation:
   - Locate the `RobotRaddingDream_Bridge.mq4` file in the `tools/mt4-bridge/ea` folder
   - Copy it to your MT4's `Experts` folder (typically `C:\Program Files (x86)\MetaTrader 4\MQL4\Experts`)

### Step 3: Compile and Attach the Expert Advisor

1. Open your MT4 terminal
2. Press `F4` to open the MetaEditor
3. Navigate to the `Experts` folder in the Navigator panel
4. Double-click on `RobotRaddingDream_Bridge.mq4` to open it
5. Press `F7` or click the "Compile" button to compile the EA
6. Close the MetaEditor and return to MT4
7. In the Navigator panel, find the compiled EA under the `Expert Advisors` section
8. Drag and drop it onto the chart of the currency pair you want to trade
9. In the EA settings dialog:
   - Set the connection port (default: 5555)
   - Enable "Allow live trading"
   - Enable "Allow DLL imports"
   - Click "OK"

### Step 4: Start the MT4 Bridge

1. In the RobotRaddingDream repository, start the MT4 bridge:

```bash
cd tools/mt4-bridge
node bridge.js
```

2. You should see output confirming the bridge is running:

```
MT4 Bridge started on port 5555
Waiting for MT4 connection...
```

### Step 5: Configure the RobotRaddingDream Platform for MT4

1. Create or modify the `.env` file in the root directory:

```
TRADING_PLATFORM=mt4
MT4_BRIDGE_HOST=localhost
MT4_BRIDGE_PORT=5555
```

2. Start the RobotRaddingDream platform:

```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`
4. Log in and navigate to the **Trading Dashboard**
5. Verify that the platform shows "Connected to MT4" in the status area

## MetaTrader 5 (MT5) Connection Guide

The process for MT5 is similar to MT4 but uses MT5-specific components.

### Step 1: Install MT5 and Required Components

1. Download and install MetaTrader 5 from your broker's website
2. Log in to your MT5 account
3. Install the ZeroMQ bridge for MT5:
   - Download the [ZeroMQ for MT5 package](https://github.com/dingmaotu/mql-zmq/releases)
   - Copy the DLL files to your MT5's `Library` folder (typically `C:\Program Files\MetaTrader 5\MQL5\Libraries`)
   - Copy the MQH files to your MT5's `Include` folder (typically `C:\Program Files\MetaTrader 5\MQL5\Include`)

### Step 2: Install the RobotRaddingDream MT5 Bridge

1. In the RobotRaddingDream repository, navigate to the MT5 bridge folder:

```bash
cd tools/mt5-bridge
```

2. Install the bridge dependencies:

```bash
npm install
```

3. Copy the MT5 Expert Advisor (EA) to your MT5 installation:
   - Locate the `RobotRaddingDream_Bridge.mq5` file in the `tools/mt5-bridge/ea` folder
   - Copy it to your MT5's `Experts` folder (typically `C:\Program Files\MetaTrader 5\MQL5\Experts`)

### Step 3: Compile and Attach the Expert Advisor

1. Open your MT5 terminal
2. Press `F4` to open the MetaEditor
3. Navigate to the `Experts` folder in the Navigator panel
4. Double-click on `RobotRaddingDream_Bridge.mq5` to open it
5. Press `F7` or click the "Compile" button to compile the EA
6. Close the MetaEditor and return to MT5
7. In the Navigator panel, find the compiled EA under the `Expert Advisors` section
8. Drag and drop it onto the chart of the currency pair you want to trade
9. In the EA settings dialog:
   - Set the connection port (default: 5556)
   - Enable "Allow live trading"
   - Enable "Allow DLL imports"
   - Click "OK"

### Step 4: Start the MT5 Bridge

1. In the RobotRaddingDream repository, start the MT5 bridge:

```bash
cd tools/mt5-bridge
node bridge.js
```

2. You should see output confirming the bridge is running:

```
MT5 Bridge started on port 5556
Waiting for MT5 connection...
```

### Step 5: Configure the RobotRaddingDream Platform for MT5

1. Create or modify the `.env` file in the root directory:

```
TRADING_PLATFORM=mt5
MT5_BRIDGE_HOST=localhost
MT5_BRIDGE_PORT=5556
```

2. Start the RobotRaddingDream platform:

```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`
4. Log in and navigate to the **Trading Dashboard**
5. Verify that the platform shows "Connected to MT5" in the status area

## Troubleshooting

### Capital.com Connection Issues

1. **API Key Invalid Error**
   - Verify your API key and secret are correctly copied to the `.env` file
   - Check if your API key has expired (they typically expire after 90 days)
   - Regenerate a new API key from the Capital.com dashboard if necessary

2. **Connection Timeout**
   - Check your internet connection
   - Verify that Capital.com services are operational
   - Ensure your IP address is not blocked by Capital.com

3. **Permission Denied**
   - Verify that your API key has the necessary permissions
   - Check if you need to enable specific features in your Capital.com account

### MT4/MT5 Connection Issues

1. **Bridge Connection Failed**
   - Ensure the MT4/MT5 terminal is running
   - Verify that the EA is attached to a chart and enabled
   - Check if the ports match between the bridge and the EA settings
   - Restart both the terminal and the bridge

2. **DLL Import Error**
   - Make sure "Allow DLL imports" is enabled in the EA settings
   - Verify that the ZeroMQ DLLs are correctly installed in the Libraries folder
   - Check if your antivirus is blocking the DLL operations

3. **Order Execution Failed**
   - Ensure your account has sufficient funds
   - Check if trading is allowed for the selected instrument
   - Verify that your broker allows algorithmic trading

## Security Best Practices

1. **API Key Protection**
   - Never share your API keys or credentials
   - Store your `.env` file securely and exclude it from version control
   - Regularly rotate your API keys (every 30-90 days)

2. **Use Demo Mode First**
   - Always test your strategy in demo mode before using real funds
   - Set `CAPITAL_COM_DEMO_MODE=true` or use a demo MT4/MT5 account

3. **Risk Management**
   - Set appropriate position sizes (1-2% of account balance per trade)
   - Always use stop-loss orders
   - Monitor your strategy's performance regularly

4. **System Security**
   - Keep your operating system and trading software updated
   - Use a dedicated computer for trading if possible
   - Enable two-factor authentication on your trading accounts

5. **Network Security**
   - Use a secure, private network for trading
   - Consider using a VPN for additional security
   - Avoid public Wi-Fi networks when accessing trading platforms

By following this detailed guide, you should be able to successfully connect the RobotRaddingDream platform to your preferred trading platform and start using the advanced multi-indicator trading strategy with self-correction mechanisms.
