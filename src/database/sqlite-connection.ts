// src/database/sqlite-connection.ts
// Alternative SQLite pour éviter PostgreSQL

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { logger } from '../utils/logger';

export class SQLiteDatabase {
  private static instance: SQLiteDatabase;
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

  private constructor() {}

  public static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.db = await open({
        filename: './memecoin_bot.db',
        driver: sqlite3.Database
      });
      
      logger.info('✅ Connexion SQLite établie');
    } catch (error) {
      logger.error('❌ Erreur connexion SQLite:', error);
      throw error;
    }
  }

  public async query(sql: string, params?: any[]): Promise<any> {
    if (!this.db) {
      await this.connect();
    }

    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await this.db!.all(sql, params);
        return { rows };
      } else {
        const result = await this.db!.run(sql, params);
        return { rows: [], rowCount: result.changes };
      }
    } catch (error) {
      logger.error('Erreur requête SQLite:', { sql, params, error });
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as test');
      return true;
    } catch (error) {
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logger.info('Connexion SQLite fermée');
    }
  }
}

// Export compatible avec PostgreSQL
export const db = SQLiteDatabase.getInstance();