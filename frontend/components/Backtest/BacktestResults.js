// components/Backtest/BacktestResults.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Download, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MetricCard } from '@/components/Dashboard/MetricCard';
import { formatCurrency, formatPercent, exportToJSON, exportToCSV } from '@/lib/utils';

export const BacktestResults = ({ results }) => {
  const [activeChart, setActiveChart] = useState('capital');

  const getChartData = () => {
    switch (activeChart) {
      case 'capital':
        return results.charts_data.capital_evolution.map((value, index) => ({
          period: `M${index + 1}`,
          value: value
        }));
      case 'returns':
        return results.charts_data.monthly_returns.map((value, index) => ({
          period: `M${index + 1}`,
          value: value
        }));
      case 'trades':
        return results.trades.slice(-20).map((trade, index) => ({
          trade: index + 1,
          return: trade.return,
          pnl: trade.pnl
        }));
      default:
        return [];
    }
  };

  const exportResults = (format) => {
    const data = {
      summary: results.summary,
      metrics: results.metrics,
      trades: results.trades,
      monthly_data: results.monthly_data
    };

    if (format === 'json') {
      exportToJSON(data, `backtest_results_${results.id.slice(0, 8)}.json`);
    } else {
      exportToCSV(results.trades, `backtest_trades_${results.id.slice(0, 8)}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              📊 Résultats du Backtest
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => exportResults('json')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => exportResults('csv')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Rendement Total"
              value={formatPercent(results.summary.total_return)}
              icon={<TrendingUp className="w-5 h-5" />}
              trend={results.summary.total_return > 0 ? 'up' : 'down'}
              className="col-span-1"
            />
            <MetricCard
              title="Capital Final"
              value={formatCurrency(results.summary.final_capital)}
              icon={<BarChart3 className="w-5 h-5" />}
              subtitle={`Départ: ${formatCurrency(results.config.initial_capital)}`}
            />
            <MetricCard
              title="Taux de Réussite"
              value={`${results.summary.win_rate.toFixed(1)}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              trend={results.summary.win_rate > 60 ? 'up' : 'down'}
            />
            <MetricCard
              title="Total Trades"
              value={results.summary.total_trades}
              icon={<BarChart3 className="w-5 h-5" />}
              subtitle={`${results.summary.total_trades - (results.summary.total_trades * results.summary.win_rate / 100)} perdants`}
            />
            <MetricCard
              title="Moon Shots"
              value={results.summary.moon_shots}
              icon={<TrendingUp className="w-5 h-5" />}
              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
            />
          </div>
        </div>
      </motion.div>

      {/* Advanced Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">📈 Métriques Avancées</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Max Drawdown"
              value={formatPercent(results.metrics.max_drawdown)}
              trend={results.metrics.max_drawdown < -15 ? 'down' : 'up'}
            />
            <MetricCard
              title="Ratio Sharpe"
              value={results.metrics.sharpe_ratio.toFixed(2)}
              trend={results.metrics.sharpe_ratio > 1 ? 'up' : 'down'}
            />
            <MetricCard
              title="Profit Factor"
              value={results.metrics.profit_factor.toFixed(2)}
              trend={results.metrics.profit_factor > 2 ? 'up' : 'down'}
            />
            <MetricCard
              title="Volatilité"
              value={`${results.metrics.volatility.toFixed(1)}%`}
              trend={results.metrics.volatility < 20 ? 'up' : 'down'}
            />
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">📊 Graphiques d'Analyse</h3>
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {[
                { id: 'capital', label: 'Capital' },
                { id: 'returns', label: 'Rendements' },
                { id: 'trades', label: 'Trades' }
              ].map(chart => (
                <button
                  key={chart.id}
                  onClick={() => setActiveChart(chart.id)}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    activeChart === chart.id
                      ? 'bg-primary-500 text-dark-900'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {chart.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'trades' ? (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="trade" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(0,255,136,0.3)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="return" fill="#00ff88" />
                </BarChart>
              ) : (
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="period" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
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
                    dataKey="value"
                    stroke="#00ff88"
                    strokeWidth={2}
                    dot={{ fill: '#00ff88', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Recent Trades Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">💼 Derniers Trades</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400">Token</th>
                  <th className="text-right py-3 px-4 text-gray-400">Rendement</th>
                  <th className="text-right py-3 px-4 text-gray-400">P&L</th>
                  <th className="text-center py-3 px-4 text-gray-400">Jours</th>
                </tr>
              </thead>
              <tbody>
                {results.trades.slice(-10).reverse().map((trade, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-gray-300">{trade.date}</td>
                    <td className="py-3 px-4 text-white font-medium">{trade.token}</td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      trade.return >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(trade.return)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(trade.pnl)}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">{trade.holding_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};