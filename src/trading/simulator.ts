// src/trading/simulator.ts
// Simulateur de trading avec vraies données

import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { 
  Token, 
  Trade, 
  TradingConfig, 
  BacktestResult, 
  PortfolioStats,
  ExitReason,
  TradeSide 
} from '../types';

export class TradingSimulator {
  private config: TradingConfig;
  private balance: number;
  private trades: Trade[] = [];
  private portfolio: Map<string, number> = new Map(); // token -> quantity

  constructor(config: TradingConfig) {
    this.config = config;
    this.balance = config.capital;
    logger.info('Simulateur initialisé', { config });
  }

  // Lancer un backtest complet
  async runBacktest(startDate: Date, endDate: Date): Promise<BacktestResult> {
    logger.info('🚀 Démarrage du backtest', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      config: this.config
    });

    // Reset du simulateur
    this.reset();

    // Récupérer tous les tokens éligibles
    const eligibleTokens = await this.getEligibleTokens(startDate, endDate);
    logger.info(`📊 ${eligibleTokens.length} tokens éligibles trouvés`);

    if (eligibleTokens.length === 0) {
      throw new Error('Aucun token éligible pour la période donnée');
    }

    // Simuler le trading pour chaque token
    for (const token of eligibleTokens) {
      await this.simulateTokenTrading(token, startDate, endDate);
    }

    // Calculer les statistiques finales
    const stats = this.calculatePortfolioStats();
    
    // Sauvegarder les trades en base
    await this.saveTradesTimeout();

    const result: BacktestResult = {
      config: this.config,
      startDate,
      endDate,
      initialCapital: this.config.capital,
      finalCapital: this.balance + this.getPortfolioValue(),
      totalReturn: ((this.balance + this.getPortfolioValue() - this.config.capital) / this.config.capital) * 100,
      annualizedReturn: this.calculateAnnualizedReturn(startDate, endDate),
      trades: this.trades,
      stats,
      dailyReturns: await this.calculateDailyReturns(startDate, endDate)
    };

    logger.info('✅ Backtest terminé', {
      totalTrades: this.trades.length,
      finalBalance: this.balance,
      totalReturn: result.totalReturn
    });

