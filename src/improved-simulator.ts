// src/improved-simulator.ts
import { Pool } from 'pg';

interface SimulationConfig {
  initialBalance: number;
  maxPositionSize: number;
  maxPositionPercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  minLiquidityUSD: number;
  maxSlippage: number;
}

interface TradeResult {
  tokenSymbol: string;
  tokenAddress: string;
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  positionSize: number;
  profitLoss: number;
  profitPercent: number;
  exitReason: string;
}

class ImprovedSimulator {
  private db: Pool;
  private config: SimulationConfig;
  private balance: number;
  private trades: TradeResult[] = [];
  
  constructor(config: SimulationConfig) {
    this.config = config;
    this.balance = config.initialBalance;
    this.db = new Pool({
      host: 'localhost',
      database: 'memecoin_bot',
      port: 5432,
    });
  }

  async runBacktest(hours: number = 24) {
    console.log('🚀 Démarrage du backtest amélioré...\n');
    console.log('⚙️ Configuration:');
    console.log(`  Balance initiale: $${this.config.initialBalance}`);
    console.log(`  Position max: $${this.config.maxPositionSize} (${this.config.maxPositionPercent}% du capital)`);
    console.log(`  Stop Loss: -${this.config.stopLossPercent}%`);
    console.log(`  Take Profit: +${this.config.takeProfitPercent}%`);
    console.log(`  Liquidité min: $${this.config.minLiquidityUSD}\n`);

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Récupérer les tokens éligibles
    const eligibleTokens = await this.db.query(`
      SELECT DISTINCT
        t.address,
        t.symbol,
        t.name,
        t.initial_liquidity_usd,
        t.created_at,
        MIN(tp.timestamp) as first_price_time,
        COUNT(tp.id) as price_points
      FROM tokens t
      INNER JOIN token_prices tp ON t.address = tp.token_address
      WHERE t.initial_liquidity_usd >= $1
        AND t.created_at >= $2
        AND tp.price_usd > 0
      GROUP BY t.address, t.symbol, t.name, t.initial_liquidity_usd, t.created_at
      HAVING COUNT(tp.id) >= 2
      ORDER BY t.created_at ASC
    `, [this.config.minLiquidityUSD, startTime]);

    console.log(`📊 ${eligibleTokens.rows.length} tokens éligibles trouvés\n`);

    // Simuler les trades
    for (const token of eligibleTokens.rows) {
      await this.simulateTrade(token);
    }

    // Afficher les résultats
    this.displayResults();
  }

  private async simulateTrade(token: any) {
    // Récupérer l'historique des prix
    const priceHistory = await this.db.query(`
      SELECT timestamp, price_usd, volume_24h, liquidity_usd
      FROM token_prices
      WHERE token_address = $1
        AND price_usd > 0
      ORDER BY timestamp ASC
    `, [token.address]);

    if (priceHistory.rows.length < 2) {
      console.log(`⏭️ ${token.symbol}: Pas assez de données de prix`);
      return;
    }

    const prices = priceHistory.rows;
    const entryPrice = parseFloat(prices[0].price_usd);
    const entryTime = new Date(prices[0].timestamp);
    
    // Vérifier si le prix est valide
    if (entryPrice <= 0 || !isFinite(entryPrice)) {
      console.log(`⏭️ ${token.symbol}: Prix d'entrée invalide`);
      return;
    }

    // Calculer la taille de position
    const positionPercent = Math.min(
      this.config.maxPositionPercent / 100,
      this.config.maxPositionSize / this.balance
    );
    const positionSize = this.balance * positionPercent;

    if (positionSize < 10) {
      console.log(`⏭️ ${token.symbol}: Position trop petite ($${positionSize.toFixed(2)})`);
      return;
    }

    console.log(`\n🔍 ${token.symbol} - Liq: $${parseFloat(token.initial_liquidity_usd).toLocaleString()}`);
    console.log(`  📈 Entrée: $${entryPrice.toExponential(4)} | Position: $${positionSize.toFixed(2)}`);

    // Simuler l'évolution du prix
    let exitPrice = entryPrice;
    let exitTime = entryTime;
    let exitReason = 'hold';
    let maxPrice = entryPrice;
    let minPrice = entryPrice;

    for (let i = 1; i < prices.length; i++) {
      const currentPrice = parseFloat(prices[i].price_usd);
      const currentTime = new Date(prices[i].timestamp);
      
      if (currentPrice <= 0 || !isFinite(currentPrice)) continue;
      
      maxPrice = Math.max(maxPrice, currentPrice);
      minPrice = Math.min(minPrice, currentPrice);
      
      const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
      
      // Vérifier stop loss
      if (priceChange <= -this.config.stopLossPercent) {
        exitPrice = currentPrice;
        exitTime = currentTime;
        exitReason = 'stop_loss';
        console.log(`  🔴 Stop loss déclenché à ${priceChange.toFixed(1)}%`);
        break;
      }
      
      // Vérifier take profit
      if (priceChange >= this.config.takeProfitPercent) {
        exitPrice = currentPrice;
        exitTime = currentTime;
        exitReason = 'take_profit';
        console.log(`  🟢 Take profit déclenché à ${priceChange.toFixed(1)}%`);
        break;
      }
      
      // Mettre à jour le prix de sortie
      exitPrice = currentPrice;
      exitTime = currentTime;
    }

    // Calculer le P&L
    const profitPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    const profitLoss = positionSize * (profitPercent / 100);
    
    // Appliquer le slippage
    const slippage = this.config.maxSlippage / 100;
    const adjustedProfitLoss = profitLoss * (1 - slippage);
    
    // Mettre à jour le solde
    this.balance += adjustedProfitLoss;
    
    // Enregistrer le trade
    const trade: TradeResult = {
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      positionSize,
      profitLoss: adjustedProfitLoss,
      profitPercent,
      exitReason
    };
    
    this.trades.push(trade);
    
    console.log(`  💰 Sortie: $${exitPrice.toExponential(4)} | P&L: $${adjustedProfitLoss.toFixed(2)} (${profitPercent.toFixed(1)}%)`);
    console.log(`  📊 Min/Max observés: $${minPrice.toExponential(4)} / $${maxPrice.toExponential(4)}`);
    console.log(`  💼 Nouveau solde: $${this.balance.toFixed(2)}`);
    
    // Sauvegarder en base
    await this.saveTrade(trade);
  }

