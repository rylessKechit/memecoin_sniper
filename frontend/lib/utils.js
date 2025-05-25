// Formatage des nombres et devises
export const formatCurrency = (value, options = {}) => {
  const {
    currency = 'USD',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'en-US'
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

export const formatPercent = (value, decimals = 2) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

// Formatage des dates
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('fr-FR');
    case 'long':
      return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('fr-FR');
    case 'datetime':
      return `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR')}`;
    default:
      return d.toLocaleDateString('fr-FR');
  }
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return formatDate(date);
};

// Utilitaires de calcul
export const calculatePercentChange = (oldValue, newValue) => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

export const calculateCompoundReturn = (returns) => {
  return returns.reduce((acc, ret) => acc * (1 + ret / 100), 1) - 1;
};

export const calculateDrawdown = (values) => {
  let maxDrawdown = 0;
  let peak = values[0];
  
  for (const value of values) {
    if (value > peak) {
      peak = value;
    } else {
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100;
};

export const calculateSharpeRatio = (returns, riskFreeRate = 0) => {
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  return volatility === 0 ? 0 : (avgReturn - riskFreeRate) / volatility;
};

// Validation des configurations
export const validateConfig = (config) => {
  const errors = [];
  
  // Validation du capital
  if (!config.initial_capital || config.initial_capital < 1000) {
    errors.push('Capital initial minimum: 1000$');
  }
  if (config.initial_capital > 1000000) {
    errors.push('Capital initial maximum: 1M$');
  }
  
  // Validation position size
  if (!config.position_size || config.position_size < 0.1) {
    errors.push('Position size minimum: 0.1%');
  }
  if (config.position_size > 10) {
    errors.push('Position size maximum: 10%');
  }
  
  // Validation des dates
  const startDate = new Date(config.start_year, config.start_month - 1);
  const endDate = new Date(config.end_year, config.end_month - 1);
  
  if (startDate >= endDate) {
    errors.push('La date de fin doit être postérieure à la date de début');
  }
  
  const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
  
  if (monthsDiff > 36) {
    errors.push('Période maximum: 36 mois');
  }
  
  // Validation stop loss
  if (!config.stop_loss || config.stop_loss >= 0) {
    errors.push('Stop loss doit être négatif');
  }
  if (config.stop_loss < -50) {
    errors.push('Stop loss maximum: -50%');
  }
  
  // Validation take profits
  const tps = [config.tp1, config.tp2, config.tp3, config.tp4, config.tp5];
  for (let i = 0; i < tps.length - 1; i++) {
    if (tps[i] >= tps[i + 1]) {
      errors.push(`TP${i + 1} doit être inférieur à TP${i + 2}`);
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Utilitaires de couleur
export const getPerformanceColor = (value) => {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-400';
};

export const getPerformanceColorHex = (value) => {
  if (value > 0) return '#4ade80';
  if (value < 0) return '#f87171';
  return '#9ca3af';
};

export const getRiskColor = (risk) => {
  if (risk < 10) return 'text-green-400';
  if (risk < 20) return 'text-yellow-400';
  if (risk < 30) return 'text-orange-400';
  return 'text-red-400';
};

// Utilitaires de stockage local
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde localStorage:', error);
    return false;
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erreur chargement localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Erreur suppression localStorage:', error);
    return false;
  }
};

// Utilitaires de génération de données
export const generateMockData = (length, min = 0, max = 100) => {
  return Array.from({ length }, () => Math.random() * (max - min) + min);
};

export const generateDateRange = (startDate, endDate, interval = 'day') => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    dates.push(new Date(start));
    
    switch (interval) {
      case 'day':
        start.setDate(start.getDate() + 1);
        break;
      case 'week':
        start.setDate(start.getDate() + 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() + 1);
        break;
      default:
        start.setDate(start.getDate() + 1);
    }
  }
  
  return dates;
};

// Utilitaires de debounce et throttle
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Utilitaires d'export
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToJSON = (data, filename = 'export.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Constantes utiles
export const MEMECOIN_LIST = [
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633' },
  { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', color: '#FFA409' },
  { id: 'pepe', name: 'Pepe', symbol: 'PEPE', color: '#00D4AA' },
  { id: 'floki', name: 'Floki Inu', symbol: 'FLOKI', color: '#F0B90B' },
  { id: 'bonk', name: 'Bonk', symbol: 'BONK', color: '#FF6B35' },
];

export const PERFORMANCE_THRESHOLDS = {
  excellent: 100,
  good: 50,
  average: 20,
  poor: 0,
  terrible: -20
};

export const RISK_LEVELS = {
  low: { max: 10, color: 'green', label: 'Faible' },
  medium: { max: 20, color: 'yellow', label: 'Modéré' },
  high: { max: 30, color: 'orange', label: 'Élevé' },
  extreme: { max: 100, color: 'red', label: 'Extrême' }
};