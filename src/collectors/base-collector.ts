// src/collectors/base-collector.ts
// Classe abstraite pour tous les collectors de données

import { Token, PricePoint, APIResponse, CollectorConfig } from '../types';
import { logger } from '../utils/logger';
import { sleep } from '../utils/helpers';

export abstract class BaseCollector {
  protected config: CollectorConfig;
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;

  constructor(config: CollectorConfig) {
    this.config = config;
  }

  // Méthodes abstraites à implémenter par chaque collector
  abstract getName(): string;
  abstract fetchTokens(limit?: number): Promise<APIResponse<Token[]>>;
  abstract fetchPriceHistory(tokenAddress: string, days?: number): Promise<APIResponse<PricePoint[]>>;

  // Gestion du rate limiting
  protected async enforceRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const minInterval = 1000 / this.config.rateLimit; // ms entre requêtes

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      logger.debug(`Rate limit: attente de ${waitTime}ms`);
      await sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Wrapper pour les requêtes avec retry automatique
  protected async makeRequest<T>(
    requestFn: () => Promise<T>,
    retryCount: number = 0
  ): Promise<APIResponse<T>> {
    try {
      await this.enforceRateLimit();
      
      const startTime = Date.now();
      const data = await requestFn();
      const duration = Date.now() - startTime;
      
      logger.debug(`${this.getName()}: Requête réussie en ${duration}ms`);
      
      return {
        success: true,
        data
      };
      
    } catch (error: any) {
      logger.warn(`${this.getName()}: Erreur requête (tentative ${retryCount + 1})`, {
        error: error.message,
        retryCount
      });

      // Retry si possible
      if (retryCount < this.config.retryAttempts) {
        const backoffTime = Math.pow(2, retryCount) * 1000; // exponential backoff
        logger.debug(`Retry dans ${backoffTime}ms...`);
        await sleep(backoffTime);
        return this.makeRequest(requestFn, retryCount + 1);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validation des données token
  protected validateToken(token: any): boolean {
    return (
      token &&
      typeof token.symbol === 'string' &&
      typeof token.name === 'string' &&
      typeof token.current_price === 'number' &&
      token.current_price > 0 &&
      typeof token.total_volume === 'number' &&
      token.total_volume > 0
    );
  }

  // Validation des données de prix
  protected validatePricePoint(point: any): boolean {
    return (
      point &&
      point.timestamp &&
      typeof point.price === 'number' &&
      point.price > 0
    );
  }

  // Statistiques du collector
  public getStats() {
    return {
      name: this.getName(),
      enabled: this.config.enabled,
      requestCount: this.requestCount,
      rateLimit: this.config.rateLimit,
      lastRequestTime: new Date(this.lastRequestTime)
    };
  }

  // Reset des statistiques
  public resetStats(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}