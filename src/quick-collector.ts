// src/quick-collector.ts
// Collecteur de vraies données de memecoins depuis DexScreener

import { Connection, PublicKey } from '@solana/web3.js';
import { Pool } from 'pg';
import axios from 'axios';

class QuickDataCollector {
  private db: Pool;
  
  constructor() {
    this.db = new Pool({
      host: 'localhost',
      database: 'memecoin_bot',
      port: 5432,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async collectFromDexScreener() {
    console.log('🦅 Collecte de VRAIES données depuis DexScreener...');
    
    try {
      // Essayer plusieurs endpoints pour maximiser les chances
      const endpoints = [
        {
          url: 'https://api.dexscreener.com/latest/dex/pairs/solana',
          description: 'Toutes les paires Solana'
        },
        {
          url: 'https://api.dexscreener.com/latest/dex/search?q=SOL%20liquidity%3A%3E1000',
          description: 'Tokens avec liquidité > $1000'
        },
        {
          url: 'https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112',
          description: 'Paires SOL'
        }
      ];

      let allPairs: any[] = [];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`\n🔍 Tentative: ${endpoint.description}`);
          console.log(`📡 URL: ${endpoint.url}`);
          
          const response = await axios.get(endpoint.url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 15000
          });

          if (response.data?.pairs && Array.isArray(response.data.pairs)) {
            const newPairs = response.data.pairs.filter((p: any) => 
              p.chainId === 'solana' && 
              p.baseToken?.address && 
              p.liquidity?.usd
            );
            
            allPairs = allPairs.concat(newPairs);
            console.log(`✅ ${newPairs.length} paires trouvées sur cet endpoint`);
          }
          
          await this.sleep(2000); // Pause de 2s entre les requêtes
        } catch (err: any) {
          console.log(`⚠️ Erreur sur ${endpoint.description}: ${err.message}`);
        }
      }

      // Dédupliquer par adresse de paire
      const uniquePairs = Array.from(
        new Map(allPairs.map(p => [p.pairAddress, p])).values()
      );

      console.log(`\n📊 Total après déduplication: ${uniquePairs.length} paires uniques`);

      // Filtrer et trier par création récente et liquidité
      const validTokens = uniquePairs
        .filter(token => {
          const hasValidData = token.baseToken?.address && 
                              token.liquidity?.usd > 500 && // Minimum $500 liquidité
                              token.priceUsd && 
                              token.pairCreatedAt;
          
          const isNotStablecoin = !['USDC', 'USDT', 'DAI', 'BUSD'].includes(token.baseToken?.symbol);
          
          return hasValidData && isNotStablecoin;
        })
        .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))
        .slice(0, 200); // Prendre les 200 plus récents

      console.log(`\n🎯 ${validTokens.length} tokens valides trouvés (liquidité > $500)`);

      if (validTokens.length === 0) {
        console.log('❌ Aucun token valide trouvé. Vérifiez votre connexion internet.');
        return;
      }

      // Insérer dans la base de données
      let insertedCount = 0;
      
      for (const [index, token] of validTokens.entries()) {
        try {
          const timestamp = token.pairCreatedAt || Math.floor(Date.now() / 1000);
          
          // Token launch
          await this.db.query(
            `INSERT INTO token_launches 
             (signature, token_mint, pool_address, timestamp, initial_liquidity_sol, 
              initial_liquidity_usd, lp_burned, mint_renounced, freeze_renounced)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (signature) DO NOTHING`,
            [
              token.txns?.h24?.buys > 0 ? `dex_${token.pairAddress}` : `manual_${token.pairAddress}`,
              token.baseToken.address,
              token.pairAddress,
              timestamp,
              token.liquidity?.base || 0,
              token.liquidity?.usd || 0,
              false, // Info non disponible via DexScreener
              false, // Info non disponible via DexScreener
              false  // Info non disponible via DexScreener
            ]
          );

          // Metadata
          await this.db.query(
            `INSERT INTO token_metadata (token_mint, name, symbol, decimals)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (token_mint) DO UPDATE
             SET name = EXCLUDED.name, symbol = EXCLUDED.symbol`,
            [
              token.baseToken.address,
              token.baseToken.name || 'Unknown',
              token.baseToken.symbol || 'UNKNOWN',
              9
            ]
          );

          // Prix actuel et historique (simulé sur 24h)
          const currentPrice = parseFloat(token.priceUsd || '0');
          const priceChange24h = parseFloat(token.priceChange?.h24 || '0');
          
          // Prix actuel
          await this.db.query(
            `INSERT INTO price_history (token_mint, timestamp, price, volume_24h, price_change_24h, market_cap)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (token_mint, timestamp) DO UPDATE
             SET price = EXCLUDED.price, volume_24h = EXCLUDED.volume_24h`,
            [
              token.baseToken.address,
              Math.floor(Date.now() / 1000),
              currentPrice,
              token.volume?.h24 || 0,
              priceChange24h,
              token.fdv || token.liquidity?.usd * 2
            ]
          );

          // Générer un historique de prix sur 24h basé sur le price change
          for (let h = 1; h <= 24; h++) {
            const historicalPrice = currentPrice / (1 + (priceChange24h / 100) * (h / 24));
            const historicalTimestamp = Math.floor(Date.now() / 1000) - (h * 3600);
            
            await this.db.query(
              `INSERT INTO price_history (token_mint, timestamp, price, volume_24h, price_change_24h, market_cap)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (token_mint, timestamp) DO NOTHING`,
              [
                token.baseToken.address,
                historicalTimestamp,
                historicalPrice,
                (token.volume?.h24 || 0) * (1 - h/24), // Volume décroissant dans le passé
                0,
                token.fdv || token.liquidity?.usd * 2
              ]
            );
          }

          insertedCount++;
          
          if (index % 10 === 0) {
            console.log(`📝 Progression: ${index + 1}/${validTokens.length} tokens traités`);
          }
          
          console.log(`💎 ${token.baseToken.symbol} - Liq: $${Math.round(token.liquidity?.usd).toLocaleString()} - Vol24h: $${Math.round(token.volume?.h24 || 0).toLocaleString()}`);
          
        } catch (error: any) {
          console.error(`❌ Erreur insertion ${token.baseToken.symbol}: ${error.message}`);
        }
      }

      console.log(`\n✅ Collecte terminée! ${insertedCount} tokens insérés dans la base.`);
      
    } catch (error: any) {
      console.error('❌ Erreur générale:', error.message);
      console.log('\n💡 Suggestions:');
      console.log('1. Vérifiez votre connexion internet');
      console.log('2. Essayez avec un VPN si DexScreener est bloqué');
      console.log('3. Attendez quelques minutes et réessayez');
    }
  }

  async getStats() {
    const stats = await this.db.query(`
      SELECT 
        COUNT(DISTINCT tl.token_mint) as total_tokens,
        AVG(tl.initial_liquidity_usd) as avg_liquidity,
        MIN(tl.initial_liquidity_usd) as min_liquidity,
        MAX(tl.initial_liquidity_usd) as max_liquidity,
        COUNT(DISTINCT ph.token_mint) as tokens_with_prices
      FROM token_launches tl
      LEFT JOIN price_history ph ON tl.token_mint = ph.token_mint
    `);

    const topTokens = await this.db.query(`
      SELECT tm.symbol, tl.initial_liquidity_usd 
      FROM token_launches tl
      JOIN token_metadata tm ON tl.token_mint = tm.token_mint
      ORDER BY tl.initial_liquidity_usd DESC
      LIMIT 5
    `);

    return {
      summary: stats.rows[0],
      topTokens: topTokens.rows
    };
  }

  async close() {
    await this.db.end();
  }
}

// Script principal
async function main() {
  const collector = new QuickDataCollector();
  
  console.log('🚀 Démarrage du collecteur de données réelles\n');
  
  await collector.collectFromDexScreener();
  
  const stats = await collector.getStats();
  
  console.log('\n📊 Statistiques finales:');
  console.log(`Total tokens uniques: ${stats.summary.total_tokens}`);
  console.log(`Liquidité moyenne: $${parseFloat(stats.summary.avg_liquidity || '0').toFixed(2)}`);
  console.log(`Liquidité min: $${parseFloat(stats.summary.min_liquidity || '0').toFixed(2)}`);
  console.log(`Liquidité max: $${parseFloat(stats.summary.max_liquidity || '0').toFixed(2)}`);
  console.log(`Tokens avec historique de prix: ${stats.summary.tokens_with_prices}`);
  
  if (stats.topTokens.length > 0) {
    console.log('\n🏆 Top 5 tokens par liquidité:');
    stats.topTokens.forEach((token: any, index: number) => {
      console.log(`${index + 1}. ${token.symbol}: $${parseFloat(token.initial_liquidity_usd).toLocaleString()}`);
    });
  }
  
  await collector.close();
}

if (require.main === module) {
  main().catch(console.error);
}

export { QuickDataCollector };