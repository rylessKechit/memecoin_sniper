// src/types.ts

export interface TokenData {
  address: string;
  mint: string;
  name: string;
  symbol: string;
  price: number;
  liquidity: number;
  marketCap: number;
  holders?: number;
  volume24h?: number;
  priceChange24h?: number;
  isRenounced?: boolean;
  isLPBurned?: boolean;
  timestamp: number;
}

export interface TokenLaunch {
  signature: string;
  tokenMint: string;
  poolAddress: string;
  timestamp: number;
  initialLiquiditySOL: number;
  initialLiquidityUSD: number;
  lpBurned: boolean;
  mintAuthorityRenounced: boolean;
  freezeAuthorityRenounced: boolean;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

export interface PriceData {
  price: number;
  volume24h: number;
  priceChange24h: number;
  marketCap: number;
}

export interface TradeSimulation {
  tokenAddress: string;
  entryPrice: number;
  exitPrice?: number;
  profit?: number;
  holdTime?: number;
  exitReason?: 'stop_loss' | 'take_profit' | 'timeout';
  size: number;
}

export interface SimulationConfig {
  initialBalance: number;
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  minLiquidityUSD: number;
  maxInitialMarketCap: number;
  mustBeRenounced: boolean;
}

export interface Stats {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  maxDrawdown: number;
  monthlyReturn: number;
  balance: number;
}