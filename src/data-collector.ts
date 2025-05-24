// data-collector.ts
import { Connection, PublicKey, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { Pool } from 'pg';
import axios from 'axios';

interface TokenLaunch {
  signature: string;
  tokenMint: string;
  poolAddress: string;
  timestamp: number;
  initialLiquiditySOL: number;
  initialLiquidityUSD: number;
  lpBurned: boolean;
  mintAuthorityRenounced: boolean;
  freezeAuthorityRenounced: boolean;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

interface PriceData {
  price: number;
  volume24h: number;
  priceChange24h: number;
  marketCap: number;
}

class SolanaDataCollector {
  private connection: Connection;
  private db: Pool;
  private raydiumProgramId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
  private raydiumAuthority = new PublicKey('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1');
  
  constructor() {
    // Utiliser plusieurs RPC pour éviter les rate limits
    const rpcUrls = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
      'https://solana.public-rpc.com'
    ];
    
    // Choisir un RPC aléatoire pour commencer
    const selectedRpc = rpcUrls[Math.floor(Math.random() * rpcUrls.length)];
    this.connection = new Connection(selectedRpc, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
    
    console.log(`🌐 Utilisation du RPC: ${selectedRpc}`);
    
    // Connexion à PostgreSQL
    this.db = new Pool({
      host: 'localhost',
      database: 'memecoin_bot',
      port: 5432,
    });
    
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      // Créer les tables si elles n'existent pas
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS token_launches (
          id SERIAL PRIMARY KEY,
          signature VARCHAR(255) UNIQUE NOT NULL,
          token_mint VARCHAR(255) NOT NULL,
          pool_address VARCHAR(255) NOT NULL,
          timestamp BIGINT NOT NULL,
          initial_liquidity_sol DECIMAL(20, 9),
          initial_liquidity_usd DECIMAL(20, 2),
          lp_burned BOOLEAN DEFAULT FALSE,
          mint_renounced BOOLEAN DEFAULT FALSE,
          freeze_renounced BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS token_metadata (
          token_mint VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          symbol VARCHAR(50),
          decimals INTEGER,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS price_history (
          id SERIAL PRIMARY KEY,
          token_mint VARCHAR(255) NOT NULL,
          timestamp BIGINT NOT NULL,
          price DECIMAL(30, 15),
          volume_24h DECIMAL(20, 2),
          price_change_24h DECIMAL(10, 2),
          market_cap DECIMAL(20, 2),
          UNIQUE(token_mint, timestamp)
        );

        CREATE INDEX IF NOT EXISTS idx_timestamp ON token_launches(timestamp);
        CREATE INDEX IF NOT EXISTS idx_token_mint ON price_history(token_mint);
      `);
      
      console.log('✅ Base de données initialisée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    }
  }

  async collectHistoricalData(hours: number = 24) {
    console.log(`🔍 Début de la collecte des ${hours} dernières heures...`);
    
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (hours * 3600);
    
    try {
      // Récupérer les signatures des transactions Raydium
      console.log('📊 Récupération des transactions Raydium...');
      
      let lastSignature: string | undefined;
      let allSignatures: any[] = [];
      let foundOldEnough = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!foundOldEnough && allSignatures.length < 1000) { // Limiter à 1000 pour commencer
        try {
          const signatures = await this.connection.getSignaturesForAddress(
            this.raydiumProgramId,
            {
              limit: 100, // Réduire la limite par requête
              before: lastSignature
            }
          );

          if (signatures.length === 0) break;

          for (const sig of signatures) {
            if (sig.blockTime && sig.blockTime >= startTime) {
              allSignatures.push(sig);
            } else {
              foundOldEnough = true;
              break;
            }
          }

          lastSignature = signatures[signatures.length - 1].signature;
          console.log(`📈 ${allSignatures.length} signatures récupérées...`);
          
          // Pause plus longue pour éviter le rate limiting
          await this.sleep(2000); // 2 secondes entre chaque batch
          retryCount = 0; // Reset retry count on success
          
        } catch (error: any) {
          if (error.message?.includes('429') && retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ Rate limit atteint, pause de ${retryCount * 5} secondes...`);
            await this.sleep(retryCount * 5000); // Pause progressive
          } else {
            throw error;
          }
        }
      }

      console.log(`✅ Total: ${allSignatures.length} signatures à analyser`);

      // Analyser chaque transaction avec des pauses
      let newPools = 0;
      for (let i = 0; i < allSignatures.length; i++) {
        if (i % 50 === 0) {
          console.log(`🔄 Progression: ${i}/${allSignatures.length}`);
          // Pause tous les 50 transactions
          await this.sleep(3000);
        }

        try {
          const tx = await this.connection.getParsedTransaction(
            allSignatures[i].signature,
            { maxSupportedTransactionVersion: 0 }
          );

          if (tx && this.isPoolInitialization(tx)) {
            const tokenData = await this.extractTokenData(tx, allSignatures[i]);
            if (tokenData) {
              await this.saveTokenLaunch(tokenData);
              newPools++;
              console.log(`💎 Nouveau token trouvé: ${tokenData.tokenMint}`);
            }
          }

          // Pause entre les requêtes
          await this.sleep(500); // 500ms entre chaque transaction
        } catch (error: any) {
          if (error.message?.includes('429')) {
            console.log(`⏳ Rate limit sur tx ${i}, pause de 10 secondes...`);
            await this.sleep(10000);
            i--; // Réessayer cette transaction
          } else {
            console.error(`❌ Erreur sur tx ${allSignatures[i].signature}:`, error.message);
          }
        }
      }

      console.log(`✅ Collecte terminée: ${newPools} nouveaux pools trouvés`);
      
      // Récupérer les métadonnées et prix actuels
      await this.updateTokenMetadata();
      await this.updateCurrentPrices();

    } catch (error) {
      console.error('❌ Erreur lors de la collecte:', error);
    }
  }

  private isPoolInitialization(tx: ParsedTransactionWithMeta): boolean {
    if (!tx.meta || !tx.transaction.message.instructions) return false;

    // Chercher une instruction d'initialisation de pool Raydium
    for (const instruction of tx.transaction.message.instructions) {
      if ('programId' in instruction && 
          instruction.programId.toString() === this.raydiumProgramId.toString()) {
        
        // Vérifier si c'est une instruction d'initialisation
        // Les pools Raydium ont généralement une instruction spécifique
        const innerInstructions = tx.meta.innerInstructions || [];
        
        // Patterns typiques d'une création de pool
        if (innerInstructions.length > 0 && tx.meta.postTokenBalances && 
            tx.meta.postTokenBalances.length > 4) {
          return true;
        }
      }
    }
    
    return false;
  }

  private async extractTokenData(
    tx: ParsedTransactionWithMeta, 
    sigInfo: any
  ): Promise<TokenLaunch | null> {
    try {
      if (!tx.meta || !tx.meta.postTokenBalances) return null;

      // Identifier les tokens impliqués
      const tokenBalances = tx.meta.postTokenBalances;
      const mints = new Set<string>();
      
      for (const balance of tokenBalances) {
        if (balance.mint) {
          mints.add(balance.mint);
        }
      }

      // Exclure WSOL et USDC/USDT
      const knownTokens = [
        'So11111111111111111111111111111111111111112', // WSOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      ];

      const newTokens = Array.from(mints).filter(mint => !knownTokens.includes(mint));
      if (newTokens.length === 0) return null;

      const tokenMint = newTokens[0]; // Le nouveau token

      // Calculer la liquidité initiale
      let solAmount = 0;
      for (const balance of tokenBalances) {
        if (balance.mint === 'So11111111111111111111111111111111111111112') {
          solAmount = Math.max(solAmount, balance.uiTokenAmount.uiAmount || 0);
        }
      }

      // Obtenir le prix SOL en USD (simulé pour l'instant)
      const solPriceUSD = await this.getSolPrice();
      
      return {
        signature: sigInfo.signature,
        tokenMint: tokenMint,
        poolAddress: tx.transaction.message.accountKeys[0].pubkey.toString(),
        timestamp: sigInfo.blockTime || 0,
        initialLiquiditySOL: solAmount,
        initialLiquidityUSD: solAmount * solPriceUSD,
        lpBurned: false, // À vérifier plus tard
        mintAuthorityRenounced: false, // À vérifier
        freezeAuthorityRenounced: false, // À vérifier
      };

    } catch (error) {
      console.error('Erreur extraction token data:', error);
      return null;
    }
  }

  private async getSolPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      );
      return response.data.solana.usd;
    } catch (error) {
      console.error('Erreur récupération prix SOL:', error);
      return 100; // Prix par défaut
    }
  }

  private async saveTokenLaunch(token: TokenLaunch) {
    try {
      await this.db.query(
        `INSERT INTO token_launches 
         (signature, token_mint, pool_address, timestamp, initial_liquidity_sol, 
          initial_liquidity_usd, lp_burned, mint_renounced, freeze_renounced)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (signature) DO NOTHING`,
        [
          token.signature,
          token.tokenMint,
          token.poolAddress,
          token.timestamp,
          token.initialLiquiditySOL,
          token.initialLiquidityUSD,
          token.lpBurned,
          token.mintAuthorityRenounced,
          token.freezeAuthorityRenounced
        ]
      );
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
    }
  }

  private async updateTokenMetadata() {
    console.log('🔍 Mise à jour des métadonnées des tokens...');
    
    const result = await this.db.query(
      'SELECT DISTINCT token_mint FROM token_launches WHERE token_mint NOT IN (SELECT token_mint FROM token_metadata)'
    );

    for (const row of result.rows) {
      try {
        // Récupérer les métadonnées du token
        const mintPubkey = new PublicKey(row.token_mint);
        const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);
        
        if (mintInfo.value && 'parsed' in mintInfo.value.data) {
          const parsed = mintInfo.value.data.parsed;
          
          await this.db.query(
            `INSERT INTO token_metadata (token_mint, name, symbol, decimals)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (token_mint) DO UPDATE
             SET name = $2, symbol = $3, decimals = $4, updated_at = CURRENT_TIMESTAMP`,
            [
              row.token_mint,
              parsed.info.name || 'Unknown',
              parsed.info.symbol || 'UNKNOWN',
              parsed.info.decimals || 9
            ]
          );
        }

        await this.sleep(100); // Éviter rate limit
      } catch (error) {
        console.error(`Erreur métadonnées pour ${row.token_mint}:`, error);
      }
    }
  }

  private async updateCurrentPrices() {
    console.log('💰 Mise à jour des prix actuels...');
    
    // Pour l'instant, on simule les prix
    // En production, utiliser Jupiter ou Birdeye API
    const tokens = await this.db.query('SELECT DISTINCT token_mint FROM token_launches');
    
    for (const row of tokens.rows) {
      const priceData: PriceData = {
        price: Math.random() * 0.001, // Prix simulé
        volume24h: Math.random() * 100000,
        priceChange24h: (Math.random() - 0.5) * 200,
        marketCap: Math.random() * 1000000
      };

      await this.db.query(
        `INSERT INTO price_history (token_mint, timestamp, price, volume_24h, price_change_24h, market_cap)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (token_mint, timestamp) DO NOTHING`,
        [
          row.token_mint,
          Math.floor(Date.now() / 1000),
          priceData.price,
          priceData.volume24h,
          priceData.priceChange24h,
          priceData.marketCap
        ]
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getStats() {
    const stats = await this.db.query(`
      SELECT 
        COUNT(*) as total_tokens,
        AVG(initial_liquidity_usd) as avg_liquidity,
        COUNT(CASE WHEN lp_burned THEN 1 END) as burned_count,
        COUNT(CASE WHEN mint_renounced THEN 1 END) as renounced_count
      FROM token_launches
    `);

    return stats.rows[0];
  }

  async close() {
    await this.db.end();
  }
}

// Script principal
async function main() {
  const collector = new SolanaDataCollector();
  
  // Collecter les données des 24 dernières heures
  await collector.collectHistoricalData(24);
  
  // Afficher les statistiques
  const stats = await collector.getStats();
  console.log('\n📊 Statistiques finales:');
  console.log(`Total tokens: ${stats.total_tokens}`);
  console.log(`Liquidité moyenne: $${parseFloat(stats.avg_liquidity).toFixed(2)}`);
  console.log(`LP burned: ${stats.burned_count}`);
  console.log(`Mint renounced: ${stats.renounced_count}`);
  
  await collector.close();
}

// Lancer si exécuté directement
if (require.main === module) {
  main().catch(console.error);
}

export { SolanaDataCollector };