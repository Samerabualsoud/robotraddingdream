import axios from 'axios';

// Backend API URL - use the deployed backend URL
const API_BASE_URL = 'http://5000-ikfhftb7sb0b50dkpaulj-0b517b43.manus.computer';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// MT4 API services
export const mt4Api = {
  login: (credentials) => api.post('/api/mt4/login', credentials),
  logout: () => api.post('/api/mt4/logout'),
  getAccountInfo: () => api.get('/api/mt4/account'),
  getMarketData: (symbol) => api.get(`/api/mt4/market/${symbol}`),
  getPositions: () => api.get('/api/mt4/positions'),
  getTradeHistory: () => api.get('/api/mt4/history'),
  placeTrade: (tradeData) => api.post('/api/mt4/trade', tradeData),
  modifyPosition: (ticket, data) => api.put(`/api/mt4/position/${ticket}`, data),
  closePosition: (ticket) => api.delete(`/api/mt4/position/${ticket}`),
};

// MT5 API services
export const mt5Api = {
  login: (credentials) => api.post('/api/mt5/login', credentials),
  logout: () => api.post('/api/mt5/logout'),
  getAccountInfo: () => api.get('/api/mt5/account'),
  getMarketData: (symbol) => api.get(`/api/mt5/market/${symbol}`),
  getPositions: () => api.get('/api/mt5/positions'),
  getTradeHistory: () => api.get('/api/mt5/history'),
  placeTrade: (tradeData) => api.post('/api/mt5/trade', tradeData),
  modifyPosition: (ticket, data) => api.put(`/api/mt5/position/${ticket}`, data),
  closePosition: (ticket) => api.delete(`/api/mt5/position/${ticket}`),
};

// Capital.com API services
export const capitalComApi = {
  login: (credentials) => api.post('/api/capital/login', credentials),
  logout: () => api.post('/api/capital/logout'),
  getAccountInfo: () => api.get('/api/capital/account'),
  getMarketData: (symbol) => api.get(`/api/capital/market/${symbol}`),
  getPositions: () => api.get('/api/capital/positions'),
  getTradeHistory: () => api.get('/api/capital/history'),
  placeTrade: (tradeData) => api.post('/api/capital/trade', tradeData),
  modifyPosition: (dealId, data) => api.put(`/api/capital/position/${dealId}`, data),
  closePosition: (dealId) => api.delete(`/api/capital/position/${dealId}`),
};

export default api;
