import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import io from 'socket.io-client';
import { MarketData } from '../types/mt4Types';

interface RealTimeTickerProps {
  symbol: string;
  onDataUpdate?: (data: MarketData) => void;
}

const RealTimeTicker: React.FC<RealTimeTickerProps> = ({ symbol, onDataUpdate }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);
    
    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to real-time data server');
      // Subscribe to the symbol
      socketRef.current.emit('subscribe', { symbol });
    });
    
    socketRef.current.on('marketData', (data: MarketData) => {
      if (data.symbol === symbol) {
        setMarketData(data);
        setLoading(false);
        
        // Call the callback if provided
        if (onDataUpdate) {
          onDataUpdate(data);
        }
      }
    });
    
    socketRef.current.on('error', (err: any) => {
      console.error('Socket error:', err);
      setError('Failed to connect to real-time data server');
      setLoading(false);
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from real-time data server');
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        // Unsubscribe from the symbol
        socketRef.current.emit('unsubscribe', { symbol });
        socketRef.current.disconnect();
      }
    };
  }, [symbol]);
  
  // When symbol changes, resubscribe
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      // Unsubscribe from previous symbol
      socketRef.current.emit('unsubscribe', { symbol: marketData?.symbol });
      
      // Subscribe to new symbol
      socketRef.current.emit('subscribe', { symbol });
      
      // Reset state
      setLoading(true);
      setMarketData(null);
    }
  }, [symbol, marketData?.symbol]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!marketData) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  // Calculate price movement
  const priceMovement = marketData.bid > (marketData.low + (marketData.high - marketData.low) / 2) ? 'up' : 'down';

  return (
    <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2">Bid</Typography>
          <Typography 
            variant="h6" 
            color={priceMovement === 'up' ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 'bold' }}
          >
            {marketData.bid.toFixed(5)}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2">Ask</Typography>
          <Typography 
            variant="h6" 
            color={priceMovement === 'up' ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 'bold' }}
          >
            {marketData.ask.toFixed(5)}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2">Spread</Typography>
          <Typography variant="h6">
            {marketData.spread.toFixed(1)} pips
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2">Updated</Typography>
          <Typography variant="body2">
            {new Date(marketData.time).toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RealTimeTicker;
