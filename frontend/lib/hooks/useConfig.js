import { useState, useCallback } from 'react';
import { validateConfig } from '@/lib/utils';

const DEFAULT_CONFIG = {
  initial_capital: 10000,
  position_size: 2.0,
  start_year: 2023,
  start_month: 1,
  end_year: 2024,
  end_month: 12,
  detection_threshold: 30,
  stop_loss: -20,
  max_holding_days: 8,
  tp1: 35,
  tp2: 80,
  tp3: 200,
  tp4: 500,
  tp5: 1200
};

export const useConfig = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const updateConfig = useCallback((newConfig) => {
    setConfig(newConfig);
  }, []);

  const updateField = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const validation = validateConfig(config);

  return {
    config,
    updateConfig,
    updateField,
    resetConfig,
    validateConfig: () => validation,
    isValid: validation.valid,
    errors: validation.errors
  };
};