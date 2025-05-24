// src/collectors/birdeye.ts
// Collector pour l'API Birdeye (données Solana en temps réel)

import axios from 'axios';
import { BaseCollector } from './base-collector';
import { Token, PricePoint, APIResponse, DataSource } from '../types';
import { logger } from '../utils/logger';

export class BirdeyeCollector extends BaseCollector {
  private readonly baseUrl = 'https://public-api.birdeye.so';
  private readonly apiKey: string;

  constructor(config: any) {
    super(config);
    this.apiKey = process.env.BIRDEYE_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('⚠️ BIRDEYE_API_KEY non configurée, utilisation de l\'API publique limitée');
    }
  }

  getName(): string {
    return 'Birdeye';
  }

  async fetchTokens(limit: number = 50): Promise<APIResponse<Token[]>> {
    logger.info(`Collecte de ${limit} tokens depuis Birdeye...`);

    return this.makeRequest(async () => {
      // Récupérer la liste des tokens trending sur Solana
      const response = await axios.get(`${this.baseUrl}/defi/tokenlist`, {
        params: {
          sort_by: 'v24hUSD',
          sort_type: 'desc',
          offset: 0,
          limit: limit
        },
        headers: this.getHeaders(),
        timeout: this.config.timeout
      });

      if (!response.data?.data?.tokens) {
        throw new Error('Aucune donnée de tokens trouvée');
      }

      const tokens: Token[] = response.data.data.tokens
        .filter((token: any) => this.isValidBirdeyeToken(token))
        .map((token: any) => this.birdeyeTokenToToken(token));

      logger.info(`✅ ${tokens.length} tokens Birdeye collectés`);
      return tokens;
    });
  }

  async fetchPriceHistory(tokenAddress: string, days: number = 7): Promise<APIResponse<PricePoint[]>> {
    logger.debug(`Collecte historique ${tokenAddress} sur ${days} jours`);

    return this.makeRequest(async () => {
      const timeType = days <= 1 ? '1H' : days <= 7 ? '4H' : '1D';
      const timeFrom = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
      const timeTo = Math.floor(Date.now() / 1000);

      const response = await axios.get(`${this.baseUrl}/defi/history_price`, {
        params: {
          address: tokenAddress,
          address_type: 'token',
          type: timeType,
          time_from: timeFrom,
          time_to: timeTo
        },
        headers: this.getHeaders(),
        timeout: this.config.timeout
      });

      if (!response.data?.data?.items) {
        return [];
      }

      const priceHistory: PricePoint[] = response.data.data.items
        .filter((item: any) => item.value > 0)
        .map((item: any) => ({
          tokenAddress,
          timestamp: new Date(item.unixTime * 1000),
          price: item.value,
          volume: 0 // Birdeye ne fournit pas le volume dans cet endpoint
        }));

      logger.debug(`✅ ${priceHistory.length} points d'historique collectés pour ${tokenAddress}`);
      return priceHistory;
    });
  }

  // Récupérer les tokens avec le plus gros volume
  async fetchTopVolumeTokens(limit: number = 20): Promise<APIResponse<Token[]>> {
    logger.info(`Collecte des ${limit} tokens avec le plus gros volume...`);

    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/defi/tokenlist`, {
        params: {
          sort_by: 'v24hUSD',
          sort_type: 'desc',
          offset: 0,
          limit: limit
        },
        headers: this.getHeaders(),
        timeout: this.config.timeout
      });

      const tokens: Token[] = (response.data?.data?.tokens || [])
        .filter((token: any) => this.isValidBirdeyeToken(token))
        .filter((token: any) => token.v24hUSD > 50000) // Volume minimum 50k$
        .map((token: any) => this.birdeyeTokenToToken(token));

      logger.info(`✅ ${tokens.length} tokens high-volume collectés`);
      return tokens;
    });
  }

  // Récupérer les nouveaux tokens
  async fetchNewTokens(limit: number = 15): Promise<APIResponse<Token[]>> {
    logger.info(`Collecte des ${limit} nouveaux tokens...`);

    return this.makeRequest(async () => {
      // Birdeye n'a pas d'endpoint "new tokens" public, on filtre par création récente
      const response = await axios.get(`${this.baseUrl}/defi/tokenlist`, {
        params: {
          sort_by: 'createdAt',
          sort_type: 'desc',
          offset: 0,
          limit: limit * 2 // Prendre plus pour filtrer
        },
        headers: this.getHeaders(),
        timeout: this.config.timeout
      });

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const tokens: Token[] = (response.data?.data?.tokens || [])
        .filter((token: any) => this.isValidBirdeyeToken(token))
        .filter((token: any) => {
          const createdAt = new Date(token.createdAt).getTime();
          return createdAt > oneDayAgo; // Créé dans les 24h
        })
        .slice(0, limit)
        .map((token: any) => this.birdeyeTokenToToken(token));

      logger.info(`✅ ${tokens.length} nouveaux tokens collectés`);
      return tokens;
    });
  }

  // Rechercher des tokens par symbole/nom
  async searchTokens(query: string): Promise<APIResponse<Token[]>> {
    logger.info(`Recherche de tokens: "${query}"`);

    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/defi/search`, {
        params: {
          keyword: query,
          limit: 20
        },
        headers: this.getHeaders(),
        timeout: this.config.timeout
      });

      const tokens: Token[] = (response.data?.data || [])
        .filter((token: any) => this.isValidBirdeyeToken(token))
        .map((token: any) => this.birdeyeTokenToToken(token));

      logger.info(`✅ ${tokens.length} tokens trouvés pour "${query}"`);
      return tokens;
    });
  }

  // Headers pour les requêtes
  private getHeaders() {
    const headers: any = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; MemecoinBot/1.0)'
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    return headers;
  }

  // Validation d'un token Birdeye
  private isValidBirdeyeToken(token: any): boolean {
    return (
      token &&
      token.address &&
      token.symbol &&
      typeof token.price === 'number' &&
      token.price > 0 &&
      token.liquidity > 1000 && // Minimum 1k$ de liquidité
      !this.isStablecoin(token.symbol)
    );
  }

  // Vérifier si c'est un stablecoin
  private isStablecoin(symbol: string): boolean {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'UST', 'TUSD'];
    return stablecoins.includes(symbol.toUpperCase());
  }

  // Convertir un token Birdeye en Token
  private birdeyeTokenToToken(token: any): Token {
    return {
      address: token.address,
      symbol: token.symbol.toUpperCase(),
      name: token.name || token.symbol,
      decimals: token.decimals || 9,
      currentPrice: token.price || 0,
      liquidity: token.liquidity || 0,
      volume24h: token.v24hUSD || 0,
      priceChange24h: token.priceChange24h || 0,
      marketCap: token.mc || 0,
      createdAt: token.createdAt ? new Date(token.createdAt) : new Date(),
      lastUpdated: new Date(),
      source: DataSource.BIRDEYE
    };
  }
}