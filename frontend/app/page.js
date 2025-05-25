'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Zap, Settings, Play, PieChart } from 'lucide-react';
import { MetricCard } from '@/components/Dashboard/MetricCard';
import { QuickActions } from '@/components/Dashboard/QuickActions';
import { ActiveBacktests } from '@/components/Dashboard/ActiveBacktests';
import { PerformanceChart } from '@/components/Charts/PerformanceChart';
import { useApi } from '@/lib/hooks/useApi';
import { formatCurrency, formatPercent } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState(null);
  const [recentResults, setRecentResults] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { api } = useApi();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statusRes, performanceRes, marketRes] = await Promise.all([
        api.getStatus(),
        api.getPerformanceSummary(),
        api.getMarketOverview()
      ]);
      
      setApiStatus(statusRes);
      setRecentResults(performanceRes.performance?.last_30_days);
      setMarketData(marketRes);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur de connexion à l\'API');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
          🤖 Memecoin Trading Bot
        </h1>
        <p className="text-gray-400 text-lg">
          Dashboard de contrôle et monitoring de votre stratégie de trading
        </p>
      </motion.div>

      {/* API Status Banner */}
      {apiStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mb-6 p-4 rounded-lg border ${
            apiStatus.status === 'running' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              apiStatus.status === 'running' ? 'bg-green-400' : 'bg-red-400'
            } animate-pulse`}></div>
            <span className="font-medium">
              {apiStatus.status === 'running' ? '✅ API Active' : '❌ API Déconnectée'}
            </span>
            <span className="text-sm opacity-70">
              • {apiStatus.active_backtests} backtests actifs
              • CoinGecko: {apiStatus.coingecko_status}
            </span>
          </div>
        </motion.div>
      )}

      {/* Performance Metrics */}
      {recentResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-400" />
            Performance des 30 derniers jours
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Rendement Total"
              value={formatPercent(recentResults.total_return)}
              icon={<TrendingUp />}
              trend={recentResults.total_return > 0 ? 'up' : 'down'}
              className="col-span-1"
            />
            <MetricCard
              title="Taux de Réussite"
              value={`${recentResults.win_rate.toFixed(1)}%`}
              icon={<BarChart3 />}
              trend={recentResults.win_rate > 60 ? 'up' : 'down'}
            />
            <MetricCard
              title="Total Trades"
              value={recentResults.total_trades}
              icon={<Zap />}
            />
            <MetricCard
              title="Meilleur Trade"
              value={formatPercent(recentResults.best_trade)}
              icon={<TrendingUp />}
              trend="up"
            />
            <MetricCard
              title="Moon Shots"
              value={recentResults.moon_shots}
              icon={<Zap />}
              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
            />
          </div>
        </motion.div>
      )}

      {/* Quick Actions & Active Backtests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuickActions />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ActiveBacktests />
        </motion.div>
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-primary-400" />
            Évolution des Performances
          </h3>
          <PerformanceChart />
        </div>
      </motion.div>

      {/* Market Overview */}
      {marketData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              📈 Aperçu du Marché Crypto
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(marketData.market_data).map(([coin, data]) => (
                <div key={coin} className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-gray-400 uppercase">{coin}</div>
                  <div className="text-lg font-bold text-white">
                    {formatCurrency(data.current_price)}
                  </div>
                  <div className={`text-sm ${
                    data.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercent(data.price_change_24h)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}