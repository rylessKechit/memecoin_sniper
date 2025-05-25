// components/Analysis/ComparisonAnalysis.js
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const ComparisonAnalysis = ({ data }) => {
  // Données simulées pour différentes stratégies
  const strategies = [
    {
      name: 'Conservative',
      return: 45.2,
      winRate: 72.1,
      maxDrawdown: -12.3,
      sharpe: 1.8,
      trades: 89,
      color: '#22c55e'
    },
    {
      name: 'Balanced (Actuelle)',
      return: 67.8,
      winRate: 68.2,
      maxDrawdown: -18.5,
      sharpe: 2.1,
      trades: 142,
      color: '#00ff88'
    },
    {
      name: 'Aggressive',
      return: 89.4,
      winRate: 61.7,
      maxDrawdown: -28.1,
      sharpe: 1.6,
      trades: 198,
      color: '#f59e0b'
    },
    {
      name: 'Moon Hunter',
      return: 124.6,
      winRate: 55.3,
      maxDrawdown: -35.2,
      sharpe: 1.4,
      trades: 267,
      color: '#ef4444'
    }
  ];

  const radarData = [
    { metric: 'Rendement', Conservative: 60, Balanced: 85, Aggressive: 90, MoonHunter: 100 },
    { metric: 'Win Rate', Conservative: 100, Balanced: 95, Aggressive: 85, MoonHunter: 75 },
    { metric: 'Stabilité', Conservative: 100, Balanced: 80, Aggressive: 60, MoonHunter: 40 },
    { metric: 'Sharpe', Conservative: 80, Balanced: 95, Aggressive: 70, MoonHunter: 60 },
    { metric: 'Consistance', Conservative: 90, Balanced: 85, Aggressive: 70, MoonHunter: 55 }
  ];

  const performanceData = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    Conservative: 45.2 * (i + 1) / 12 + (Math.random() - 0.5) * 10,
    Balanced: 67.8 * (i + 1) / 12 + (Math.random() - 0.5) * 15,
    Aggressive: 89.4 * (i + 1) / 12 + (Math.random() - 0.5) * 25,
    MoonHunter: 124.6 * (i + 1) / 12 + (Math.random() - 0.5) * 35
  }));

  return (
    <div className="space-y-6">
      {/* Strategy Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Comparaison des Stratégies
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400">Stratégie</th>
                  <th className="text-right py-3 px-4 text-gray-400">Rendement</th>
                  <th className="text-right py-3 px-4 text-gray-400">Win Rate</th>
                  <th className="text-right py-3 px-4 text-gray-400">Max DD</th>
                  <th className="text-right py-3 px-4 text-gray-400">Sharpe</th>
                  <th className="text-right py-3 px-4 text-gray-400">Trades</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy, index) => (
                  <tr key={strategy.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: strategy.color }}></div>
                        <span className={`font-medium ${strategy.name.includes('Actuelle') ? 'text-primary-400' : 'text-white'}`}>
                          {strategy.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-400">+{strategy.return}%</td>
                    <td className="py-3 px-4 text-right text-blue-400">{strategy.winRate}%</td>
                    <td className="py-3 px-4 text-right text-red-400">{strategy.maxDrawdown}%</td>
                    <td className="py-3 px-4 text-right text-purple-400">{strategy.sharpe}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{strategy.trades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Performance Evolution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Évolution Comparative
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
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
                {strategies.map(strategy => (
                  <Line
                    key={strategy.name}
                    type="monotone"
                    dataKey={strategy.name.replace(/[^a-zA-Z]/g, '')}
                    stroke={strategy.color}
                    strokeWidth={strategy.name.includes('Actuelle') ? 3 : 2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Radar Chart Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Profil de Performance</h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                  <Radar name="Conservative" dataKey="Conservative" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                  <Radar name="Balanced" dataKey="Balanced" stroke="#00ff88" fill="#00ff88" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Aggressive" dataKey="Aggressive" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">💡 Recommandations</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-green-400 font-medium mb-2">🏆 Meilleur Rendement</div>
                <div className="text-green-300 text-sm">
                  La stratégie <strong>Moon Hunter</strong> offre le rendement le plus élevé (+124.6%) 
                  mais avec une volatilité importante.
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-blue-400 font-medium mb-2">⚖️ Meilleur Équilibre</div>
                <div className="text-blue-300 text-sm">
                  Votre stratégie <strong>Balanced</strong> actuelle offre un excellent compromis 
                  entre rendement et stabilité.
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="text-yellow-400 font-medium mb-2">🛡️ Plus Sûre</div>
                <div className="text-yellow-300 text-sm">
                  La stratégie <strong>Conservative</strong> minimise les risques avec 
                  un drawdown maximal de seulement -12.3%.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};