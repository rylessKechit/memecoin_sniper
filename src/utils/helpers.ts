// src/utils/helpers.ts
// Fonctions utilitaires diverses

import { Token, PricePoint } from '../types';

// Fonction sleep pour les délais
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Formater un nombre en devise
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(amount);
};

// Formater un pourcentage
export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

// Calculer le pourcentage de changement
export const calculatePercentChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Valider une adresse de token (format basique)
export const isValidTokenAddress = (address: string): boolean => {
  // Pour Solana: 32-44 caractères alphanumériques
  return /^[A-Za-z0-9]{32,44}$/.test(address);
};

// Calculer la moyenne mobile simple
export const calculateSMA = (prices: number[], period: number): number[] => {
  const sma: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  
  return sma;
};

// Calculer le RSI (Relative Strength Index)
export const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculer les gains et pertes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculer RSI pour chaque point
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
};

// Calculer les bandes de Bollinger
export const calculateBollingerBands = (
  prices: number[], 
  period: number = 20, 
  stdDevMultiplier: number = 2
): { upper: number[], middle: number[], lower: number[] } => {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < sma.length; i++) {
    const dataIndex = i + period - 1;
    const slice = prices.slice(dataIndex - period + 1, dataIndex + 1);
    
    // Calculer l'écart-type
    const mean = sma[i];
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    upper.push(mean + (stdDev * stdDevMultiplier));
    lower.push(mean - (stdDev * stdDevMultiplier));
  }

  return { upper, middle: sma, lower };
};

// Détecter les niveaux de support et résistance
export const findSupportResistance = (prices: PricePoint[], window: number = 5): {
  support: number[],
  resistance: number[]
} => {
  const support: number[] = [];
  const resistance: number[] = [];
  
  for (let i = window; i < prices.length - window; i++) {
    const current = prices[i].price;
    const before = prices.slice(i - window, i).map(p => p.price);
    const after = prices.slice(i + 1, i + window + 1).map(p => p.price);
    
    // Support : minimum local
    if (before.every(p => p >= current) && after.every(p => p >= current)) {
      support.push(current);
    }
    
    // Résistance : maximum local
    if (before.every(p => p <= current) && after.every(p => p <= current)) {
      resistance.push(current);
    }
  }
  
  return { support, resistance };
};

// Calculer la volatilité (écart-type des rendements)
export const calculateVolatility = (prices: number[], annualize: boolean = false): number => {
  const returns: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(returnValue);
  }
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  return annualize ? volatility * Math.sqrt(365) : volatility;
};

// Calculer le ratio de Sharpe
export const calculateSharpeRatio = (
  returns: number[], 
  riskFreeRate: number = 0.02
): number => {
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = avgReturn - riskFreeRate / 365; // Ajuster pour rendement journalier
  const volatility = calculateVolatility(returns);
  
  return volatility > 0 ? excessReturn / volatility : 0;
};

// Nettoyer et valider les données de prix
export const sanitizePriceData = (prices: PricePoint[]): PricePoint[] => {
  return prices
    .filter(p => p.price > 0 && isFinite(p.price) && p.volume >= 0)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Détecter les anomalies dans les prix (spikes irréalistes)
export const detectPriceAnomalies = (
  prices: PricePoint[], 
  threshold: number = 10 // 10x changement = anomalie
): PricePoint[] => {
  const anomalies: PricePoint[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1].price;
    const currentPrice = prices[i].price;
    const change = Math.abs(currentPrice - prevPrice) / prevPrice;
    
    if (change > threshold) {
      anomalies.push(prices[i]);
    }
  }
  
  return anomalies;
};

// Grouper les tokens par critères
export const groupTokensByMarketCap = (tokens: Token[]): {
  micro: Token[],  // < 1M
  small: Token[],  // 1M - 10M
  mid: Token[],    // 10M - 100M
  large: Token[]   // > 100M
} => {
  return {
    micro: tokens.filter(t => t.marketCap < 1_000_000),
    small: tokens.filter(t => t.marketCap >= 1_000_000 && t.marketCap < 10_000_000),
    mid: tokens.filter(t => t.marketCap >= 10_000_000 && t.marketCap < 100_000_000),
    large: tokens.filter(t => t.marketCap >= 100_000_000)
  };
};

// Calculer la corrélation entre deux séries de prix
export const calculateCorrelation = (prices1: number[], prices2: number[]): number => {
  const minLength = Math.min(prices1.length, prices2.length);
  const x = prices1.slice(0, minLength);
  const y = prices2.slice(0, minLength);
  
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }
  
  const correlation = numerator / Math.sqrt(denomX * denomY);
  return isNaN(correlation) ? 0 : correlation;
};

// Générer un ID unique
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Throttle pour limiter l'exécution de fonctions
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastExec = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExec > delay) {
      func(...args);
      lastExec = now;
    }
  };
};

// Debounce pour retarder l'exécution
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};