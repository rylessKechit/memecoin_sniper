// src/database/schema.ts
// Création et gestion du schéma de base de données

import { db } from './connection';
import { logger } from '../utils/logger';

export class DatabaseSchema {
  
  public async initializeSchema(): Promise<void> {
    logger.info('Initialisation du schéma de base de données...');
    
    try {
      await this.dropExistingTables();
      await this.createTables();
      await this.createIndexes();
      await this.createViews();
      
      logger.info('✅ Schéma de base de données initialisé avec succès');
    } catch (error) {
      logger.error('❌ Erreur initialisation schéma:', error);
      throw error;
    }
  }

  private async dropExistingTables(): Promise<void> {
    logger.debug('Suppression des tables existantes...');
    
    await db.query(`
      DROP TABLE IF EXISTS trades CASCADE;
      DROP TABLE IF EXISTS price_history CASCADE;
      DROP TABLE IF EXISTS tokens CASCADE;
      DROP TABLE IF EXISTS portfolio_snapshots CASCADE;
      DROP VIEW IF EXISTS trading_performance CASCADE;
    `);
  }

  private async createTables(): Promise<void> {
    logger.debug('Création des tables...');

    // Table des tokens (adaptée pour SQLite)
    await db.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        address TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT,
        decimals INTEGER DEFAULT 9,
        current_price REAL NOT NULL,
        liquidity REAL NOT NULL,
        volume_24h REAL DEFAULT 0,
        price_change_24h REAL DEFAULT 0,
        market_cap REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_updated TEXT DEFAULT (datetime('now')),
        source TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        metadata TEXT DEFAULT '{}'
      );
    `);

    // Table de l'historique des prix
    await db.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL REFERENCES tokens(address) ON DELETE CASCADE,
        timestamp TEXT NOT NULL,
        price REAL NOT NULL,
        volume REAL DEFAULT 0,
        high REAL,
        low REAL,
        open REAL,
        close REAL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(token_address, timestamp)
      );
    `);

    // Table des trades
    await db.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL REFERENCES tokens(address),
        token_symbol TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
        entry_price REAL NOT NULL,
        exit_price REAL,
        quantity REAL NOT NULL,
        position_size REAL NOT NULL,
        entry_time TEXT NOT NULL,
        exit_time TEXT,
        duration_minutes INTEGER,
        profit REAL,
        profit_percent REAL,
        exit_reason TEXT CHECK (exit_reason IN ('take_profit', 'stop_loss', 'timeout', 'manual')),
        fees REAL DEFAULT 0,
        slippage REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Table des snapshots du portefeuille
    await db.query(`
      CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        total_value REAL NOT NULL,
        available_cash REAL NOT NULL,
        total_profit REAL NOT NULL,
        daily_return REAL,
        positions TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    logger.debug('Tables créées avec succès');
  }

  private async createIndexes(): Promise<void> {
    logger.debug('Création des index...');

    // Index pour les tokens
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tokens_source ON tokens(source);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tokens_last_updated ON tokens(last_updated);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tokens_liquidity ON tokens(liquidity);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tokens_volume ON tokens(volume_24h);`);

    // Index pour l'historique des prix
    await db.query(`CREATE INDEX IF NOT EXISTS idx_price_history_token_time ON price_history(token_address, timestamp DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_price_history_price ON price_history(price);`);

    // Index pour les trades
    await db.query(`CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_address);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(token_symbol);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_trades_exit_time ON trades(exit_time DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_trades_profit ON trades(profit);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_trades_side ON trades(side);`);

    // Index pour les snapshots
    await db.query(`CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_timestamp ON portfolio_snapshots(timestamp DESC);`);

    logger.debug('Index créés avec succès');
  }

  private async createViews(): Promise<void> {
    logger.debug('Création des vues...');

    // Vue pour les performances de trading (adaptée SQLite)
    await db.query(`
      CREATE VIEW IF NOT EXISTS trading_performance AS
      SELECT 
        token_symbol,
        COUNT(*) as total_trades,
        COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN profit < 0 THEN 1 END) as losing_trades,
        ROUND(
          CAST(COUNT(CASE WHEN profit > 0 THEN 1 END) AS REAL) / CAST(COUNT(*) AS REAL) * 100, 
          2
        ) as win_rate,
        ROUND(SUM(profit), 2) as total_profit,
        ROUND(AVG(profit), 2) as avg_profit,
        ROUND(MAX(profit), 2) as max_profit,
        ROUND(MIN(profit), 2) as max_loss,
        ROUND(AVG(duration_minutes), 0) as avg_duration_minutes,
        ROUND(AVG(CASE WHEN profit > 0 THEN profit END), 2) as avg_win,
        ROUND(AVG(CASE WHEN profit < 0 THEN profit END), 2) as avg_loss
      FROM trades
      WHERE exit_time IS NOT NULL
      GROUP BY token_symbol
      ORDER BY total_profit DESC;
    `);

    logger.debug('Vues créées avec succès');
  }

  public async getTableStats(): Promise<any> {
    const stats = await db.query(`
      SELECT 
        'tokens' as table_name,
        COUNT(*) as row_count,
        'N/A' as size
      FROM tokens
      UNION ALL
      SELECT 
        'price_history' as table_name,
        COUNT(*) as row_count,
        'N/A' as size
      FROM price_history
      UNION ALL
      SELECT 
        'trades' as table_name,
        COUNT(*) as row_count,
        'N/A' as size
      FROM trades
      UNION ALL
      SELECT 
        'portfolio_snapshots' as table_name,
        COUNT(*) as row_count,
        'N/A' as size
      FROM portfolio_snapshots;
    `);

    return stats.rows;
  }

  public async vacuum(): Promise<void> {
    logger.info('Lancement du VACUUM sur la base SQLite...');
    
    await db.query('VACUUM;');
    await db.query('ANALYZE;');
    
    logger.info('VACUUM terminé');
  }
}