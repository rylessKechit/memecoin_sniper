// components/Backtest/BacktestProgress.js
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Target, Zap } from 'lucide-react';
import { formatCurrency, formatPercent, formatRelativeTime } from '@/lib/utils';

export const BacktestProgress = ({ status }) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'running': return 'from-blue-500 to-blue-600';
      case 'completed': return 'from-green-500 to-green-600';
      case 'failed': return 'from-red-500 to-red-600';
      case 'stopped': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          Progression du Backtest
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor()} text-white`}>
          {status.status.toUpperCase()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{status.message}</span>
          <span>{status.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getStatusColor()} relative`}
            initial={{ width: 0 }}
            animate={{ width: `${status.progress}%` }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </motion.div>
        </div>
      </div>

      {/* Live Metrics */}
      {status.live_metrics && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary-400">
              {status.live_metrics.capital}
            </div>
            <div className="text-xs text-gray-400">Capital Actuel</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">
              {status.live_metrics.return}
            </div>
            <div className="text-xs text-gray-400">Rendement</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-400">
              {status.live_metrics.trades}
            </div>
            <div className="text-xs text-gray-400">Trades</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-400">
              {status.live_metrics.moon_shots}
            </div>
            <div className="text-xs text-gray-400">Moon Shots</div>
          </div>
        </motion.div>
      )}

      {/* Time Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Démarré: {formatRelativeTime(status.started_at)}</span>
          {status.current_month && status.total_months && (
            <span>Mois {status.current_month}/{status.total_months}</span>
          )}
        </div>
      </div>
    </div>
  );
};