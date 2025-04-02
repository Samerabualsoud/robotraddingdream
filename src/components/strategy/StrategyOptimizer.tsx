import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, Divider, Card, CardContent, Alert } from '@mui/material';
import { useEnhancedStrategyOptimizer } from '../../services/capitalcom/EnhancedStrategyOptimizer';
import { useAdaptiveRsiStrategy, TradingStrategyProps } from '../../services/capitalcom/AdaptiveRsiStrategy';
import CapitalComService from '../../services/capitalcom/CapitalComService';
import { useAuth } from '../../contexts/AuthContext';

const StrategyOptimizer: React.FC = () => {
  const { user } = useAuth();
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('HOUR');
  const [capitalComService, setCapitalComService] = useState<CapitalComService | null>(null);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  
  // Use the enhanced strategy optimizer
  const {
    isInitialized,
    isLoading,
    optimizedParameters,
    marketAnalysis,
    error,
    initializeOptimizer
  } = useEnhancedStrategyOptimizer(symbol, timeframe);
  
  // Initialize Capital.com service
  useEffect(() => {
    const initService = async () => {
      if (!user) {
        setServiceError('User not authenticated');
        return;
      }
      
      try {
        // Create Capital.com service
        const service = new CapitalComService(user.isDemo);
        
        // Login to Capital.com
        const loginSuccess = await service.login({
          login: user.username,
          password: user.password,
          apiKey: user.apiKey,
          encryptedPassword: false
        });
        
        if (!loginSuccess) {
          setServiceError('Failed to login to Capital.com');
          return;
        }
        
        setCapitalComService(service);
        setIsServiceInitialized(true);
        setServiceError(null);
      } catch (error) {
        console.error('Failed to initialize Capital.com service:', error);
        setServiceError('Failed to initialize Capital.com service');
      }
    };
    
    initService();
    
    return () => {
      if (capitalComService) {
        capitalComService.logout().catch(console.error);
      }
    };
  }, [user]);
  
  // Initialize optimizer when service is ready
  useEffect(() => {
    if (isServiceInitialized && capitalComService) {
      initializeOptimizer(capitalComService);
    }
  }, [isServiceInitialized, capitalComService, initializeOptimizer]);
  
  // Apply optimized parameters to strategy
  const applyOptimizedParameters = () => {
    if (!optimizedParameters) return;
    
    // Parameters would be applied to the strategy here
    console.log('Applying optimized parameters:', optimizedParameters);
    
    // In a real implementation, this would update the strategy configuration
    // or navigate to the strategy dashboard with these parameters
  };
  
  // Format market regime for display
  const formatMarketRegime = (regime: string) => {
    switch (regime) {
      case 'trending':
        return { text: 'Trending', color: 'success.main' };
      case 'ranging':
        return { text: 'Ranging', color: 'info.main' };
      case 'volatile':
        return { text: 'Volatile', color: 'warning.main' };
      default:
        return { text: regime, color: 'text.primary' };
    }
  };
  
  // Format volatility level for display
  const formatVolatilityLevel = (level: string) => {
    switch (level) {
      case 'low':
        return { text: 'Low', color: 'success.main' };
      case 'medium':
        return { text: 'Medium', color: 'info.main' };
      case 'high':
        return { text: 'High', color: 'error.main' };
      default:
        return { text: level, color: 'text.primary' };
    }
  };
  
  // Format market sentiment for display
  const formatMarketSentiment = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return { text: 'Bullish', color: 'success.main' };
      case 'bearish':
        return { text: 'Bearish', color: 'error.main' };
      case 'neutral':
        return { text: 'Neutral', color: 'info.main' };
      default:
        return { text: sentiment, color: 'text.primary' };
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Strategy Optimizer
      </Typography>
      
      {serviceError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {serviceError}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Market Analysis Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Market Analysis
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : marketAnalysis ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    {marketAnalysis.symbol} ({marketAnalysis.timeframe})
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2">Market Regime:</Typography>
                  <Typography 
                    variant="body1" 
                    color={formatMarketRegime(marketAnalysis.marketRegime).color}
                    fontWeight="bold"
                  >
                    {formatMarketRegime(marketAnalysis.marketRegime).text}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2">Volatility:</Typography>
                  <Typography 
                    variant="body1" 
                    color={formatVolatilityLevel(marketAnalysis.volatilityLevel).color}
                    fontWeight="bold"
                  >
                    {formatVolatilityLevel(marketAnalysis.volatilityLevel).text}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2">Sentiment:</Typography>
                  <Typography 
                    variant="body1" 
                    color={formatMarketSentiment(marketAnalysis.marketSentiment).color}
                    fontWeight="bold"
                  >
                    {formatMarketSentiment(marketAnalysis.marketSentiment).text}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Correlations:
                  </Typography>
                  <Grid container spacing={1}>
                    {marketAnalysis.correlations && Object.entries(marketAnalysis.correlations).map(([symbol, correlation]: [string, any]) => (
                      <Grid item xs={6} key={symbol}>
                        <Typography variant="body2">
                          {symbol}: 
                          <Box 
                            component="span" 
                            sx={{ 
                              ml: 1,
                              color: correlation > 0.5 ? 'success.main' : 
                                    correlation < -0.5 ? 'error.main' : 
                                    'text.secondary',
                              fontWeight: Math.abs(correlation) > 0.7 ? 'bold' : 'normal'
                            }}
                          >
                            {Number(correlation).toFixed(2)}
                          </Box>
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              <Typography>No market analysis available</Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Optimized Parameters Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimized Strategy Parameters
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : optimizedParameters ? (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">RSI Period:</Typography>
                    <Typography variant="h6">
                      {optimizedParameters.rsiPeriod}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">RSI Thresholds:</Typography>
                    <Typography variant="h6">
                      {optimizedParameters.oversoldThreshold} / {optimizedParameters.overboughtThreshold}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">Stop Loss:</Typography>
                    <Typography variant="h6">
                      {optimizedParameters.stopLossPercent}%
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">Take Profit:</Typography>
                    <Typography variant="h6">
                      {optimizedParameters.takeProfitPercent}%
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={applyOptimizedParameters}
                  >
                    Apply Optimized Parameters
                  </Button>
                </Box>
              </>
            ) : (
              <Typography>No optimized parameters available</Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Optimization Explanation */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimization Process
            </Typography>
            
            <Typography variant="body1" paragraph>
              The Enhanced Strategy Optimizer uses advanced machine learning techniques to analyze market conditions and optimize trading parameters. The process includes:
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Market Analysis
                    </Typography>
                    <Typography variant="body2">
                      • Market regime detection (trending, ranging, volatile)<br />
                      • Volatility level assessment<br />
                      • Correlation analysis with related instruments<br />
                      • Market sentiment evaluation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Parameter Optimization
                    </Typography>
                    <Typography variant="body2">
                      • Walk-forward optimization<br />
                      • Multiple timeframe analysis<br />
                      • Adaptive parameter selection<br />
                      • Performance metrics evaluation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Strategy Adaptation
                    </Typography>
                    <Typography variant="body2">
                      • Dynamic parameter adjustment<br />
                      • Risk management optimization<br />
                      • Market condition-based strategy selection<br />
                      • Continuous performance monitoring
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StrategyOptimizer;
