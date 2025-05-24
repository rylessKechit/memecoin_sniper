// test-db.ts
// Script de test simple pour vérifier SQLite

import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

async function testDatabase() {
  console.log('🧪 Test de la base de données SQLite...\n');

  try {
    // Import avec chemins absolus
    const connectionPath = path.join(__dirname, 'src', 'database', 'connection');
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema');
    
    const { db } = require('./src/database/connection');
    const { DatabaseSchema } = require('./src/database/schema');

    // Test de connexion
    console.log('📡 Test de connexion...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à SQLite');
    }
    console.log('✅ Connexion SQLite OK\n');

    // Initialisation du schéma
    console.log('🏗️ Initialisation du schéma...');
    const schema = new DatabaseSchema();
    await schema.initializeSchema();
    console.log('✅ Schéma initialisé\n');

    // Test d'insertion simple
    console.log('💾 Test d\'insertion...');
    await db.query(`
      INSERT OR REPLACE INTO tokens 
      (address, symbol, name, current_price, liquidity, created_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'test_token_123',
      'TEST',
      'Test Token',
      0.001,
      10000,
      new Date().toISOString(),
      'birdeye'
    ]);
    console.log('✅ Insertion OK\n');

    // Test de lecture
    console.log('📊 Test de lecture...');
    const result = await db.query('SELECT * FROM tokens WHERE symbol = ?', ['TEST']);
    console.log(`✅ Lecture OK - Trouvé ${result.rows.length} token(s)\n`);

    // Statistiques
    console.log('📈 Statistiques des tables...');
    const stats = await schema.getTableStats();
    stats.forEach((stat: any) => {
      console.log(`  ${stat.table_name}: ${stat.row_count} lignes`);
    });

    console.log('\n🎉 Tous les tests sont passés !');
    console.log('🚀 Tu peux maintenant lancer: npm run dev');

    // Fermer la connexion
    await db.close();

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Lancer le test
testDatabase().catch(console.error);