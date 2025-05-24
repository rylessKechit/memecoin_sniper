// src/types/index.ts
// Types et interfaces pour le bot memecoin

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  currentPrice: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  marketCap: number;
  createdAt: Date;
  lastUpdated: Date;
  source: 'birdeye' | 'dexscreener';
}

export interface PricePoint {
  tokenAddress: string;
  timestamp: Date;
  price: number;
  volume: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

export interface Trade {
  id?: number;
  tokenAddress: string;
  tokenSymbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  positionSize: number; // en USD
  entryTime: Date;
  exitTime?: Date;
  duration?: number; // en minutes
  profit?: number;
  profitPercent?: number;
  exitReason?: 'take_profit' | 'stop_loss' | 'timeout' | 'manual';
  fees: number;
  slippage: number;
}

export interface TradingConfig {
  capital: number;
  maxPositionSize: number;
  maxPositionPercent: number; // % du capital max par trade
  stopLossPercent: number;
  takeProfitPercent: number;
  timeoutHours: number;
  minLiquidity: number;
  minVolume24h: number;
  maxSlippage: number;
  tradingFeePercent: number;
}

export interface PortfolioStats {
  totalValue: number;
  availableCash: number;
  totalProfit: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio?: number;
}

export interface CollectorConfig {
  enabled: boolean;
  apiKey?: string;
  rateLimit: number; // requêtes par seconde
  retryAttempts: number;
  timeout: number; // en ms
}

export interface MarketData {
  token: Token;
  priceHistory: PricePoint[];
  technicalIndicators?: {
    sma20?: number;
    sma50?: number;
    rsi?: number;
    macd?: number;
    bollinger?: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
}

export interface BacktestResult {
  config: TradingConfig;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  trades: Trade[];
  stats: PortfolioStats;
  dailyReturns: Array<{
    date: Date;
    portfolioValue: number;
    dailyReturn: number;
  }>;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
}

// Enums pour plus de type safety
export enum TradeSide {
  BUY = 'buy',
  SELL = 'sell'
}

export enum ExitReason {
  TAKE_PROFIT = 'take_profit',
  STOP_LOSS = 'stop_loss',
  TIMEOUT = 'timeout',
  MANUAL = 'manual'
}

export enum DataSource {
  BIRDEYE = 'birdeye',
  DEXSCREENER = 'dexscreener'
}

// Types utilitaires
export type TokenAddress = string;
export type Timestamp = number;
export type Price = number;
export type Volume = number;