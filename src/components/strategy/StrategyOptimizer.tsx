import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button, Divider, CircularProgress, Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TradingViewWidget from '../charts/TradingViewWidget';
import useIndicatorCombinationOptimizer from '../../services/capitalcom/IndicatorCombinationOptimizer';
import { useAuth } from '../../contexts/AuthContext';
import CapitalComService from '../../services/capitalcom/CapitalComService';

// Default optimizer configuration
const defaultOptimizerConfig = {
  symbol: 'EURUSD',
  timeframe: 'HOUR',
  historyDays: 30,
  optimizationMethod: 'walkForward',
  optimizationMetric: 'profitFactor',
  enableAutoUpdate: false
};

const StrategyOptimizer = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [capitalComService, setCapitalComService] = useState<CapitalComService | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Initialize optimizer with default configuration
  const {
    initializeOptimizer,
    isInitialized,
    isLoading,
    optimizedParameters,
    marketAnalysis,
    correlationMatrix,
    combinationRules,
    error
  } = useIndicatorCombinationOptimizer(defaultOptimizerConfig);
  
  // Initialize Capital.com service and optimizer
  useEffect(() => {
    const initializeServices = async () => {
      if (user && user.sessionToken) {
        try {
          // Create Capital.com service
          const service = new CapitalComService(user.isDemo || false);
          setCapitalComService(service);
          
          // Initialize optimizer
          await initializeOptimizer(service);
        } catch (error) {
          console.error('Failed to initialize services:', error);
        }
      }
    };
    
    initializeServices();
  }, [user, initializeOptimizer]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Format percentage values
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Format decimal values
  const formatDecimal = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };
  
  // Format correlation value with color
  const formatCorrelation = (value: number) => {
    let color = theme.palette.text.primary;
    
    if (value > 0.7) {
      color = theme.palette.success.main;
    } else if (value < -0.7) {
      color = theme.palette.error.main;
    } else if (Math.abs(value) < 0.3) {
      color = theme.palette.info.main;
    }
    
    return (
      <Typography variant="body2" style={{ color }}>
        {value.toFixed(2)}
      </Typography>
    );
  };
  
  // Apply optimized parameters to strategy
  const applyOptimizedParameters = () => {
    if (optimizedParameters) {
      console.log('Applying optimized parameters:', optimizedParameters);
      // In a real implementation, this would update the strategy parameters
      // For now, we'll just log the parameters
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Optimizing Trading Strategy...
        </Typography>
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Optimization Error
        </Typography>
        <Typography variant="body1">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => initializeOptimizer(capitalComService!)}
        >
          Retry Optimization
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Strategy Optimizer
      </Typography>
      
      <Grid container spacing={3}>
        {/* Main chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '500px' }}>
            <TradingViewWidget symbol={defaultOptimizerConfig.symbol} />
          </Paper>
        </Grid>
        
        {/* Market analysis */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '500px', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Market Analysis
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {marketAnalysis?.symbol || defaultOptimizerConfig.symbol} ({marketAnalysis?.timeframe || defaultOptimizerConfig.timeframe})
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Market Regime:
                  </Typography>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {marketAnalysis?.regime || 'Unknown'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Volatility:
                  </Typography>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {marketAnalysis?.volatility || 'Medium'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Sentiment:
                  </Typography>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {marketAnalysis?.sentiment || 'Neutral'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    ADX:
                  </Typography>
                  <Typography variant="h6">
                    {formatDecimal(marketAnalysis?.adx || 0)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    ATR:
                  </Typography>
                  <Typography variant="h6">
                    {formatDecimal(marketAnalysis?.atr || 0, 5)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Volatility %:
                  </Typography>
                  <Typography variant="h6">
                    {formatPercent(marketAnalysis?.volatilityPercent || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Indicator Weights
            </Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  RSI:
                </Typography>
                <Typography variant="h6">
                  {formatPercent((combinationRules?.weights?.rsi || 0.25) * 100)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  MACD:
                </Typography>
                <Typography variant="h6">
                  {formatPercent((combinationRules?.weights?.macd || 0.25) * 100)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  Moving Avg:
                </Typography>
                <Typography variant="h6">
                  {formatPercent((combinationRules?.weights?.ma || 0.25) * 100)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  Bollinger:
                </Typography>
                <Typography variant="h6">
                  {formatPercent((combinationRules?.weights?.bb || 0.25) * 100)}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Signal Thresholds
            </Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Buy Signal:
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatDecimal(combinationRules?.thresholds?.buy || 0.5)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  Sell Signal:
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatDecimal(combinationRules?.thresholds?.sell || -0.5)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Tabs for different sections */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Optimized Parameters" />
              <Tab label="Correlation Analysis" />
              <Tab label="Optimization Process" />
            </Tabs>
            
            {/* Optimized Parameters Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Optimized Strategy Parameters
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      RSI Parameters
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          RSI Period:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.rsiPeriod || 14}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          RSI Thresholds:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.oversoldThreshold || 30} / {optimizedParameters?.overboughtThreshold || 70}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Moving Average Parameters
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Fast MA:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.fastMAPeriod || 9}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Slow MA:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.slowMAPeriod || 21}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      MACD Parameters
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          Fast:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.macdFastPeriod || 12}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          Slow:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.macdSlowPeriod || 26}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          Signal:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.macdSignalPeriod || 9}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Bollinger Bands Parameters
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Period:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.bbPeriod || 20}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Deviation:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.bbDeviation || 2}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      ATR Parameters
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Period:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.atrPeriod || 14}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Risk Management
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Stop Loss:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.stopLossPercent || 1.0}%
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Take Profit:
                        </Typography>
                        <Typography variant="h6">
                          {optimizedParameters?.takeProfitPercent || 2.0}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    onClick={applyOptimizedParameters}
                    disabled={!optimizedParameters}
                  >
                    Apply Optimized Parameters
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Correlation Analysis Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Indicator Correlation Analysis
                </Typography>
                
                <Typography variant="body2" paragraph>
                  This analysis shows how different indicators correlate with each other. 
                  High positive correlation (>0.7) means indicators move together, 
                  high negative correlation (< -0.7) means they move in opposite directions, 
                  and low correlation (near 0) means they provide independent signals.
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      RSI Correlations
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          RSI-MACD:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.rsi_macd || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          RSI-Fast MA:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.rsi_fastMA || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          RSI-Slow MA:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.rsi_slowMA || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          RSI-BB Upper:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.rsi_bbUpper || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          RSI-BB Lower:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.rsi_bbLower || 0)}
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      MACD Correlations
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          MACD-Fast MA:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.macd_fastMA || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          MACD-Slow MA:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.macd_slowMA || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          MACD-BB Upper:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.macd_bbUpper || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          MACD-BB Lower:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.macd_bbLower || 0)}
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Moving Average Correlations
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Fast MA-Slow MA:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.fastMA_slowMA || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Fast MA-BB Upper:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.fastMA_bbUpper || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Fast MA-BB Lower:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.fastMA_bbLower || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Slow MA-BB Upper:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.slowMA_bbUpper || 0)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Slow MA-BB Lower:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.slowMA_bbLower || 0)}
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Bollinger Bands Correlations
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          BB Upper-BB Lower:
                        </Typography>
                        {formatCorrelation(correlationMatrix?.bbUpper_bbLower || 0)}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Correlation Insights
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    Based on the correlation analysis, the optimizer has adjusted indicator weights to favor less correlated indicators, 
                    ensuring that the strategy uses diverse signals. The combination rules have been optimized to account for these correlations.
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Optimization Process Tab */}
            {activeTab === 2 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Optimization Process
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Market Analysis
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        The optimizer first analyzes market conditions to determine the current regime (trending, ranging, or volatile), 
                        volatility level, and market sentiment. This analysis guides the optimization process by focusing on parameters 
                        that work best in the current market environment.
                      </Typography>
                      
                      <Typography variant="body2">
                        <strong>Current Market Regime:</strong> {marketAnalysis?.regime || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Volatility Level:</strong> {marketAnalysis?.volatility || 'Medium'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Market Sentiment:</strong> {marketAnalysis?.sentiment || 'Neutral'}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Parameter Optimization
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        The optimizer uses {defaultOptimizerConfig.optimizationMethod} optimization to find the best parameter combination. 
                        It evaluates each combination using {defaultOptimizerConfig.optimizationMetric} as the primary metric, 
                        testing on {defaultOptimizerConfig.historyDays} days of historical data.
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        For walk-forward optimization, the data is divided into in-sample and out-of-sample periods to ensure 
                        the parameters work well on unseen data and are not overfitted to historical data.
                      </Typography>
                      
                      <Typography variant="body2">
                        <strong>Parameters Tested:</strong> RSI, Moving Averages, MACD, Bollinger Bands, ATR
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Strategy Adaptation
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        The optimizer creates indicator combination rules based on market conditions and correlation analysis. 
                        These rules determine how signals from different indicators are weighted and combined to generate trading decisions.
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        The weights are dynamically adjusted based on market regime, volatility, sentiment, and the correlation 
                        between indicators. This ensures that the strategy adapts to changing market conditions and uses the most 
                        effective indicators for the current environment.
                      </Typography>
                      
                      <Typography variant="body2">
                        <strong>Confirmation Rules:</strong> {combinationRules?.confirmationRules?.length || 0} rules applied
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StrategyOptimizer;
