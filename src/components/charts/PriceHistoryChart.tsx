import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Card, CardContent, Divider } from '@mui/material';
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
  ChartOptions
} from 'chart.js';
import CapitalComService from '../../services/capitalcom/CapitalComService';
import { useAuth } from '../../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceHistoryChartProps {
  symbol: string;
  timeframe: string;
  rsiPeriod: number;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ symbol, timeframe, rsiPeriod }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [rsiData, setRsiData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create Capital.com service
        const capitalComService = new CapitalComService(user.isDemo);

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

        // Calculate time range based on timeframe
        const now = new Date();
        let from = new Date();

        // Determine how far back to fetch data based on timeframe
        switch (timeframe) {
          case 'MINUTE':
            from.setMinutes(from.getMinutes() - (rsiPeriod + 50));
            break;
          case 'MINUTE_5':
            from.setMinutes(from.getMinutes() - (rsiPeriod + 50) * 5);
            break;
          case 'MINUTE_15':
            from.setMinutes(from.getMinutes() - (rsiPeriod + 50) * 15);
            break;
          case 'MINUTE_30':
            from.setMinutes(from.getMinutes() - (rsiPeriod + 50) * 30);
            break;
          case 'HOUR':
            from.setHours(from.getHours() - (rsiPeriod + 50));
            break;
          case 'HOUR_4':
            from.setHours(from.getHours() - (rsiPeriod + 50) * 4);
            break;
          case 'DAY':
            from.setDate(from.getDate() - (rsiPeriod + 50));
            break;
          default:
            from.setHours(from.getHours() - (rsiPeriod + 50));
        }

        // Fetch price history
        const priceHistory = await capitalComService.getPriceHistory(
          symbol,
          timeframe,
          from.getTime(),
          now.getTime()
        );

        // Process price data
        const prices = priceHistory.prices;
        setPriceData(prices);

        // Format labels (dates)
        const formattedLabels = prices.map(price => {
          const date = new Date(price.time);
          return timeframe.includes('MINUTE') 
            ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
            : timeframe.includes('HOUR')
              ? `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
              : `${date.getMonth() + 1}/${date.getDate()}`;
        });
        setLabels(formattedLabels);

        // Calculate RSI
        calculateRSI(prices, rsiPeriod);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch price history:', error);
        setError('Failed to fetch price history data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, rsiPeriod, user]);

  // Calculate RSI values from price data
  const calculateRSI = (prices: any[], period: number) => {
    if (prices.length < period + 1) {
      setError('Not enough data to calculate RSI');
      return;
    }

    // Calculate price changes
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i].close - prices[i - 1].close);
    }

    // Calculate RSI for each period
    const rsiValues = [];
    
    for (let i = period; i < changes.length; i++) {
      const periodChanges = changes.slice(i - period, i);
      const gains = periodChanges.filter(change => change > 0).reduce((sum, change) => sum + change, 0);
      const losses = periodChanges.filter(change => change < 0).reduce((sum, change) => sum + Math.abs(change), 0);
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      
      if (avgLoss === 0) {
        rsiValues.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiValues.push(rsi);
      }
    }

    // Pad the beginning with nulls to align with price data
    const paddedRsi = Array(period).fill(null).concat(rsiValues);
    setRsiData(paddedRsi);
  };

  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        position: 'left',
        title: {
          display: true,
          text: 'Price'
        }
      },
      y1: {
        position: 'right',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'RSI'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
  };

  // Chart data
  const data = {
    labels: labels,
    datasets: [
      {
        label: `${symbol} Price`,
        data: priceData.map(price => price.close),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'RSI',
        data: rsiData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Line options={options} data={data} />
      )}
    </Box>
  );
};

export default PriceHistoryChart;
