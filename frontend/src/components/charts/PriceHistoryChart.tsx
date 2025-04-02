import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import io from 'socket.io-client';
import { MarketData } from '../../types/mt4Types';
import { ChartData, ChartOptions } from '../../types/chartTypes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceHistoryChartProps {
  symbol: string;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

interface PricePoint {
  time: Date;
  price: number;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ 
  symbol, 
  timeframe = '5m' 
}) => {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const theme = useTheme();
  
  // Maximum number of data points to display
  const MAX_DATA_POINTS = 100;
  
  useEffect(() => {
    // Connect to WebSocket server
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);
    
    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to real-time data server for price history');
      // Subscribe to the symbol and timeframe
      socketRef.current.emit('subscribeHistory', { symbol, timeframe });
    });
    
    socketRef.current.on('priceHistory', (data: PricePoint[]) => {
      setPriceHistory(data);
      setLoading(false);
    });
    
    socketRef.current.on('priceUpdate', (data: MarketData) => {
      if (data.symbol === symbol) {
        setPriceHistory(prev => {
          // Add new price point
          const newPoint = {
            time: new Date(data.time),
            price: data.bid
          };
          
          // Create new array with the new point added
          const updated = [...prev, newPoint];
          
          // Limit the number of data points
          if (updated.length > MAX_DATA_POINTS) {
            return updated.slice(updated.length - MAX_DATA_POINTS);
          }
          
          return updated;
        });
      }
    });
    
    socketRef.current.on('error', (err: any) => {
      console.error('Socket error for price history:', err);
      setError('Failed to connect to real-time data server');
      setLoading(false);
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        // Unsubscribe
        socketRef.current.emit('unsubscribeHistory', { symbol, timeframe });
        socketRef.current.disconnect();
      }
    };
  }, [symbol, timeframe]);
  
  // When symbol or timeframe changes, resubscribe
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      // Reset state
      setLoading(true);
      setPriceHistory([]);
      
      // Unsubscribe from previous
      socketRef.current.emit('unsubscribeHistory', { symbol, timeframe });
      
      // Subscribe to new
      socketRef.current.emit('subscribeHistory', { symbol, timeframe });
    }
  }, [symbol, timeframe]);
  
  // Prepare chart data
  const chartData: ChartData = {
    labels: priceHistory.map(point => {
      const date = new Date(point.time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: `${symbol} Price`,
        data: priceHistory.map(point => point.price),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`, // 20% opacity
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };
  
  // Chart options
  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value: number) => value.toFixed(5)
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    animation: {
      duration: 0 // Disable animations for better performance with real-time data
    }
  };
  
  // Calculate price statistics
  const calculateStats = () => {
    if (priceHistory.length === 0) return { high: 0, low: 0, avg: 0, change: 0 };
    
    const prices = priceHistory.map(point => point.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Calculate price change (current vs first in the period)
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = ((last - first) / first) * 100;
    
    return { high, low, avg, change };
  };
  
  const stats = calculateStats();

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {symbol} Price History ({timeframe})
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">High</Typography>
              <Typography variant="body1" fontWeight="bold">
                {stats.high.toFixed(5)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">Low</Typography>
              <Typography variant="body1" fontWeight="bold">
                {stats.low.toFixed(5)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">Average</Typography>
              <Typography variant="body1" fontWeight="bold">
                {stats.avg.toFixed(5)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">Change</Typography>
              <Typography 
                variant="body1" 
                fontWeight="bold"
                color={stats.change >= 0 ? 'success.main' : 'error.main'}
              >
                {stats.change.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ height: 300 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Loading price history...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : priceHistory.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>No price data available</Typography>
          </Box>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </Box>
    </Paper>
  );
};

export default PriceHistoryChart;