    return result;
  }

  // Récupérer les tokens éligibles selon les critères
  private async getEligibleTokens(startDate: Date, endDate: Date): Promise<Token[]> {
    const result = await db.query(`
      SELECT DISTINCT t.*
      FROM tokens t
      INNER JOIN price_history ph ON t.address = ph.token_address
      WHERE t.liquidity >= $1
        AND t.volume_24h >= $2
        AND t.current_price > 0
        AND ph.timestamp BETWEEN $3 AND $4
      GROUP BY t.address, t.symbol, t.name, t.decimals, t.current_price, 
               t.liquidity, t.volume_24h, t.price_change_24h, t.market_cap,
               t.created_at, t.last_updated, t.source, t.is_active, t.metadata
      HAVING COUNT(ph.id) >= 24  -- Minimum 24 points de prix
      ORDER BY t.volume_24h DESC
      LIMIT 100
    `, [
      this.config.minLiquidity,
      this.config.minVolume24h,
      startDate,
      endDate
    ]);

    return result.rows;
  }

  // Simuler le trading pour un token spécifique
  private async simulateTokenTrading(token: Token, startDate: Date, endDate: Date): Promise<void> {
    // Récupérer l'historique des prix
    const priceHistory = await this.getPriceHistory(token.address, startDate, endDate);
    
    if (priceHistory.length < 10) {
      logger.debug(`Pas assez de données pour ${token.symbol}`);
      return;
    }

    logger.debug(`📈 Simulation trading pour ${token.symbol} (${priceHistory.length} points de prix)`);

    let currentPosition = 0;
    let entryPrice = 0;
    let entryTime: Date | null = null;

    for (let i = 0; i < priceHistory.length; i++) {
      const currentPrice = priceHistory[i];
      const nextPrice = priceHistory[i + 1];

      // Si pas de position, chercher un point d'entrée
      if (currentPosition === 0) {
        if (this.shouldEnter(token, currentPrice, priceHistory.slice(0, i + 1))) {
          const positionSize = this.calculatePositionSize();
          const quantity = positionSize / currentPrice.price;
          
          if (positionSize > this.balance) {
            continue; // Pas assez de capital
          }

          // Ouvrir la position
          currentPosition = quantity;
          entryPrice = currentPrice.price;
          entryTime = currentPrice.timestamp;
          this.balance -= positionSize;
          
          logger.debug(`🟢 Entrée ${token.symbol} à $${entryPrice.toFixed(6)} - Quantité: ${quantity.toFixed(2)}`);
        }
      } 
      // Si position ouverte, vérifier les conditions de sortie
      else if (currentPosition > 0 && entryTime) {
        const currentValue = currentPosition * currentPrice.price;
        const profitPercent = ((currentPrice.price - entryPrice) / entryPrice) * 100;
        const timeInPosition = (currentPrice.timestamp.getTime() - entryTime.getTime()) / (1000 * 60); // minutes

        let shouldExit = false;
        let exitReason: ExitReason = ExitReason.MANUAL;

        // Vérifier stop loss
        if (profitPercent <= -this.config.stopLossPercent) {
          shouldExit = true;
          exitReason = ExitReason.STOP_LOSS;
        }
        // Vérifier take profit
        else if (profitPercent >= this.config.takeProfitPercent) {
          shouldExit = true;
          exitReason = ExitReason.TAKE_PROFIT;
        }
        // Vérifier timeout
        else if (timeInPosition >= this.config.timeoutHours * 60) {
          shouldExit = true;
          exitReason = ExitReason.TIMEOUT;
        }

        if (shouldExit || i === priceHistory.length - 1) {
          // Fermer la position
          this.balance += currentValue;
          
          const fees = currentValue * (this.config.tradingFeePercent / 100);
          const slippageAmount = currentValue * (this.config.maxSlippage / 100);
          const netProfit = currentValue - (currentPosition * entryPrice) - fees - slippageAmount;

          const trade: Trade = {
            tokenAddress: token.address,
            tokenSymbol: token.symbol,
            side: TradeSide.BUY, // Simplifié - on assume toujours long
            entryPrice,
            exitPrice: currentPrice.price,
            quantity: currentPosition,
            positionSize: currentPosition * entryPrice,
            entryTime,
            exitTime: currentPrice.timestamp,
            duration: Math.round(timeInPosition),
            profit: netProfit,
            profitPercent,
            exitReason,
            fees,
            slippage: this.config.maxSlippage
          };

          this.trades.push(trade);
          
          const emoji = netProfit > 0 ? '🟢' : '🔴';
          logger.debug(`${emoji} Sortie ${token.symbol} à $${currentPrice.price.toFixed(6)} - P&L: $${netProfit.toFixed(2)} (${profitPercent.toFixed(1)}%) - ${exitReason}`);

          // Reset position
          currentPosition = 0;
          entryPrice = 0;
          entryTime = null;
        }
      }
    }
  }

  // Récupérer l'historique des prix
  private async getPriceHistory(tokenAddress: string, startDate: Date, endDate: Date) {
    const result = await db.query(`
      SELECT timestamp, price, volume
      FROM price_history
      WHERE token_address = $1
        AND timestamp BETWEEN $2 AND $3
      ORDER BY timestamp ASC
    `, [tokenAddress, startDate, endDate]);

    return result.rows;
  }

  // Déterminer si on doit entrer en position
  private shouldEnter(token: Token, currentPrice: any, priceHistory: any[]): boolean {
    // Stratégie simple : entrer si le volume est élevé et prix en mouvement
    if (priceHistory.length < 5) return false;

    const recentPrices = priceHistory.slice(-5);
    const avgVolume = recentPrices.reduce((sum, p) => sum + p.volume, 0) / recentPrices.length;
    
    // Entrer si volume actuel > 2x volume moyen récent
    const volumeSpike = currentPrice.volume > avgVolume * 2;
    
    // Et si prix a bougé significativement
    const priceChange = Math.abs((currentPrice.price - recentPrices[0].price) / recentPrices[0].price) * 100;
    const significantMove = priceChange > 5; // Plus de 5% de mouvement

    return volumeSpike && significantMove;
  }

  // Calculer la taille de position
  private calculatePositionSize(): number {
    const maxByPercent = this.balance * (this.config.maxPositionPercent / 100);
    const maxByAbsolute = this.config.maxPositionSize;
    
    return Math.min(maxByPercent, maxByAbsolute, this.balance * 0.95); // Garder 5% en cash
  }

  // Calculer la valeur actuelle du portefeuille
  private getPortfolioValue(): number {
    // Dans cette simulation simplifiée, on assume qu'on ferme toutes les positions
    return 0;
  }

  // Calculer les statistiques du portefeuille
  private calculatePortfolioStats(): PortfolioStats {
    const completedTrades = this.trades.filter(t => t.exitTime);
    const winningTrades = completedTrades.filter(t => (t.profit || 0) > 0);
    const losingTrades = completedTrades.filter(t => (t.profit || 0) < 0);

    const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / losingTrades.length)
      : 0;

    return {
      totalValue: this.balance + this.getPortfolioValue(),
      availableCash: this.balance,
      totalProfit,
      totalTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
      avgProfit: completedTrades.length > 0 ? totalProfit / completedTrades.length : 0,
      avgLoss: avgLoss,
      profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
      maxDrawdown: this.calculateMaxDrawdown()
    };
  }

  // Calculer le drawdown maximum
  private calculateMaxDrawdown(): number {
    let peak = this.config.capital;
    let maxDrawdown = 0;
    let runningBalance = this.config.capital;

    for (const trade of this.trades) {
      runningBalance += trade.profit || 0;
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return maxDrawdown;
  }

  // Calculer le rendement annualisé
  private calculateAnnualizedReturn(startDate: Date, endDate: Date): number {
    const totalReturn = ((this.balance + this.getPortfolioValue() - this.config.capital) / this.config.capital);
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const annualMultiplier = 365.25 / daysDiff;
    
    return (Math.pow(1 + totalReturn, annualMultiplier) - 1) * 100;
  }

  // Calculer les rendements journaliers
  private async calculateDailyReturns(startDate: Date, endDate: Date) {
    // Implémentation simplifiée - à améliorer
    return [{
      date: new Date(),
      portfolioValue: this.balance,
      dailyReturn: 0
    }];
  }

  // Sauvegarder les trades en base
  private async saveTradesTimeout(): Promise<void> {
    for (const trade of this.trades) {
      try {
        await db.query(`
          INSERT INTO trades (
            token_address, token_symbol, side, entry_price, exit_price,
            quantity, position_size, entry_time, exit_time, duration_minutes,
            profit, profit_percent, exit_reason, fees, slippage
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          trade.tokenAddress, trade.tokenSymbol, trade.side, trade.entryPrice,
          trade.exitPrice, trade.quantity, trade.positionSize, trade.entryTime,
          trade.exitTime, trade.duration, trade.profit, trade.profitPercent,
          trade.exitReason, trade.fees, trade.slippage
        ]);
      } catch (error) {
        logger.error('Erreur sauvegarde trade:', error);
      }
    }
  }

  // Reset du simulateur
  private reset(): void {
    this.balance = this.config.capital;
    this.trades = [];
    this.portfolio.clear();
  }
}