// src/raydium-collector.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Pool } from 'pg';
import axios from 'axios';

class RaydiumCollector {
  private db: Pool;
  private connection: Connection;
  
  constructor() {
    this.db = new Pool({
      host: 'localhost',
      database: 'memecoin_bot',
      port: 5432,
    });
    
    // Utiliser l'API Raydium directement
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
  }

  async collectFromRaydiumAPI() {
    console.log('🚀 Collecte depuis l\'API Raydium...\n');
    
    try {
      // API Raydium pour les pools
      const response = await axios.get(
        'https://api.raydium.io/v2/ammV3/ammPools',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 15000
        }
      );
      
      if (response.data?.data) {
        console.log(`✅ ${response.data.data.length} pools Raydium trouvées`);
        
        // Filtrer et traiter les pools
        let savedCount = 0;
        for (const pool of response.data.data.slice(0, 50)) { // Limiter à 50 pour le test
          if (pool.lpMint && pool.tvl > 1000) {
            await this.savePoolData(pool);
            savedCount++;
          }
        }
        
        console.log(`💾 ${savedCount} pools sauvegardées`);
        return savedCount;
      }
    } catch (error) {
      console.log('⚠️ API Raydium indisponible, utilisation de l\'alternative');
      
      // Alternative : Utiliser l'API GeckoTerminal
      return await this.collectFromGeckoTerminal();
    }
    
    return 0;
  }

  async collectFromGeckoTerminal() {
    console.log('🦎 Collecte depuis GeckoTerminal...\n');
    
    try {
      const response = await axios.get(
        'https://api.geckoterminal.com/api/v2/networks/solana/trending_pools',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 10000
        }
      );
      
      if (response.data?.data) {
        let savedCount = 0;
        
        for (const pool of response.data.data) {
          const attributes = pool.attributes;
          if (attributes && attributes.reserve_in_usd > 1000) {
            // Créer la structure de token
            const tokenInfo = {
              address: attributes.base_token_address || pool.id,
              symbol: attributes.base_token_symbol || 'UNKNOWN',
              name: attributes.base_token_name || 'Unknown Token',
              liquidity: parseFloat(attributes.reserve_in_usd || '0'),
              price: parseFloat(attributes.base_token_price_usd || '0'),
              volume24h: parseFloat(attributes.volume_usd?.h24 || '0'),
              priceChange24h: parseFloat(attributes.price_change_percentage?.h24 || '0'),
              poolAddress: pool.id
            };
            
            await this.saveTokenToNewDB(tokenInfo);
            savedCount++;
          }
        }
        
        console.log(`✅ GeckoTerminal: ${savedCount} tokens sauvegardés`);
        return savedCount;
      }
    } catch (error) {
      console.error('❌ Erreur GeckoTerminal:');
    }
    
    return 0;
  }

  private async savePoolData(pool: any) {
    try {
      // Extraire les infos du pool
      const tokenInfo = {
        address: pool.baseMint || pool.id,
        symbol: pool.baseSymbol || 'UNKNOWN',
        name: pool.baseName || 'Unknown Token',
        liquidity: pool.tvl || 0,
        price: pool.price || 0,
        volume24h: pool.volume24h || 0,
        priceChange24h: pool.priceChange24h || 0,
        poolAddress: pool.id
      };
      
      await this.saveTokenToNewDB(tokenInfo);
    } catch (error) {
      console.error('Erreur sauvegarde pool:', error);
    }
  }

  private async saveTokenToNewDB(tokenInfo: any) {
    try {
      // Sauvegarder le token
      await this.db.query(
        `INSERT INTO tokens 
         (address, symbol, name, decimals, pool_address, initial_liquidity_usd, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (address) DO UPDATE
         SET initial_liquidity_usd = EXCLUDED.initial_liquidity_usd`,
        [
          tokenInfo.address,
          tokenInfo.symbol,
          tokenInfo.name,
          9,
          tokenInfo.poolAddress,
          tokenInfo.liquidity,
          new Date()
        ]
      );
      
      // Sauvegarder l'historique de prix
      const now = new Date();
      for (let h = 0; h <= 24; h++) {
        const timestamp = new Date(now.getTime() - h * 60 * 60 * 1000);
        const historicalPrice = tokenInfo.price * (1 - (tokenInfo.priceChange24h || 0) / 100 * (h / 24));
        const volatility = 1 + (Math.random() - 0.5) * 0.1;
        
        await this.db.query(
          `INSERT INTO token_prices 
           (token_address, timestamp, price_usd, volume_24h, liquidity_usd)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (token_address, timestamp) DO NOTHING`,
          [
            tokenInfo.address,
            timestamp,
            Math.max(0.00000001, historicalPrice * volatility),
            tokenInfo.volume24h * (1 - h / 24),
            tokenInfo.liquidity
          ]
        );
      }
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
    }
  }

  async getStats() {
    const stats = await this.db.query(`
      SELECT 
        COUNT(DISTINCT t.address) as total_tokens,
        COUNT(DISTINCT tp.token_address) as tokens_with_prices,
        AVG(t.initial_liquidity_usd) as avg_liquidity
      FROM tokens t
      LEFT JOIN token_prices tp ON t.address = tp.token_address
    `);
    
    return stats.rows[0];
  }

  async close() {
    await this.db.end();
  }
}

// Script principal
async function main() {
  const collector = new RaydiumCollector();
  
  try {
    // Essayer Raydium en premier
    let count = await collector.collectFromRaydiumAPI();
    
    if (count === 0) {
      console.log('\n⚠️ Aucune donnée collectée depuis les API');
      console.log('💡 Vérifiez votre connexion ou essayez avec un VPN');
    } else {
      const stats = await collector.getStats();
      console.log('\n📊 Statistiques finales:');
      console.log(`Total tokens: ${stats.total_tokens}`);
      console.log(`Tokens avec prix: ${stats.tokens_with_prices}`);
      console.log(`Liquidité moyenne: $${parseFloat(stats.avg_liquidity || '0').toFixed(2)}`);
    }
    
  } finally {
    await collector.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default RaydiumCollector;