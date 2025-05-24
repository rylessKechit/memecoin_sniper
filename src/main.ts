// src/main.ts
// Point d'entrée principal du bot memecoin

import dotenv from 'dotenv';
import { db } from './database/connection';
import { DatabaseSchema } from './database/schema';
import { BirdeyeCollector } from './collectors/birdeye';
import { DexScreenerCollector } from './collectors/dexscreener';
import { TradingSimulator } from './trading/simulator';
import { logger, createLogger } from './utils/logger';
import { TradingConfig, CollectorConfig, DataSource } from './types';

// Charger les variables d'environnement
dotenv.config();

const mainLogger = createLogger('MAIN');

// Configuration par défaut
const DEFAULT_TRADING_CONFIG: TradingConfig = {
  capital: 10000,
  maxPositionSize: 500,
  maxPositionPercent: 5,
  stopLossPercent: 25,
  takeProfitPercent: 75,
  timeoutHours: 6,
  minLiquidity: 50000,
  minVolume24h: 10000,
  maxSlippage: 1.5,
  tradingFeePercent: 0.3
};

const DEFAULT_COLLECTOR_CONFIG: CollectorConfig = {
  enabled: true,
  rateLimit: 2, // 2 requêtes par seconde
  retryAttempts: 3,
  timeout: 10000
};

class MemecoinBot {
  private collectors: Map<DataSource, any> = new Map();
  private simulator: TradingSimulator;
  private dbSchema: DatabaseSchema;

  constructor() {
    // Initialiser les collectors
    this.collectors.set(DataSource.BIRDEYE, new BirdeyeCollector(DEFAULT_COLLECTOR_CONFIG));
    this.collectors.set(DataSource.DEXSCREENER, new DexScreenerCollector(DEFAULT_COLLECTOR_CONFIG));
    
    // Initialiser le simulateur
    this.simulator = new TradingSimulator(DEFAULT_TRADING_CONFIG);
    
    // Initialiser le schéma DB
    this.dbSchema = new DatabaseSchema();
  }

  // Initialiser le système complet
  async initialize(): Promise<void> {
    mainLogger.info('🚀 Initialisation du Memecoin Bot...');

    try {
      // Tester la connexion DB
      const dbConnected = await db.testConnection();
      if (!dbConnected) {
        throw new Error('Impossible de se connecter à la base de données');
      }

      // Initialiser le schéma
      await this.dbSchema.initializeSchema();

      mainLogger.info('✅ Bot initialisé avec succès');
    } catch (error) {
      mainLogger.error('❌ Erreur initialisation:', error);
      throw error;
    }
  }

  // Collecter les données depuis toutes les sources
  async collectData(): Promise<{ totalTokens: number, sources: string[] }> {
    mainLogger.info('📊 Démarrage de la collecte de données...');

    let totalTokens = 0;
    const sources: string[] = [];

    // Collecter depuis Birdeye
    try {
      const birdeyeCollector = this.collectors.get(DataSource.BIRDEYE);
      const birdeyeResult = await birdeyeCollector.fetchTokens(30);
      
      if (birdeyeResult.success && birdeyeResult.data) {
        await this.saveTokens(birdeyeResult.data);
        totalTokens += birdeyeResult.data.length;
        sources.push('Birdeye');
        mainLogger.info(`✅ Birdeye: ${birdeyeResult.data.length} tokens collectés`);

        // Collecter l'historique pour quelques tokens
        await this.collectPriceHistory(birdeyeResult.data.slice(0, 10), DataSource.BIRDEYE);
      }
    } catch (error) {
      mainLogger.warn('⚠️ Erreur Birdeye:', error);
    }

    // Collecter depuis DexScreener
    try {
      const dsCollector = this.collectors.get(DataSource.DEXSCREENER);
      const dsResult = await dsCollector.fetchTokens(20);
      
      if (dsResult.success && dsResult.data) {
        await this.saveTokens(dsResult.data);
        totalTokens += dsResult.data.length;
        sources.push('DexScreener');
        mainLogger.info(`✅ DexScreener: ${dsResult.data.length} tokens collectés`);

        // Collecter l'historique
        await this.collectPriceHistory(dsResult.data.slice(0, 5), DataSource.DEXSCREENER);
      }
    } catch (error) {
      mainLogger.warn('⚠️ Erreur DexScreener:', error);
    }

    mainLogger.info(`📊 Collecte terminée: ${totalTokens} tokens depuis ${sources.join(', ')}`);
    return { totalTokens, sources };
  }

  // Collecter l'historique des prix
  private async collectPriceHistory(tokens: any[], source: DataSource): Promise<void> {
    const collector = this.collectors.get(source);
    if (!collector) return;

    mainLogger.info(`📈 Collecte historique ${source} pour ${tokens.length} tokens...`);

    for (const token of tokens) {
      try {
        const historyResult = await collector.fetchPriceHistory(token.address, 7);
        
        if (historyResult.success && historyResult.data) {
          await this.savePriceHistory(historyResult.data);
          mainLogger.debug(`✅ Historique ${token.symbol}: ${historyResult.data.length} points`);
        }
      } catch (error) {
        mainLogger.warn(`⚠️ Erreur historique ${token.symbol}:`, error);
      }
    }
  }

