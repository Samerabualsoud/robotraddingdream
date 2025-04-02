import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import CapitalComService from '../../services/capitalcom/CapitalComService';
import { useAuth } from '../../contexts/AuthContext';

interface RealTimeTickerProps {
  symbol: string;
}

const RealTimeTicker: React.FC<RealTimeTickerProps> = ({ symbol }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [marketData, setMarketData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let capitalComService: CapitalComService | null = null;
    let intervalId: NodeJS.Timeout;

    const initializeService = async () => {
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create Capital.com service
        capitalComService = new CapitalComService(user.isDemo);

        // Login to Capital.com
        const loginSuccess = await capitalComService.login({
          login: user.username,
          password: user.password,
          apiKey: user.apiKey,
          encryptedPassword: false
        });

        if (!loginSuccess) {
          setError('Failed to login to Capital.com');
          setIsLoading(false);
          return;
        }

        // Initial data fetch
        await fetchMarketData();
        setIsLoading(false);

        // Set up interval for regular updates
        intervalId = setInterval(fetchMarketData, 2000);
      } catch (error) {
        console.error('Failed to initialize service:', error);
        setError('Failed to initialize service');
        setIsLoading(false);
      }
    };

    const fetchMarketData = async () => {
      if (!capitalComService) return;

      try {
        const data = await capitalComService.getMarketData(symbol);
        setMarketData(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        setError('Failed to fetch market data');
      }
    };

    initializeService();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (capitalComService) {
        capitalComService.logout().catch(console.error);
      }
    };
  }, [symbol, user]);

  // Format price with appropriate decimal places
  const formatPrice = (price: number) => {
    // Most forex pairs have 4 or 5 decimal places
    const decimalPlaces = symbol.includes('JPY') ? 3 : 5;
    return price.toFixed(decimalPlaces);
  };

  // Calculate price change percentage
  const calculateChangePercent = () => {
    if (!marketData || !marketData.bid || !marketData.open) return 0;
    
    const change = ((marketData.bid - marketData.open) / marketData.open) * 100;
    return change;
  };

  return (
    <Box sx={{ p: 2 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : marketData ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {symbol}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
              <Typography variant="body2">Bid</Typography>
              <Typography variant="h6">{formatPrice(marketData.bid)}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6}>
            <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'white' }}>
              <Typography variant="body2">Ask</Typography>
              <Typography variant="h6">{formatPrice(marketData.ask)}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={4}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="body2">Spread</Typography>
              <Typography variant="body1">
                {((marketData.ask - marketData.bid) * Math.pow(10, symbol.includes('JPY') ? 3 : 5)).toFixed(1)} pips
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={4}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="body2">Change</Typography>
              <Typography 
                variant="body1" 
                color={calculateChangePercent() >= 0 ? 'success.main' : 'error.main'}
              >
                {calculateChangePercent().toFixed(2)}%
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={4}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="body2">High/Low</Typography>
              <Typography variant="body1">
                {marketData.high && marketData.low 
                  ? `${formatPrice(marketData.high)}/${formatPrice(marketData.low)}`
                  : 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Box>
  );
};

export default RealTimeTicker;
