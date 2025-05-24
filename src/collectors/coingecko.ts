// src/collectors/coingecko.ts
// Collector pour l'API CoinGecko (gratuite et fiable)

import axios from 'axios';
import { BaseCollector } from './base-collector';
import { Token, PricePoint, APIResponse, DataSource } from '../types';
import { logger } from '../utils/logger';

export class CoinGeckoCollector extends BaseCollector {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  getName(): string {
    return 'CoinGecko';
  }

  async fetchTokens(limit: number = 50): Promise<APIResponse<Token[]>> {
    logger.info(`Collecte de ${limit} tokens depuis CoinGecko...`);

    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          category: 'meme-token', // Focus sur les memecoins
          order: 'volume_desc',
          per_page: limit,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        timeout: this.config.timeout
      });

      const tokens: Token[] = response.data
        .filter((coin: any) => this.validateToken(coin) && coin.total_volume > 10000)
        .map((coin: any) => ({
          address: `cg_${coin.id}`,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          decimals: 9, // Standard pour la plupart des tokens
          currentPrice: coin.current_price,
          liquidity: coin.total_volume * 2, // Estimation liquidité
          volume24h: coin.total_volume,
          priceChange24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap || 0,
          createdAt: new Date(), // CoinGecko ne donne pas la date de création
          lastUpdated: new Date(),
          source: DataSource.COINGECKO
        }));

      logger.info(`✅ ${tokens.length} tokens CoinGecko collectés`);
      return tokens;
    });
  }

  async fetchPriceHistory(tokenAddress: string, days: number = 7): Promise<APIResponse<PricePoint[]>> {
    const coinId = tokenAddress.replace('cg_', '');
    logger.debug(`Collecte historique ${coinId} sur ${days} jours`);

    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily'
        },
        timeout: this.config.timeout
      });

      const priceData = response.data.prices || [];
      const volumeData = response.data.total_volumes || [];

      const priceHistory: PricePoint[] = priceData.map((point: any, index: number) => ({
        tokenAddress,
        timestamp: new Date(point[0]),
        price: point[1],
        volume: volumeData[index] ? volumeData[index][1] : 0
      })).filter((point: PricePoint) => this.validatePricePoint(point));

      logger.debug(`✅ ${priceHistory.length} points d'historique collectés pour ${coinId}`);
      return priceHistory;
    });
  }

  // Méthode spécifique pour récupérer les trending coins
  async fetchTrendingTokens(): Promise<APIResponse<Token[]>> {
    logger.info('Collecte des tokens trending depuis CoinGecko...');

    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/search/trending`, {
        timeout: this.config.timeout
      });

      const trendingCoins = response.data.coins || [];
      const tokens: Token[] = [];

      // Pour chaque trending coin, récupérer les détails
      for (const coin of trendingCoins.slice(0, 10)) {
        try {
          const detailResponse = await axios.get(`${this.baseUrl}/coins/${coin.item.id}`, {
            timeout: this.config.timeout
          });

          const detail = detailResponse.data;
          if (detail.market_data && this.validateToken(detail.market_data)) {
            tokens.push({
              address: `cg_${detail.id}`,
              symbol: detail.symbol.toUpperCase(),
              name: detail.name,
              decimals: 9,
              currentPrice: detail.market_data.current_price?.usd || 0,
              liquidity: (detail.market_data.total_volume?.usd || 0) * 2,
              volume24h: detail.market_data.total_volume?.usd || 0,
              priceChange24h: detail.market_data.price_change_percentage_24h || 0,
              marketCap: detail.market_data.market_cap?.usd || 0,
              createdAt: new Date(),
              lastUpdated: new Date(),
              source: DataSource.COINGECKO
            });
          }
        } catch (error) {
          logger.warn(`Erreur récupération détails pour ${coin.item.id}`);
        }
      }

      logger.info(`✅ ${tokens.length} tokens trending collectés`);
      return tokens;
    });
  }

  // Récupérer les prix en temps réel pour plusieurs tokens
  async fetchMultiplePrices(coinIds: string[]): Promise<APIResponse<{[key: string]: number}>> {
    const ids = coinIds.map(id => id.replace('cg_', '')).join(',');
    
    return this.makeRequest(async () => {
      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params: {
          ids: ids,
          vs_currencies: 'usd',
          include_24hr_change: true
        },
        timeout: this.config.timeout
      });

      const prices: {[key: string]: number} = {};
      Object.entries(response.data).forEach(([coinId, data]: [string, any]) => {
        prices[`cg_${coinId}`] = data.usd || 0;
      });

      return prices;
    });
  }
}