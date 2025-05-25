'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, BarChart3, TrendingUp } from 'lucide-react';
import { BacktestForm } from '@/components/Backtest/BacktestForm';
import { BacktestProgress } from '@/components/Backtest/BacktestProgress';
import { BacktestResults } from '@/components/Backtest/BacktestResults';
import { useBacktest } from '@/lib/hooks/useApi';
import { useConfig } from '@/lib/hooks/useConfig';
import toast from 'react-hot-toast';

export default function BacktestPage() {
  const { config } = useConfig();
  const {
    backtestId,
    status,
    results,
    isRunning,
    startBacktest,
    stopBacktest,
    pollStatus,
    resetBacktest
  } = useBacktest();

  // Poll status en temps réel
  useEffect(() => {
    let interval;
    if (isRunning && backtestId) {
      interval = setInterval(pollStatus, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, backtestId, pollStatus]);

  const handleStartBacktest = async () => {
    try {
      await startBacktest(config);
      toast.success('Backtest démarré avec succès!');
    } catch (error) {
      toast.error('Erreur lors du démarrage du backtest');
      console.error(error);
    }
  };

  const handleStopBacktest = async () => {
    try {
      await stopBacktest();
      toast.success('Backtest arrêté');
    } catch (error) {
      toast.error('Erreur lors de l\'arrêt du backtest');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
          🎯 Backtest de Stratégie
        </h1>
        <p className="text-gray-400 text-lg">
          Testez votre stratégie sur les données historiques
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            ⚡ Contrôles du Backtest
          </h2>
          
          <div className="flex gap-4 items-center">
            <button
              onClick={handleStartBacktest}
              disabled={isRunning}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Backtest en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Démarrer Backtest
                </>
              )}
            </button>
            
            {isRunning && (
              <button
                onClick={handleStopBacktest}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-400 hover:to-red-500 flex items-center gap-2 transition-all"
              >
                <Square className="w-4 h-4" />
                Arrêter
              </button>
            )}
            
            {!isRunning && (backtestId || results) && (
              <button
                onClick={resetBacktest}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500 flex items-center gap-2"
              >
                Nouveau Backtest
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Progress */}
      {status && isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <BacktestProgress status={status} />
        </motion.div>
      )}

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BacktestResults results={results} />
        </motion.div>
      )}

      {/* Form (if no backtest running) */}
      {!isRunning && !results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BacktestForm config={config} />
        </motion.div>
      )}
    </div>
  );
}