// src/simulator.ts
import { Pool } from 'pg';
import { TokenData, TradeSimulation, SimulationConfig, Stats } from './types';

export class TradingSimulator {
  private balance: number;
  private trades: TradeSimulation[] = [];
  private config: SimulationConfig;
  private db: Pool;
  
  constructor(config: SimulationConfig) {
    this.config = config;
    this.balance = config.initialBalance;
    this.db = new Pool({
      host: 'localhost',
      database: 'memecoin_bot',
      port: 5432,
    });
  }
  
  private meetsEntryCriteria(token: TokenData): boolean {
    // Vérifier les critères d'entrée
    if (token.liquidity < this.config.minLiquidityUSD) return false;
    if (token.marketCap > this.config.maxInitialMarketCap) return false;
    if (this.config.mustBeRenounced && !token.isRenounced) return false;
    
    return true;
  }
  
  async simulateTrade(token: TokenData): Promise<void> {
    // Vérifier les critères
    if (!this.meetsEntryCriteria(token)) return;
    
    // Calculer la taille de position
    const positionSize = Math.min(
      this.config.maxPositionSize, 
      this.balance * 0.05
    );
    
    if (positionSize < 10) return; // Position trop petite
    
    // Simuler l'entrée
    const trade: TradeSimulation = {
      tokenAddress: token.address,
      entryPrice: token.price,
      size: positionSize
    };
    
    // Simuler le suivi du prix (simplifié pour l'exemple)
    const priceEvolution = await this.getPriceEvolution(token.address);
    
    if (priceEvolution.length < 2) {
      console.log(`  ⚠️ Pas assez de données de prix (${priceEvolution.length} points)`);
      return;
    }
    
    // Utiliser le premier prix comme prix d'entrée
    trade.entryPrice = priceEvolution[0].price;
    
    console.log(`  💰 Prix d'entrée: ${trade.entryPrice.toFixed(10)}`);
    console.log(`  📊 ${priceEvolution.length} points de prix disponibles`);
    
    // Appliquer la stratégie de sortie
    let maxPrice = trade.entryPrice;
    let minPrice = trade.entryPrice;
    
    for (let i = 1; i < priceEvolution.length; i++) {
      const pricePoint = priceEvolution[i];
      const currentPrice = pricePoint.price;
      
      // Vérifier la validité du prix
      if (currentPrice <= 0 || !isFinite(currentPrice)) {
        console.log(`  ❌ Prix invalide détecté: ${currentPrice}`);
        continue;
      }
      
      maxPrice = Math.max(maxPrice, currentPrice);
      minPrice = Math.min(minPrice, currentPrice);
      
      const priceChange = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
      
      // Limiter les variations extrêmes (probablement des erreurs)
      if (Math.abs(priceChange) > 10000) {
        console.log(`  ⚠️ Variation irréaliste ignorée: ${priceChange.toFixed(2)}%`);
        continue;
      }
      
      // Stop loss
      if (priceChange <= -this.config.stopLossPercent) {
        trade.exitPrice = currentPrice;
        trade.exitReason = 'stop_loss';
        trade.profit = positionSize * (priceChange / 100);
        console.log(`  🔴 Stop loss à ${priceChange.toFixed(2)}%`);
        break;
      }
      
      // Take profit
      if (priceChange >= this.config.takeProfitPercent) {
        trade.exitPrice = currentPrice;
        trade.exitReason = 'take_profit';
        trade.profit = positionSize * (priceChange / 100);
        console.log(`  🟢 Take profit à ${priceChange.toFixed(2)}%`);
        break;
      }
    }
    
    // Si pas de sortie, timeout
    if (!trade.exitPrice) {
      const lastPrice = priceEvolution[priceEvolution.length - 1]?.price || trade.entryPrice;
      trade.exitPrice = lastPrice;
      trade.exitReason = 'timeout';
      trade.profit = positionSize * ((lastPrice - trade.entryPrice) / trade.entryPrice);
    }
    
    // Mettre à jour le solde (avec limite de sécurité)
    const maxRealisticProfit = positionSize * 10; // Max 10x sur une position
    const cappedProfit = Math.max(-positionSize, Math.min(trade.profit || 0, maxRealisticProfit));
    
    this.balance += cappedProfit;
    this.trades.push(trade);
    
    console.log(`📊 Trade simulé: ${token.symbol} - P&L: ${cappedProfit.toFixed(2)}$ (${trade.exitReason})`);
  }
  
  async getPriceEvolution(tokenAddress: string): Promise<any[]> {
    // Récupérer l'évolution des prix depuis la DB
    const result = await this.db.query(
      `SELECT price, timestamp FROM price_history 
       WHERE token_mint = $1 
       ORDER BY timestamp ASC`,
      [tokenAddress]
    );
    
    return result.rows;
  }
  
