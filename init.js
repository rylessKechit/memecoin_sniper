// init.js - Script d'initialisation avec sql.js (pur JavaScript)

require('dotenv').config();

async function init() {
  console.log('🚀 Initialisation avec sql.js (pur JavaScript)...\n');

  try {
    // Import sql.js
    const initSqlJs = require('sql.js');
    const fs = require('fs');
    
    console.log('📦 Initialisation de sql.js...');
    const SQL = await initSqlJs();
    
    // Créer ou charger la base
    let db;
    const dbPath = './memecoin_bot.db';
    
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('✅ Base existante chargée');
    } else {
      db = new SQL.Database();
      console.log('✅ Nouvelle base créée');
    }
    
    // Optimisations
    db.exec('PRAGMA foreign_keys = ON');
    console.log('✅ Optimisations appliquées\n');
    
    // Créer les tables
    console.log('🏗️ Création des tables...');
    
    db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);
      CREATE INDEX IF NOT EXISTS idx_tokens_source ON tokens(source);
      CREATE INDEX IF NOT EXISTS idx_price_history_token_time ON price_history(token_address, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_address);
    `);
    
    console.log('✅ Tables et index créés\n');
    
    // Test d'insertion
    console.log('💾 Test d\'insertion...');
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO tokens 
      (address, symbol, name, current_price, liquidity, created_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run([
      'test_123',
      'TEST',
      'Test Token',
      0.001,
      10000,
      new Date().toISOString(),
      'birdeye'
    ]);
    insertStmt.free();
    
    console.log('✅ Insertion réussie\n');
    
    // Test de lecture
    console.log('📊 Test de lecture...');
    const selectStmt = db.prepare('SELECT * FROM tokens WHERE symbol = ?');
    selectStmt.bind(['TEST']);
    
    const rows = [];
    while (selectStmt.step()) {
      rows.push(selectStmt.getAsObject());
    }
    selectStmt.free();
    
    console.log(`✅ Trouvé ${rows.length} token(s)\n`);
    
    // Statistiques
    console.log('📈 Statistiques des tables...');
    const statsStmt = db.prepare(`
      SELECT 
        'tokens' as table_name,
        COUNT(*) as row_count
      FROM tokens
      UNION ALL
      SELECT 
        'price_history' as table_name,
        COUNT(*) as row_count
      FROM price_history
      UNION ALL
      SELECT 
        'trades' as table_name,
        COUNT(*) as row_count
      FROM trades
    `);
    
    const stats = [];
    while (statsStmt.step()) {
      stats.push(statsStmt.getAsObject());
    }
    statsStmt.free();
    
    stats.forEach(stat => {
      console.log(`  ${stat.table_name}: ${stat.row_count} lignes`);
    });
    
    // Sauvegarder
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    db.close();
    
    console.log('\n🎉 Initialisation terminée avec succès !');
    console.log('📁 Base de données: ./memecoin_bot.db');
    console.log('⚡ sql.js: Aucune compilation native requise');
    console.log('🚀 Tu peux maintenant lancer: npm run dev');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. npm install sql.js');
    console.log('2. Aucune dépendance système requise !');
    process.exit(1);
  }
}

init();