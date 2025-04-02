import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Paper, Grid, Divider, CircularProgress } from '@mui/material';
import { useAdaptiveRsiStrategy, TradingStrategyProps } from '../../services/capitalcom/AdaptiveRsiStrategy';
import TradingViewWidget from '../charts/TradingViewWidget';
import RealTimeTicker from '../charts/RealTimeTicker';
import PriceHistoryChart from '../charts/PriceHistoryChart';

const StrategyDashboard: React.FC = () => {
  // Default strategy configuration
  const defaultConfig: TradingStrategyProps = {
    symbol: 'EURUSD',
    timeframe: 'HOUR',
    rsiPeriod: 14,
    overboughtThreshold: 70,
    oversoldThreshold: 30,
    positionSize: 1.0,
    stopLossPercent: 1.0,
    takeProfitPercent: 2.0,
    enableAutoTrading: false
  };
  
  // State for strategy configuration
  const [config, setConfig] = useState<TradingStrategyProps>(defaultConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [tempConfig, setTempConfig] = useState<TradingStrategyProps>(defaultConfig);
  
  // Available symbols and timeframes
  const availableSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'GOLD', 'SILVER', 'BTCUSD', 'ETHUSD'];
  const availableTimeframes = [
    { value: 'MINUTE', label: '1 Minute' },
    { value: 'MINUTE_5', label: '5 Minutes' },
    { value: 'MINUTE_15', label: '15 Minutes' },
    { value: 'MINUTE_30', label: '30 Minutes' },
    { value: 'HOUR', label: '1 Hour' },
    { value: 'HOUR_4', label: '4 Hours' },
    { value: 'DAY', label: '1 Day' }
  ];
  
  // Use the strategy hook
  const {
    isInitialized,
    isRunning,
    currentRSI,
    performanceMetrics,
    parameters,
    toggleStrategy
  } = useAdaptiveRsiStrategy(config);
  
  // Update local parameters when strategy parameters change
  useEffect(() => {
    if (parameters && Object.keys(parameters).length > 0) {
      setConfig(parameters);
    }
  }, [parameters]);
  
  // Handle editing configuration
  const handleEditConfig = () => {
    setTempConfig({...config});
    setIsEditing(true);
  };
  
  // Handle saving configuration
  const handleSaveConfig = () => {
    setConfig({...tempConfig});
    setIsEditing(false);
  };
  
  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setTempConfig(prev => ({
        ...prev,
        [name]: typeof prev[name as keyof TradingStrategyProps] === 'number' 
          ? parseFloat(value as string) 
          : value
      }));
    }
  };
  
  // Handle toggle for auto trading
  const handleAutoTradingToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempConfig(prev => ({
      ...prev,
      enableAutoTrading: e.target.checked
    }));
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Adaptive RSI Strategy Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Chart Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <TradingViewWidget symbol={`FX:${config.symbol}`} />
          </Paper>
        </Grid>
        
        {/* Strategy Controls */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Strategy Controls
            </Typography>
            
            {isEditing ? (
              // Edit Mode
              <>
                <FormControl fullWidth margin="normal" size="small">
                  <InputLabel>Symbol</InputLabel>
                  <Select
                    name="symbol"
                    value={tempConfig.symbol}
                    label="Symbol"
                    onChange={handleInputChange}
                  >
                    {availableSymbols.map(symbol => (
                      <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal" size="small">
                  <InputLabel>Timeframe</InputLabel>
                  <Select
                    name="timeframe"
                    value={tempConfig.timeframe}
                    label="Timeframe"
                    onChange={handleInputChange}
                  >
                    {availableTimeframes.map(tf => (
                      <MenuItem key={tf.value} value={tf.value}>{tf.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  name="rsiPeriod"
                  label="RSI Period"
                  type="number"
                  value={tempConfig.rsiPeriod}
                  onChange={handleInputChange}
                  inputProps={{ min: 2, max: 50 }}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  name="overboughtThreshold"
                  label="Overbought Threshold"
                  type="number"
                  value={tempConfig.overboughtThreshold}
                  onChange={handleInputChange}
                  inputProps={{ min: 50, max: 90 }}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  name="oversoldThreshold"
                  label="Oversold Threshold"
                  type="number"
                  value={tempConfig.oversoldThreshold}
                  onChange={handleInputChange}
                  inputProps={{ min: 10, max: 50 }}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  name="positionSize"
                  label="Position Size"
                  type="number"
                  value={tempConfig.positionSize}
                  onChange={handleInputChange}
                  inputProps={{ min: 0.1, step: 0.1 }}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  name="stopLossPercent"
                  label="Stop Loss %"
                  type="number"
                  value={tempConfig.stopLossPercent}
                  onChange={handleInputChange}
                  inputProps={{ min: 0.1, step: 0.1 }}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  name="takeProfitPercent"
                  label="Take Profit %"
                  type="number"
                  value={tempConfig.takeProfitPercent}
                  onChange={handleInputChange}
                  inputProps={{ min: 0.1, step: 0.1 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.enableAutoTrading}
                      onChange={handleAutoTradingToggle}
                      name="enableAutoTrading"
                    />
                  }
                  label="Enable Auto Trading"
                />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSaveConfig}>
                    Save Configuration
                  </Button>
                </Box>
              </>
            ) : (
              // View Mode
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Symbol:</strong> {config.symbol}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Timeframe:</strong> {availableTimeframes.find(tf => tf.value === config.timeframe)?.label || config.timeframe}
                  </Typography>
                  <Typography variant="body1">
                    <strong>RSI Period:</strong> {config.rsiPeriod}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Thresholds:</strong> {config.oversoldThreshold} / {config.overboughtThreshold}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Position Size:</strong> {config.positionSize}
                  </Typography>
                  <Typography variant="body1">
                    <strong>SL/TP:</strong> {config.stopLossPercent}% / {config.takeProfitPercent}%
                  </Typography>
                  <Typography variant="body1">
                    <strong>Auto Trading:</strong> {config.enableAutoTrading ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    <strong>Current RSI:</strong>
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={
                      currentRSI > config.overboughtThreshold ? 'error' :
                      currentRSI < config.oversoldThreshold ? 'success' :
                      'text.primary'
                    }
                  >
                    {currentRSI.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleEditConfig}
                    disabled={!isInitialized}
                  >
                    Edit Configuration
                  </Button>
                  <Button 
                    variant="contained" 
                    color={isRunning ? 'error' : 'success'}
                    onClick={toggleStrategy}
                    disabled={!isInitialized}
                  >
                    {isRunning ? 'Stop Strategy' : 'Start Strategy'}
                  </Button>
                </Box>
                
                {!isInitialized && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Initializing strategy...
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
        
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            
            {performanceMetrics && 'winRate' in performanceMetrics ? (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Win Rate:</Typography>
                  <Typography variant="h6" color={performanceMetrics.winRate >= 50 ? 'success.main' : 'error.main'}>
                    {performanceMetrics.winRate.toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Profit Factor:</Typography>
                  <Typography variant="h6" color={performanceMetrics.profitFactor >= 1 ? 'success.main' : 'error.main'}>
                    {performanceMetrics.profitFactor.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Total Trades:</Typography>
                  <Typography variant="h6">
                    {performanceMetrics.totalTrades}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Profitable Trades:</Typography>
                  <Typography variant="h6">
                    {performanceMetrics.profitableTrades}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Average Win:</Typography>
                  <Typography variant="h6" color="success.main">
                    {performanceMetrics.averageWin.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Average Loss:</Typography>
                  <Typography variant="h6" color="error.main">
                    {performanceMetrics.averageLoss.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1">
                No performance data available yet. Start trading to collect metrics.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Real-time Ticker */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Real-time Price
            </Typography>
            <RealTimeTicker symbol={config.symbol} />
          </Paper>
        </Grid>
        
        {/* Price History Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Price History with RSI
            </Typography>
            <PriceHistoryChart symbol={config.symbol} timeframe={config.timeframe} rsiPeriod={config.rsiPeriod} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StrategyDashboard;