  private async saveTrade(trade: TradeResult) {
    try {
      await this.db.query(`
        INSERT INTO simulated_trades 
        (token_address, entry_time, entry_price, exit_time, exit_price, 
         position_size, profit_loss, exit_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        trade.tokenAddress,
        trade.entryTime,
        trade.entryPrice,
        trade.exitTime,
        trade.exitPrice,
        trade.positionSize,
        trade.profitLoss,
        trade.exitReason
      ]);
    } catch (error) {
      console.error('Erreur sauvegarde trade:', error);
    }
  }

  private displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS DU BACKTEST');
    console.log('='.repeat(60));
    
    const totalTrades = this.trades.length;
    const winningTrades = this.trades.filter(t => t.profitLoss > 0);
    const losingTrades = this.trades.filter(t => t.profitLoss < 0);
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const totalProfit = this.trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.profitLoss, 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + t.profitLoss, 0) / losingTrades.length 
      : 0;
    
    const returnPercent = ((this.balance - this.config.initialBalance) / this.config.initialBalance) * 100;
    
    console.log(`\n📈 Statistiques générales:`);
    console.log(`  • Trades totaux: ${totalTrades}`);
    console.log(`  • Trades gagnants: ${winningTrades.length} (${winRate.toFixed(1)}%)`);
    console.log(`  • Trades perdants: ${losingTrades.length}`);
    console.log(`  • Profit/Loss total: $${totalProfit.toFixed(2)}`);
    console.log(`  • Profit moyen par trade: $${avgProfit.toFixed(2)}`);
    console.log(`  • Gain moyen: $${avgWin.toFixed(2)}`);
    console.log(`  • Perte moyenne: $${avgLoss.toFixed(2)}`);
    console.log(`  • Ratio gain/perte: ${avgLoss !== 0 ? Math.abs(avgWin / avgLoss).toFixed(2) : 'N/A'}`);
    
    console.log(`\n💰 Performance du capital:`);
    console.log(`  • Balance initiale: $${this.config.initialBalance}`);
    console.log(`  • Balance finale: $${this.balance.toFixed(2)}`);
    console.log(`  • Rendement: ${returnPercent.toFixed(2)}%`);
    console.log(`  • Rendement mensuel estimé: ${(returnPercent * 30 / 1).toFixed(2)}%`);
    
    // Top trades
    const topTrades = [...this.trades].sort((a, b) => b.profitLoss - a.profitLoss).slice(0, 5);
    console.log(`\n🏆 Top 5 trades:`);
    topTrades.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.tokenSymbol}: $${t.profitLoss.toFixed(2)} (${t.profitPercent.toFixed(1)}%)`);
    });
    
    console.log('\n' + '='.repeat(60));
  }

  async close() {
    await this.db.end();
  }
}

// Script principal
async function main() {
  const config: SimulationConfig = {
    initialBalance: 1000,
    maxPositionSize: 100,
    maxPositionPercent: 5, // Max 5% du capital par trade
    stopLossPercent: 30,
    takeProfitPercent: 100,
    minLiquidityUSD: 1000,
    maxSlippage: 1 // 1% de slippage
  };
  
  const simulator = new ImprovedSimulator(config);
  
  try {
    await simulator.runBacktest(1000); // Backtest sur 24h
  } finally {
    await simulator.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default ImprovedSimulator;