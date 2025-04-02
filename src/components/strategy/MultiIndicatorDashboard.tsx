import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button, Switch, FormControlLabel, Divider, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TradingViewWidget from '../charts/TradingViewWidget';
import RealTimeTicker from '../charts/RealTimeTicker';
import PriceHistoryChart from '../charts/PriceHistoryChart';
import useMultiIndicatorStrategy from '../../services/capitalcom/MultiIndicatorStrategy';
import { useAuth } from '../../contexts/AuthContext';
import CapitalComService from '../../services/capitalcom/CapitalComService';

// Default strategy parameters
const defaultStrategyParams = {
  symbol: 'EURUSD',
  timeframe: 'HOUR',
  // RSI parameters
  rsiPeriod: 14,
  overboughtThreshold: 70,
  oversoldThreshold: 30,
  // Moving Average parameters
  fastMAPeriod: 9,
  slowMAPeriod: 21,
  // MACD parameters
  macdFastPeriod: 12,
  macdSlowPeriod: 26,
  macdSignalPeriod: 9,
  // Bollinger Bands parameters
  bbPeriod: 20,
  bbDeviation: 2,
  // ATR parameters
  atrPeriod: 14,
  // Position sizing and risk management
  positionSize: 1.0,
  stopLossPercent: 1.0,
  takeProfitPercent: 2.0,
  // Trading settings
  enableAutoTrading: false,
  // Indicator weights (will be adjusted dynamically)
  rsiWeight: 0.25,
  macdWeight: 0.25,
  maWeight: 0.25,
  bbWeight: 0.25
};

const MultiIndicatorDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [capitalComService, setCapitalComService] = useState<CapitalComService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Initialize strategy with default parameters
  const {
    initializeStrategy,
    isInitialized,
    isRunning,
    indicatorValues,
    performanceMetrics,
    parameters,
    marketAnalysis,
    toggleStrategy
  } = useMultiIndicatorStrategy(defaultStrategyParams);
  
  // Initialize Capital.com service and strategy
  useEffect(() => {
    const initializeServices = async () => {
      if (user && user.sessionToken) {
        try {
          setIsLoading(true);
          
          // Create Capital.com service
          const service = new CapitalComService(user.isDemo || false);
          setCapitalComService(service);
          
          // Initialize strategy
          await initializeStrategy(service, user.sessionToken, user.isDemo || false);
          
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to initialize services:', error);
          setIsLoading(false);
        }
      }
    };
    
    initializeServices();
  }, [user, initializeStrategy]);
  
  // Format percentage values
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Format decimal values
  const formatDecimal = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Initializing Multi-Indicator Strategy...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Multi-Indicator Trading Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Main chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '500px' }}>
            <TradingViewWidget symbol={parameters.symbol} />
          </Paper>
        </Grid>
        
        {/* Strategy controls and info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '500px', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Strategy Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Symbol: <strong>{parameters.symbol}</strong>
              </Typography>
              <Typography variant="subtitle1">
                Timeframe: <strong>{parameters.timeframe}</strong>
              </Typography>
              <Typography variant="subtitle1">
                Market Regime: <strong>{marketAnalysis?.regime || 'Unknown'}</strong>
              </Typography>
              <Typography variant="subtitle1">
                Volatility: <strong>{marketAnalysis?.volatility || 'Medium'}</strong>
              </Typography>
              <Typography variant="subtitle1">
                Sentiment: <strong>{marketAnalysis?.sentiment || 'Neutral'}</strong>
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Current Indicators
            </Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  RSI: <strong>{formatDecimal(indicatorValues?.rsi || 0)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  MACD: <strong>{formatDecimal(indicatorValues?.macd?.histogram || 0, 5)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Fast MA: <strong>{formatDecimal(indicatorValues?.ma?.fast || 0, 5)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Slow MA: <strong>{formatDecimal(indicatorValues?.ma?.slow || 0, 5)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  BB Upper: <strong>{formatDecimal(indicatorValues?.bb?.upper || 0, 5)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  BB Lower: <strong>{formatDecimal(indicatorValues?.bb?.lower || 0, 5)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  ATR: <strong>{formatDecimal(indicatorValues?.atr || 0, 5)}</strong>
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Indicator Weights
            </Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  RSI: <strong>{formatPercent(parameters.rsiWeight * 100)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  MACD: <strong>{formatPercent(parameters.macdWeight * 100)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Moving Avg: <strong>{formatPercent(parameters.maWeight * 100)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Bollinger: <strong>{formatPercent(parameters.bbWeight * 100)}</strong>
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setShowSettings(!showSettings)}
              >
                {showSettings ? 'Hide Settings' : 'Show Settings'}
              </Button>
              
              <Button 
                variant={isRunning ? "contained" : "outlined"} 
                color={isRunning ? "error" : "success"}
                onClick={toggleStrategy}
                disabled={!isInitialized}
              >
                {isRunning ? 'Stop Strategy' : 'Start Strategy'}
              </Button>
            </Box>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={parameters.enableAutoTrading} 
                  onChange={() => {
                    // This would normally update the strategy parameters
                    console.log('Auto trading toggled');
                  }} 
                  color="primary"
                />
              }
              label="Enable Auto Trading"
            />
          </Paper>
        </Grid>
        
        {/* Performance metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Win Rate:
                </Typography>
                <Typography variant="h6" color={performanceMetrics?.winRate >= 50 ? 'success.main' : 'error.main'}>
                  {formatPercent(performanceMetrics?.winRate || 0)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Profit Factor:
                </Typography>
                <Typography variant="h6" color={performanceMetrics?.profitFactor >= 1 ? 'success.main' : 'error.main'}>
                  {formatDecimal(performanceMetrics?.profitFactor || 0)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Total Trades:
                </Typography>
                <Typography variant="h6">
                  {performanceMetrics?.totalTrades || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Profitable:
                </Typography>
                <Typography variant="h6">
                  {performanceMetrics?.profitableTrades || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Avg Win:
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatDecimal(performanceMetrics?.averageWin || 0)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Avg Loss:
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatDecimal(performanceMetrics?.averageLoss || 0)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Consecutive Wins:
                </Typography>
                <Typography variant="h6">
                  {performanceMetrics?.consecutiveWins || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  Consecutive Losses:
                </Typography>
                <Typography variant="h6">
                  {performanceMetrics?.consecutiveLosses || 0}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Indicator Performance
            </Typography>
            
            <Grid container spacing={2}>
              {performanceMetrics?.indicatorPerformance && Object.entries(performanceMetrics.indicatorPerformance).map(([indicator, data]) => (
                <Grid item xs={6} md={3} key={indicator}>
                  <Typography variant="body2">
                    {indicator.toUpperCase()} Accuracy:
                  </Typography>
                  <Typography variant="h6" color={data.accuracy >= 50 ? 'success.main' : 'error.main'}>
                    {formatPercent(data.accuracy || 0)}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        
        {/* Real-time ticker and price history */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Real-Time Data
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <RealTimeTicker symbol={parameters.symbol} />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Price History
            </Typography>
            
            <Box sx={{ height: '200px' }}>
              <PriceHistoryChart symbol={parameters.symbol} timeframe={parameters.timeframe} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Strategy settings (conditionally rendered) */}
        {showSettings && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Strategy Settings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    RSI Settings
                  </Typography>
                  
                  <Typography variant="body2">
                    Period: <strong>{parameters.rsiPeriod}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Overbought: <strong>{parameters.overboughtThreshold}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Oversold: <strong>{parameters.oversoldThreshold}</strong>
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Moving Average Settings
                  </Typography>
                  
                  <Typography variant="body2">
                    Fast Period: <strong>{parameters.fastMAPeriod}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Slow Period: <strong>{parameters.slowMAPeriod}</strong>
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    MACD Settings
                  </Typography>
                  
                  <Typography variant="body2">
                    Fast Period: <strong>{parameters.macdFastPeriod}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Slow Period: <strong>{parameters.macdSlowPeriod}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Signal Period: <strong>{parameters.macdSignalPeriod}</strong>
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Bollinger Bands Settings
                  </Typography>
                  
                  <Typography variant="body2">
                    Period: <strong>{parameters.bbPeriod}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Deviation: <strong>{parameters.bbDeviation}</strong>
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    ATR Settings
                  </Typography>
                  
                  <Typography variant="body2">
                    Period: <strong>{parameters.atrPeriod}</strong>
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Risk Management
                  </Typography>
                  
                  <Typography variant="body2">
                    Position Size: <strong>{parameters.positionSize}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Stop Loss: <strong>{parameters.stopLossPercent}%</strong>
                  </Typography>
                  <Typography variant="body2">
                    Take Profit: <strong>{parameters.takeProfitPercent}%</strong>
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="primary">
                  Save Settings
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MultiIndicatorDashboard;
