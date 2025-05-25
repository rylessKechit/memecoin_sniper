import { useState, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Configuration Axios si disponible, sinon fetch natif
const createApiClient = () => {
  const request = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  };

  return {
    get: (endpoint) => request(endpoint),
    post: (endpoint, data) => request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    put: (endpoint, data) => request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (endpoint) => request(endpoint, {
      method: 'DELETE',
    }),
  };
};

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const client = createApiClient();

  const handleRequest = useCallback(async (requestFn) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const api = {
    // Status API
    getStatus: () => handleRequest(() => client.get('/status')),

    // Backtest API
    startBacktest: (config) => handleRequest(() => client.post('/backtest/start', config)),
    getBacktestStatus: (id) => handleRequest(() => client.get(`/backtest/${id}/status`)),
    getBacktestResults: (id) => handleRequest(() => client.get(`/backtest/${id}/results`)),
    stopBacktest: (id) => handleRequest(() => client.delete(`/backtest/${id}`)),
    getBacktestHistory: () => handleRequest(() => client.get('/backtest/history')),
    getActiveBacktests: () => handleRequest(() => client.get('/backtest/active')),

    // Configuration API
    loadConfigs: () => handleRequest(() => client.get('/configs')),
    saveConfig: (name, config) => handleRequest(() => client.post(`/configs/${name}`, config)),
    loadConfig: (name) => handleRequest(() => client.get(`/configs/${name}`)),
    deleteConfig: (name) => handleRequest(() => client.delete(`/configs/${name}`)),

    // Data API
    getMemecoins: () => handleRequest(() => client.get('/data/memecoin-list')),
    getCoinPrice: (coinId, days = 30) => handleRequest(() => client.get(`/data/price/${coinId}?days=${days}`)),
    getMarketOverview: () => handleRequest(() => client.get('/data/market-overview')),
    getTrendingCoins: () => handleRequest(() => client.get('/data/trending')),
    getPerformanceSummary: () => handleRequest(() => client.get('/data/performance-summary')),
    getTradingStatistics: () => handleRequest(() => client.get('/data/statistics')),
    exportData: (format = 'json') => handleRequest(() => client.post('/data/export', { format })),
  };

  return {
    api,
    loading,
    error,
    clearError: () => setError(null),
  };
};

// Hook pour les backtests en temps réel
export const useBacktest = () => {
  const [backtestId, setBacktestId] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const { api } = useApi();

  const startBacktest = useCallback(async (config) => {
    try {
      setIsRunning(true);
      setResults(null);
      setStatus(null);
      
      const response = await api.startBacktest(config);
      setBacktestId(response.backtest_id);
      
      return response.backtest_id;
    } catch (error) {
      setIsRunning(false);
      throw error;
    }
  }, [api]);

  const stopBacktest = useCallback(async () => {
    if (!backtestId) return;
    
    try {
      await api.stopBacktest(backtestId);
      setIsRunning(false);
      setStatus(prev => ({ ...prev, status: 'stopped' }));
    } catch (error) {
      console.error('Erreur arrêt backtest:', error);
      throw error;
    }
  }, [api, backtestId]);

  const pollStatus = useCallback(async () => {
    if (!backtestId || !isRunning) return;

    try {
      const statusResponse = await api.getBacktestStatus(backtestId);
      setStatus(statusResponse);

      if (statusResponse.status === 'completed') {
        const resultsResponse = await api.getBacktestResults(backtestId);
        setResults(resultsResponse);
        setIsRunning(false);
      } else if (statusResponse.status === 'failed') {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Erreur polling status:', error);
      setIsRunning(false);
    }
  }, [api, backtestId, isRunning]);

  return {
    backtestId,
    status,
    results,
    isRunning,
    startBacktest,
    stopBacktest,
    pollStatus,
    resetBacktest: () => {
      setBacktestId(null);
      setStatus(null);
      setResults(null);
      setIsRunning(false);
    }
  };
};

// Hook pour WebSocket en temps réel (optionnel)
export const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => setReadyState(1);
      ws.onclose = () => setReadyState(3);
      ws.onerror = () => setReadyState(3);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (error) {
          setLastMessage(event.data);
        }
      };
      
      setSocket(ws);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setReadyState(3);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [socket]);

  const sendMessage = useCallback((message) => {
    if (socket && readyState === 1) {
      socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }, [socket, readyState]);

  return {
    lastMessage,
    readyState,
    connect,
    disconnect,
    sendMessage,
  };
};