  // Sauvegarder les tokens en base
  private async saveTokens(tokens: any[]): Promise<void> {
    for (const token of tokens) {
      try {
        await db.query(`
          INSERT INTO tokens (
            address, symbol, name, decimals, current_price, liquidity,
            volume_24h, price_change_24h, market_cap, created_at, last_updated, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (address) DO UPDATE SET
            current_price = EXCLUDED.current_price,
            liquidity = EXCLUDED.liquidity,
            volume_24h = EXCLUDED.volume_24h,
            price_change_24h = EXCLUDED.price_change_24h,
            market_cap = EXCLUDED.market_cap,
            last_updated = EXCLUDED.last_updated
        `, [
          token.address,
          token.symbol,
          token.name,
          token.decimals,
          token.currentPrice,
          token.liquidity,
          token.volume24h,
          token.priceChange24h,
          token.marketCap,
          token.createdAt,
          token.lastUpdated,
          token.source
        ]);
      } catch (error) {
        mainLogger.error(`Erreur sauvegarde token ${token.symbol}:`, error);
      }
    }
  }

  // Sauvegarder l'historique des prix
  private async savePriceHistory(pricePoints: any[]): Promise<void> {
    for (const point of pricePoints) {
      try {
        await db.query(`
          INSERT INTO price_history (token_address, timestamp, price, volume)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (token_address, timestamp) DO UPDATE SET
            price = EXCLUDED.price,
            volume = EXCLUDED.volume
        `, [
          point.tokenAddress,
          point.timestamp,
          point.price,
          point.volume
        ]);
      } catch (error) {
        mainLogger.error('Erreur sauvegarde prix:', error);
      }
    }
  }

  // Lancer un backtest
  async runBacktest(days: number = 7): Promise<void> {
    mainLogger.info(`🎯 Démarrage backtest sur ${days} jours...`);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      const result = await this.simulator.runBacktest(startDate, endDate);
      
      // Afficher les résultats
      this.displayBacktestResults(result);
      
    } catch (error) {
      mainLogger.error('❌ Erreur backtest:', error);
      throw error;
    }
  }

  // Afficher les résultats du backtest
  private displayBacktestResults(result: any): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSULTATS DU BACKTEST');
    console.log('='.repeat(80));
    
    console.log(`\n💰 PERFORMANCE FINANCIÈRE:`);
    console.log(`  Capital initial: ${result.initialCapital.toLocaleString()}$`);
    console.log(`  Capital final: ${result.finalCapital.toLocaleString()}$`);
    console.log(`  Rendement total: ${result.totalReturn.toFixed(2)}%`);
    console.log(`  Rendement annualisé: ${result.annualizedReturn.toFixed(2)}%`);
    
    console.log(`\n📈 STATISTIQUES DES TRADES:`);
    console.log(`  Total trades: ${result.stats.totalTrades}`);
    console.log(`  Trades gagnants: ${result.stats.winningTrades}`);
    console.log(`  Trades perdants: ${result.stats.losingTrades}`);
    console.log(`  Taux de réussite: ${result.stats.winRate.toFixed(1)}%`);
    console.log(`  Profit moyen: ${result.stats.avgProfit.toFixed(2)}$`);
    console.log(`  Profit factor: ${result.stats.profitFactor.toFixed(2)}`);
    console.log(`  Drawdown max: ${result.stats.maxDrawdown.toFixed(2)}%`);
    
    // Top 5 trades
    const topTrades = [...result.trades]
      .sort((a: any, b: any) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 5);
    
    console.log(`\n🏆 TOP 5 TRADES:`);
    topTrades.forEach((trade: any, index: number) => {
      console.log(`  ${index + 1}. ${trade.tokenSymbol}: ${trade.profit?.toFixed(2)}$ (${trade.profitPercent?.toFixed(1)}%)`);
    });
    
    console.log('\n' + '='.repeat(80));
  }

  // Obtenir les statistiques du système
  async getSystemStats(): Promise<void> {
    const stats = await this.dbSchema.getTableStats();
    const collectorStats = Array.from(this.collectors.values()).map(c => c.getStats());
    
    console.log('\n📊 STATISTIQUES DU SYSTÈME:');
    console.log('\nBase de données:');
    stats.forEach((stat: any) => {
      console.log(`  ${stat.table_name}: ${stat.row_count} lignes (${stat.size})`);
    });
    
    console.log('\nCollectors:');
    collectorStats.forEach(stat => {
      console.log(`  ${stat.name}: ${stat.requestCount} requêtes (${stat.enabled ? 'actif' : 'inactif'})`);
    });
  }

  // Nettoyer et fermer les connexions
  async cleanup(): Promise<void> {
    mainLogger.info('🧹 Nettoyage des ressources...');
    
    try {
      await db.close();
      mainLogger.info('✅ Ressources nettoyées');
    } catch (error) {
      mainLogger.error('❌ Erreur nettoyage:', error);
    }
  }
}

// Fonction principale
async function main() {
  const bot = new MemecoinBot();
  
  try {
    // Initialiser
    await bot.initialize();
    
    // Collecter les données
    const collectResult = await bot.collectData();
    
    if (collectResult.totalTokens === 0) {
      mainLogger.warn('⚠️ Aucune donnée collectée, arrêt du programme');
      return;
    }
    
    // Lancer le backtest
    await bot.runBacktest(7);
    
    // Afficher les stats système
    await bot.getSystemStats();
    
  } catch (error) {
    mainLogger.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await bot.cleanup();
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', async () => {
  mainLogger.info('Signal SIGINT reçu, arrêt en cours...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  mainLogger.info('Signal SIGTERM reçu, arrêt en cours...');
  process.exit(0);
});

// Point d'entrée
if (require.main === module) {
  main().catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
}

export { MemecoinBot };