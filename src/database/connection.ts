// src/database/connection.ts
// Gestion de la connexion sql.js (pur JavaScript, aucune compilation native)

import initSqlJs from 'sql.js';
import fs from 'fs';
import { logger } from '../utils/logger';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: any = null;
  private SQL: any = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    try {
      const dbPath = process.env.DB_PATH || './memecoin_bot.db';
      
      // Initialiser sql.js
      this.SQL = await initSqlJs();
      
      // Charger la base existante ou créer une nouvelle
      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        this.db = new this.SQL.Database(fileBuffer);
        logger.info('✅ Base SQLite existante chargée', { path: dbPath });
      } else {
        this.db = new this.SQL.Database();
        logger.info('✅ Nouvelle base SQLite créée', { path: dbPath });
      }
      
      // Optimisations
      this.db.exec('PRAGMA foreign_keys = ON');
      this.db.exec('PRAGMA journal_mode = MEMORY');
      
    } catch (error) {
      logger.error('❌ Erreur connexion sql.js:', error);
      throw error;
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.db) {
      await this.connect();
    }

    const start = Date.now();
    try {
      // Adapter les requêtes PostgreSQL vers SQLite
      const adaptedQuery = this.adaptPostgresToSQLite(text);
      
      let result: any;
      if (adaptedQuery.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(adaptedQuery);
        if (params && params.length > 0) {
          stmt.bind(params);
        }
        
        const rows: any[] = [];
        while (stmt.step()) {
          const row: any = stmt.getAsObject();
          rows.push(row);
        }
        stmt.free();
        result = { rows };
      } else {
        let stmt: any;
        if (params && params.length > 0) {
          stmt = this.db.prepare(adaptedQuery);
          stmt.run(params);
          stmt.free();
        } else {
          this.db.run(adaptedQuery);
        }
        result = { 
          rows: [], 
          rowCount: this.db.getRowsModified()
        };
      }
      
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`Requête lente (${duration}ms): ${adaptedQuery.substring(0, 100)}...`);
      }
      
      return result;
    } catch (error) {
      logger.error('Erreur requête sql.js:', { query: text, params, error });
      throw error;
    }
  }

  public async getClient(): Promise<any> {
    if (!this.db) {
      await this.connect();
    }
    return this.db;
  }

  public async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      await this.connect();
    }

    try {
      this.db.exec('BEGIN TRANSACTION');
      const result = await callback(this.db);
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as test');
      logger.info('Connexion sql.js testée avec succès');
      return true;
    } catch (error) {
      logger.error('Échec test connexion sql.js:', error);
      return false;
    }
  }

  public async save(): Promise<void> {
    if (!this.db) return;
    
    try {
      const dbPath = process.env.DB_PATH || './memecoin_bot.db';
      const data = this.db.export();
      fs.writeFileSync(dbPath, data);
      logger.debug('Base de données sauvegardée');
    } catch (error) {
      logger.error('Erreur sauvegarde base:', error);
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.db) {
        // Sauvegarder avant fermeture
        await this.save();
        this.db.close();
        this.db = null;
        logger.info('Connexion sql.js fermée');
      }
    } catch (error) {
      logger.error('Erreur fermeture sql.js:', error);
    }
  }

  // Méthodes utilitaires pour les statistiques
  public async getPoolStats() {
    return {
      totalCount: 1,
      idleCount: this.db ? 1 : 0,
      waitingCount: 0
    };
  }

  // Adapter les requêtes PostgreSQL vers SQLite
  private adaptPostgresToSQLite(query: string): string {
    return query
      // Remplacer les types PostgreSQL
      .replace(/BIGSERIAL/gi, 'INTEGER')
      .replace(/SERIAL/gi, 'INTEGER')
      .replace(/DECIMAL\([^)]+\)/gi, 'REAL')
      .replace(/TIMESTAMP/gi, 'TEXT')
      .replace(/JSONB/gi, 'TEXT')
      .replace(/VARCHAR\([^)]+\)/gi, 'TEXT')
      .replace(/BOOLEAN/gi, 'INTEGER')
      
      // Remplacer les fonctions PostgreSQL
      .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
      .replace(/NOW\(\)/gi, "datetime('now')")
      
      // Remplacer les contraintes PostgreSQL
      .replace(/ON CONFLICT[^;]+DO UPDATE SET[^;]*/gi, '')
      .replace(/ON CONFLICT[^;]+DO NOTHING/gi, '')
      
      // Remplacer INSERT ... ON CONFLICT par INSERT OR REPLACE
      .replace(/INSERT INTO([^(]+)\([^)]+\)\s*VALUES/gi, 'INSERT OR REPLACE INTO$1 VALUES')
      
      // Remplacer les index
      .replace(/CREATE INDEX IF NOT EXISTS/gi, 'CREATE INDEX IF NOT EXISTS')
      .replace(/CASCADE/gi, '')
      
      // Auto-increment
      .replace(/INTEGER PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      
      // Remplacer TRUE/FALSE par 1/0
      .replace(/\bTRUE\b/gi, '1')
      .replace(/\bFALSE\b/gi, '0');
  }
}

// Export de l'instance singleton
export const db = DatabaseManager.getInstance();