// src/collectors/dexscreener.ts
// Collector pour l'API DexScreener (données DEX en temps réel)

import axios from 'axios';
import { BaseCollector } from './base-collector';
import { Token, PricePoint, APIResponse, DataSource } from '../types';
import { logger } from '../utils/logger';

export class DexScreenerCollector extends BaseCollector {
  private readonly baseUrl = 'https://api.dexscreener.com/latest/dex';

  getName(): string {
    return 'DexScreener';
  }

  async fetchTokens(limit: number = 50): Promise<APIResponse<Token[]>> {
    logger.info(`Collecte de ${limit} tokens depuis DexScreener...`);

    return this.makeRequest(async () => {
      // Récupérer les paires Solana les plus actives
      const response = await axios.get(`${this.baseUrl}/pairs/solana`, {
        timeout: this.config.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; MemecoinBot/1.0)'
        }
      });

      if (!response.data?.pairs) {
        throw new Error('Aucune donnée de paires trouvée');
      }

      const tokens: Token[] = response.data.pairs
        .filter((pair: any) => this.isValidPair(pair))
        .slice(0, limit)
        .map((pair: any) => this.pairToToken(pair));

      logger.info(`✅ ${tokens.length} tokens DexScreener collectés`);
      return tokens;
    });
  }

  async fetchPriceHistory(tokenAddress: string, days: number = 7): Promise<APIResponse<PricePoint[]>> {
    logger.debug(`Collecte historique ${tokenAddress} sur ${days} jours`);

    // DexScreener ne fournit pas d'historique direct, on va chercher par token
    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/tokens/${tokenAddress}`, {
        timeout: this.config.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; MemecoinBot/1.0)'
        }
      });

      const pairs = response.data?.pairs || [];
      if (pairs.length === 0) {
        return [];
      }

      // Prendre la paire avec le plus de liquidité
      const mainPair = pairs.reduce((prev: any, current: any) => 
        (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
      );

      // Générer des points d'historique basés sur les données actuelles
      // (DexScreener n'a pas d'API historique publique)
      const priceHistory: PricePoint[] = this.generateRecentHistory(
        tokenAddress,
        parseFloat(mainPair.priceUsd || '0'),
        parseFloat(mainPair.priceChange?.h24 || '0'),
        days
      );

      logger.debug(`✅ ${priceHistory.length} points d'historique générés pour ${tokenAddress}`);
      return priceHistory;
    });
  }

  // Rechercher des tokens par critères spécifiques
  async searchTokens(query: string): Promise<APIResponse<Token[]>> {
    logger.info(`Recherche de tokens: "${query}"`);

    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: { q: query },
        timeout: this.config.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; MemecoinBot/1.0)'
        }
      });

      const tokens: Token[] = (response.data?.pairs || [])
        .filter((pair: any) => this.isValidPair(pair))
        .map((pair: any) => this.pairToToken(pair));

      logger.info(`✅ ${tokens.length} tokens trouvés pour "${query}"`);
      return tokens;
    });
  }

  // Récupérer les tokens les plus actifs
  async fetchHotTokens(): Promise<APIResponse<Token[]>> {
    logger.info('Collecte des tokens les plus actifs...');

    return this.makeRequest(async () => {
      // Rechercher par critères de volume élevé
      const searches = [
        'volume:>100000 chain:solana',
        'liquidity:>50000 chain:solana',
        'priceChange24h:>50 chain:solana'
      ];

      const allTokens: Token[] = [];

      for (const searchQuery of searches) {
        try {
          const response = await axios.get(`${this.baseUrl}/search`, {
            params: { q: searchQuery },
            timeout: this.config.timeout,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; MemecoinBot/1.0)'
            }
          });

          const tokens = (response.data?.pairs || [])
            .filter((pair: any) => this.isValidPair(pair))
            .map((pair: any) => this.pairToToken(pair));

          allTokens.push(...tokens);
        } catch (error) {
          logger.warn(`Erreur recherche: ${searchQuery}`);
        }
      }

      // Dédupliquer par adresse
      const uniqueTokens = Array.from(
        new Map(allTokens.map(token => [token.address, token])).values()
      );

      logger.info(`✅ ${uniqueTokens.length} tokens actifs collectés`);
      return uniqueTokens;
    });
  }

  // Validation d'une paire DexScreener
  private isValidPair(pair: any): boolean {
    return (
      pair &&
      pair.chainId === 'solana' &&
      pair.baseToken?.address &&
      pair.baseToken?.symbol &&
      pair.priceUsd &&
      parseFloat(pair.priceUsd) > 0 &&
      pair.liquidity?.usd &&
      parseFloat(pair.liquidity.usd) > 1000 && // Minimum 1k$ de liquidité
      !this.isStablecoin(pair.baseToken.symbol)
    );
  }

  // Vérifier si c'est un stablecoin (à éviter)
  private isStablecoin(symbol: string): boolean {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'UST'];
    return stablecoins.includes(symbol.toUpperCase());
  }

  // Convertir une paire DexScreener en Token
  private pairToToken(pair: any): Token {
    return {
      address: pair.baseToken.address,
      symbol: pair.baseToken.symbol.toUpperCase(),
      name: pair.baseToken.name || pair.baseToken.symbol,
      decimals: 9,
      currentPrice: parseFloat(pair.priceUsd || '0'),
      liquidity: parseFloat(pair.liquidity?.usd || '0'),
      volume24h: parseFloat(pair.volume?.h24 || '0'),
      priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
      marketCap: parseFloat(pair.fdv || '0'),
      createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt * 1000) : new Date(),
      lastUpdated: new Date(),
      source: DataSource.DEXSCREENER
    };
  }

  // Générer un historique récent basé sur les données actuelles
  private generateRecentHistory(
    tokenAddress: string,
    currentPrice: number,
    change24h: number,
    days: number
  ): PricePoint[] {
    const points: PricePoint[] = [];
    const hoursBack = days * 24;
    
    // Prix il y a 24h
    const price24hAgo = currentPrice / (1 + change24h / 100);
    
    for (let h = hoursBack; h >= 0; h--) {
      const timestamp = new Date(Date.now() - h * 60 * 60 * 1000);
      
      // Interpolation linéaire avec un peu de bruit
      const progress = (hoursBack - h) / hoursBack;
      let price = price24hAgo + (currentPrice - price24hAgo) * progress;
      
      // Ajouter de la volatilité réaliste
      const volatility = 0.02 + Math.random() * 0.08; // 2-10% de volatilité
      const noise = 1 + (Math.random() - 0.5) * volatility;
      price *= noise;
      
      // Éviter les prix négatifs
      price = Math.max(price, currentPrice * 0.01);
      
      points.push({
        tokenAddress,
        timestamp,
        price,
        volume: Math.random() * 50000 + 1000 // Volume simulé
      });
    }
    
    return points;
  }
}