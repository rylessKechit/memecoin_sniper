// components/Analysis/PerformanceAnalysis.js
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChart, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from '@/components/Dashboard/MetricCard';
import { formatPercent, formatCurrency } from '@/lib/utils';

export const PerformanceAnalysis = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Aucune donnée d'analyse disponible</p>
        <p className="text-gray-500 text-sm mt-2">Exécutez un backtest pour voir les analyses de performance</p>
      </div>
    );
  }

  const monthlyData = data.by_month || [];
  const coinData = data.by_coin || [];
  const allTimeData = data.all_time || {};

  const COLORS = ['#00ff88', '#00e676', '#4ade80', '#22c55e', '#16a34a'];

  return (
    <div className="space-y-6">
      {/* Overall Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Performance Globale
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Trades Totaux"
              value={allTimeData.total_trades?.toLocaleString() || '0'}
              icon={<BarChart3 className="w-5 h-5" />}
              subtitle={`${allTimeData.winning_trades || 0} gagnants`}
            />
            <MetricCard
              title="Taux de Réussite"
              value={`${allTimeData.win_rate?.toFixed(1) || 0}%`}
              icon={<Target className="w-5 h-5" />}
              trend={allTimeData.win_rate > 60 ? 'up' : 'down'}
            />
            <MetricCard
              title="Profit Factor"
              value={allTimeData.profit_factor?.toFixed(2) || '0'}
              icon={<TrendingUp className="w-5 h-5" />}
              trend={allTimeData.profit_factor > 2 ? 'up' : 'down'}
            />
            <MetricCard
              title="Ratio Sharpe"
              value={allTimeData.sharpe_ratio?.toFixed(2) || '0'}
              icon={<BarChart3 className="w-5 h-5" />}
              trend={allTimeData.sharpe_ratio > 1 ? 'up' : 'down'}
            />
          </div>
        </div>
      </motion.div>

      {/* Monthly Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Évolution Mensuelle
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value, name) => [
                    name === 'return' ? `${value}%` : value,
                    name === 'return' ? 'Rendement' : name === 'trades' ? 'Trades' : 'Win Rate'
                  ]}
                />
                <Bar dataKey="return" fill="#00ff88" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Performance by Coin */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              Performance par Coin
            </h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={coinData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_trades"
                    label={({ coin, total_trades }) => `${coin}: ${total_trades}`}
                  >
                    {coinData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(0,255,136,0.3)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">🏆 Top Performers</h3>
            
            <div className="space-y-3">
              {coinData
                .sort((a, b) => b.avg_return - a.avg_return)
                .slice(0, 5)
                .map((coin, index) => (
                  <div key={coin.coin} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="font-medium text-white">{coin.coin}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{formatPercent(coin.avg_return)}</div>
                      <div className="text-xs text-gray-400">{coin.win_rate.toFixed(1)}% win rate</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">📊 Statistiques Détaillées</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-gray-300 font-medium mb-3">📈 Trades Gagnants</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nombre:</span>
                  <span className="text-green-400 font-medium">{allTimeData.winning_trades || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Séquence Max:</span>
                  <span className="text-green-400 font-medium">{allTimeData.largest_winning_streak || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Meilleur Mois:</span>
                  <span className="text-green-400 font-medium">{formatPercent(allTimeData.best_month || 0)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-300 font-medium mb-3">📉 Trades Perdants</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nombre:</span>
                  <span className="text-red-400 font-medium">{allTimeData.losing_trades || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Séquence Max:</span>
                  <span className="text-red-400 font-medium">{allTimeData.largest_losing_streak || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pire Mois:</span>
                  <span className="text-red-400 font-medium">{formatPercent(allTimeData.worst_month || 0)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-300 font-medium mb-3">⏱️ Durée Moyenne</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Par Trade:</span>
                  <span className="text-blue-400 font-medium">{allTimeData.avg_trade_duration?.toFixed(1) || 0} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Drawdown:</span>
                  <span className="text-orange-400 font-medium">{formatPercent(allTimeData.max_drawdown || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatilité:</span>
                  <span className="text-purple-400 font-medium">{formatPercent(allTimeData.volatility || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Évolution Cumulative
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="return"
                  stroke="#00ff88"
                  strokeWidth={2}
                  dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#00ff88', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
};