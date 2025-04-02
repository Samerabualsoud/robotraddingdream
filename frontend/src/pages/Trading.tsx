import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import TradingViewWidget from '../components/charts/TradingViewWidget';
import { useAuth } from '../contexts/AuthContext';
import mt4Service from '../services/mt4Service';
import { TradePosition, MarketData } from '../types/mt4Types';
import './Trading.css';

const Trading: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, accountInfo } = useAuth();
  const [symbol, setSymbol] = useState<string>('EURUSD');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [volume, setVolume] = useState<number>(0.01);
  const [stopLoss, setStopLoss] = useState<number | undefined>(undefined);
  const [takeProfit, setTakeProfit] = useState<number | undefined>(undefined);
  const [positions, setPositions] = useState<TradePosition[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Fetch positions and market data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsData, marketDataResult] = await Promise.all([
          mt4Service.getPositions(),
          mt4Service.getMarketData(symbol)
        ]);
        
        setPositions(positionsData);
        setMarketData(marketDataResult);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch trading data. Please try again.');
      }
    };

    fetchData();

    // Set up interval to refresh data
    const intervalId = setInterval(fetchData, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [symbol]);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    // Reset stop loss and take profit when symbol changes
    setStopLoss(undefined);
    setTakeProfit(undefined);
  };

  const calculateStopLoss = (type: 'buy' | 'sell', pips: number) => {
    if (!marketData) return undefined;
    
    const pipValue = 0.0001; // For most pairs, adjust for JPY pairs
    if (type === 'buy') {
      return Number((marketData.bid - (pips * pipValue)).toFixed(5));
    } else {
      return Number((marketData.ask + (pips * pipValue)).toFixed(5));
    }
  };

  const calculateTakeProfit = (type: 'buy' | 'sell', pips: number) => {
    if (!marketData) return undefined;
    
    const pipValue = 0.0001; // For most pairs, adjust for JPY pairs
    if (type === 'buy') {
      return Number((marketData.bid + (pips * pipValue)).toFixed(5));
    } else {
      return Number((marketData.ask - (pips * pipValue)).toFixed(5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await mt4Service.placeTrade({
        symbol,
        type: orderType,
        volume,
        stopLoss,
        takeProfit
      });
      
      if (result) {
        setSuccess(`Order placed successfully: ${orderType.toUpperCase()} ${volume} ${symbol}`);
        // Refresh positions
        const updatedPositions = await mt4Service.getPositions();
        setPositions(updatedPositions);
      } else {
        setError('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setError('Error placing order. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (ticket: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await mt4Service.closePosition(ticket);
      
      if (result) {
        setSuccess(`Position #${ticket} closed successfully`);
        // Refresh positions
        const updatedPositions = await mt4Service.getPositions();
        setPositions(updatedPositions);
      } else {
        setError(`Failed to close position #${ticket}`);
      }
    } catch (err) {
      console.error('Close position error:', err);
      setError('Error closing position. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trading-page">
      <Navigation />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                Trading
              </Typography>
              {accountInfo && (
                <Box>
                  <Typography variant="body1">
                    Balance: <strong>${accountInfo.balance.toFixed(2)}</strong> | 
                    Equity: <strong>${accountInfo.equity.toFixed(2)}</strong> | 
                    Free Margin: <strong>${accountInfo.freeMargin.toFixed(2)}</strong>
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Alerts */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Grid>
          )}
          
          {success && (
            <Grid item xs={12}>
              <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
            </Grid>
          )}

          {/* Chart Section */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button 
                    variant={symbol === 'EURUSD' ? 'contained' : 'outlined'} 
                    onClick={() => handleSymbolChange('EURUSD')}
                  >
                    EUR/USD
                  </Button>
                  <Button 
                    variant={symbol === 'GBPUSD' ? 'contained' : 'outlined'} 
                    onClick={() => handleSymbolChange('GBPUSD')}
                  >
                    GBP/USD
                  </Button>
                  <Button 
                    variant={symbol === 'USDJPY' ? 'contained' : 'outlined'} 
                    onClick={() => handleSymbolChange('USDJPY')}
                  >
                    USD/JPY
                  </Button>
                  <Button 
                    variant={symbol === 'AUDUSD' ? 'contained' : 'outlined'} 
                    onClick={() => handleSymbolChange('AUDUSD')}
                  >
                    AUD/USD
                  </Button>
                </Box>
                
                {marketData && (
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ py: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="subtitle2">Bid</Typography>
                          <Typography variant="h6" color="primary">{marketData.bid.toFixed(5)}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="subtitle2">Ask</Typography>
                          <Typography variant="h6" color="secondary">{marketData.ask.toFixed(5)}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="subtitle2">Spread</Typography>
                          <Typography variant="h6">{marketData.spread.toFixed(1)} pips</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="subtitle2">Updated</Typography>
                          <Typography variant="body2">
                            {new Date(marketData.time).toLocaleTimeString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Box>
              
              <Box sx={{ height: 'calc(100% - 120px)', minHeight: '400px' }}>
                <TradingViewWidget symbol={symbol} />
              </Box>
            </Paper>
          </Grid>

          {/* Order Form */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Place Order
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button 
                        type="button"
                        variant={orderType === 'buy' ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        onClick={() => setOrderType('buy')}
                        sx={{ py: 1 }}
                      >
                        BUY
                      </Button>
                      <Button 
                        type="button"
                        variant={orderType === 'sell' ? 'contained' : 'outlined'}
                        color="secondary"
                        fullWidth
                        onClick={() => setOrderType('sell')}
                        sx={{ py: 1 }}
                      >
                        SELL
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Volume
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {[0.01, 0.05, 0.1, 0.5, 1].map((vol) => (
                        <Button 
                          key={vol}
                          type="button"
                          variant={volume === vol ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setVolume(vol)}
                        >
                          {vol}
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Stop Loss (pips)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {[0, 10, 20, 50, 100].map((pips) => (
                        <Button 
                          key={pips}
                          type="button"
                          variant={stopLoss === calculateStopLoss(orderType, pips) ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setStopLoss(pips === 0 ? undefined : calculateStopLoss(orderType, pips))}
                        >
                          {pips === 0 ? 'None' : pips}
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Take Profit (pips)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {[0, 10, 20, 50, 100].map((pips) => (
                        <Button 
                          key={pips}
                          type="button"
                          variant={takeProfit === calculateTakeProfit(orderType, pips) ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setTakeProfit(pips === 0 ? undefined : calculateTakeProfit(orderType, pips))}
                        >
                          {pips === 0 ? 'None' : pips}
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      type="submit"
                      variant="contained"
                      color={orderType === 'buy' ? 'primary' : 'secondary'}
                      fullWidth
                      size="large"
                      disabled={loading}
                      sx={{ mt: 2, py: 1.5 }}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        `${orderType.toUpperCase()} ${volume} ${symbol}`
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Open Positions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Open Positions
              </Typography>
              
              {positions.length === 0 ? (
                <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
                  No open positions
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ticket</TableCell>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Volume</TableCell>
                        <TableCell>Open Price</TableCell>
                        <TableCell>Stop Loss</TableCell>
                        <TableCell>Take Profit</TableCell>
                        <TableCell>Profit</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positions.map((position) => (
                        <TableRow key={position.ticket}>
                          <TableCell>{position.ticket}</TableCell>
                          <TableCell>{position.symbol}</TableCell>
                          <TableCell sx={{ 
                            color: position.type === 'buy' ? 'primary.main' : 'secondary.main',
                            fontWeight: 'bold'
                          }}>
                            {position.type.toUpperCase()}
                          </TableCell>
                          <TableCell>{position.volume}</TableCell>
                          <TableCell>{position.openPrice.toFixed(5)}</TableCell>
                          <TableCell>{position.stopLoss ? position.stopLoss.toFixed(5) : '-'}</TableCell>
                          <TableCell>{position.takeProfit ? position.takeProfit.toFixed(5) : '-'}</TableCell>
                          <TableCell sx={{ 
                            color: position.profit >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}>
                            {position.profit.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleClosePosition(position.ticket)}
                            >
                              Close
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Trading;