  async runBacktest(hours: number = 24): Promise<void> {
    console.log(`🚀 Démarrage du backtest sur ${hours} heures...`);
    
    // Récupérer tous les tokens lancés dans la période
    const tokens = await this.db.query(
      `SELECT DISTINCT tl.*, tm.name, tm.symbol 
       FROM token_launches tl
       LEFT JOIN token_metadata tm ON tl.token_mint = tm.token_mint
       WHERE tl.timestamp > $1
       ORDER BY tl.timestamp ASC`,
      [Math.floor(Date.now() / 1000) - (hours * 3600)]
    );
    
    console.log(`📈 ${tokens.rows.length} tokens à analyser`);
    
    let skippedCount = 0;
    let analyzedCount = 0;
    
    for (const row of tokens.rows) {
      // Vérifier s'il y a des données de prix
      const priceCheck = await this.db.query(
        'SELECT COUNT(*) as count FROM price_history WHERE token_mint = $1',
        [row.token_mint]
      );
      
      if (priceCheck.rows[0].count === '0') {
        skippedCount++;
        console.log(`⏭️ ${row.symbol || row.token_mint.slice(0,8)}: Pas de données de prix`);
        continue;
      }
      
      const tokenData: TokenData = {
        address: row.token_mint,
        mint: row.token_mint,
        name: row.name || 'Unknown',
        symbol: row.symbol || 'UNKNOWN',
        price: 0.00001, // Prix initial estimé
        liquidity: row.initial_liquidity_usd,
        marketCap: row.initial_liquidity_usd * 2, // Estimation
        isRenounced: row.mint_renounced,
        isLPBurned: row.lp_burned,
        timestamp: row.timestamp
      };
      
      console.log(`\n🔍 Analyse de ${tokenData.symbol}:`);
      console.log(`  - Liquidité: ${tokenData.liquidity}`);
      console.log(`  - Renounced: ${tokenData.isRenounced}`);
      console.log(`  - LP Burned: ${tokenData.isLPBurned}`);
      
      analyzedCount++;
      await this.simulateTrade(tokenData);
    }
    
    console.log(`\n📊 Résumé:`);
    console.log(`  - Tokens analysés: ${analyzedCount}`);
    console.log(`  - Tokens ignorés (pas de prix): ${skippedCount}`);
    
    console.log('\n📊 Résultats du backtest:');
    console.log(this.getStats());
  }
  
  calculateWinRate(): number {
    const wins = this.trades.filter(t => (t.profit || 0) > 0).length;
    return this.trades.length > 0 ? (wins / this.trades.length) * 100 : 0;
  }
  
  calculateAvgProfit(): number {
    if (this.trades.length === 0) return 0;
    const totalProfit = this.trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    return totalProfit / this.trades.length;
  }
  
  calculateMaxDrawdown(): number {
    let peak = this.config.initialBalance;
    let maxDrawdown = 0;
    let runningBalance = this.config.initialBalance;
    
    for (const trade of this.trades) {
      runningBalance += trade.profit || 0;
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return maxDrawdown;
  }
  
  calculateMonthlyReturn(): number {
    const profit = this.balance - this.config.initialBalance;
    const returnPercent = (profit / this.config.initialBalance) * 100;
    // Extrapoler sur 30 jours si nécessaire
    return returnPercent;
  }
  
  getStats(): Stats {
    return {
      totalTrades: this.trades.length,
      winRate: this.calculateWinRate(),
      avgProfit: this.calculateAvgProfit(),
      maxDrawdown: this.calculateMaxDrawdown(),
      monthlyReturn: this.calculateMonthlyReturn(),
      balance: this.balance
    };
  }
  
  async close(): Promise<void> {
    await this.db.end();
  }
}

// Script principal pour lancer le simulateur
async function main() {
  const config: SimulationConfig = {
    initialBalance: 1000,
    maxPositionSize: 50,
    stopLossPercent: 30,
    takeProfitPercent: 100,
    minLiquidityUSD: 1000,  // Réduit de 5000 à 1000
    maxInitialMarketCap: 500000,  // Augmenté de 50k à 500k
    mustBeRenounced: false  // Désactivé pour l'instant
  };
  
  console.log('⚙️ Configuration:');
  console.log(`  - Balance initiale: ${config.initialBalance}`);
  console.log(`  - Position max: ${config.maxPositionSize}`);
  console.log(`  - Stop Loss: -${config.stopLossPercent}%`);
  console.log(`  - Take Profit: +${config.takeProfitPercent}%`);
  console.log(`  - Liquidité min: ${config.minLiquidityUSD}`);
  console.log(`  - Market cap max: ${config.maxInitialMarketCap}`);
  console.log(`  - Doit être renounced: ${config.mustBeRenounced}\n`);
  
  const simulator = new TradingSimulator(config);
  await simulator.runBacktest(24);
  await simulator.close();
}

if (require.main === module) {
  main().catch(console.error);
}