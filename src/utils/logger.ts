// src/utils/logger.ts
// Système de logging structuré

import winston from 'winston';

// Configuration des niveaux de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Couleurs pour la console
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

winston.addColors(logColors);

// Format pour la console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

// Format pour les fichiers
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuration du logger
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Fichier pour les erreurs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    // Fichier pour tous les logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    })
  ]
});

// Créer le dossier logs s'il n'existe pas
import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Wrapper pour ajouter du contexte
class ContextLogger {
  private context: string;

  constructor(context: string = '') {
    this.context = context;
  }

  private formatMessage(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }

  debug(message: string, meta?: any) {
    logger.debug(this.formatMessage(message), meta);
  }

  info(message: string, meta?: any) {
    logger.info(this.formatMessage(message), meta);
  }

  warn(message: string, meta?: any) {
    logger.warn(this.formatMessage(message), meta);
  }

  error(message: string, meta?: any) {
    logger.error(this.formatMessage(message), meta);
  }

  // Méthodes spécialisées pour le trading
  trade(action: string, symbol: string, details: any) {
    this.info(`TRADE ${action}`, { symbol, ...details });
  }

  performance(metric: string, value: number, unit?: string) {
    this.info(`PERF ${metric}`, { value, unit });
  }

  api(service: string, action: string, duration?: number, error?: any) {
    if (error) {
      this.error(`API ${service} ${action} FAILED`, { duration, error: error.message });
    } else {
      this.debug(`API ${service} ${action}`, { duration });
    }
  }
}

// Export de l'instance par défaut et de la classe
export { logger };
export const createLogger = (context: string) => new ContextLogger(context);