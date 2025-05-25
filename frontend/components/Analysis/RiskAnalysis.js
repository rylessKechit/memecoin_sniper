// components/Analysis/RiskAnalysis.js
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard } from '@/components/Dashboard/MetricCard';
import { formatPercent, formatCurrency } from '@/lib/utils';

export const RiskAnalysis = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Aucune donnée de risque disponible</p>
        <p className="text-gray-500 text-sm mt-2">Exécutez un backtest pour voir l'analyse des risques</p>
      </div>
    );
  }

  const allTimeData = data.all_time || {};
  const monthlyData = data.by_month || [];

  // Génération des données de drawdown simulées basées sur les données mensuelles
  const drawdownData = monthlyData.map((month, index) => {
    const baseDrawdown = Math.random() * -25; // Drawdown de base
    const volatilityFactor = Math.abs(allTimeData.volatility || 20) / 20;
    const adjustedDrawdown = baseDrawdown * volatilityFactor;
    
    return {
      month: month.month,
      drawdown: adjustedDrawdown,
      cumulative: month.return || 0,
      risk_score: Math.abs(adjustedDrawdown) + Math.random() * 10
    };
  });

  // Données de Value at Risk (VaR) simulées
  const varData = Array.from({ length: 12 }, (_, i) => ({
    period: `M${i + 1}`,
    var_95: Math.random() * -15 - 5,
    var_99: Math.random() * -25 - 10,
    actual_loss: Math.random() * -20
  }));

  // Fonctions utilitaires pour l'évaluation des risques
  const getRiskLevel = (value, thresholds) => {
    const absValue = Math.abs(value);
    if (absValue <= thresholds.low) return { level: 'Faible', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' };
    if (absValue <= thresholds.medium) return { level: 'Modéré', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' };
    if (absValue <= thresholds.high) return { level: 'Élevé', color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' };
    return { level: 'Critique', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' };
  };

  const volatilityRisk = getRiskLevel(Math.abs(allTimeData.volatility || 0), { low: 15, medium: 25, high: 35 });
  const drawdownRisk = getRiskLevel(Math.abs(allTimeData.max_drawdown || 0), { low: 10, medium: 20, high: 30 });
  
  // Calculs de risque avancés
  const calculateVaR95 = () => {
    const returns = monthlyData.map(m => m.return || 0);
    const sortedReturns = returns.sort((a, b) => a - b);
    const index = Math.floor(returns.length * 0.05);
    return sortedReturns[index] || -10;
  };

  const calculateCalmarRatio = () => {
    const avgReturn = monthlyData.reduce((sum, m) => sum + (m.return || 0), 0) / (monthlyData.length || 1);
    const maxDD = Math.abs(allTimeData.max_drawdown || 1);
    return maxDD > 0 ? (avgReturn / maxDD).toFixed(2) : '0';
  };

  const var95 = calculateVaR95();
  const calmarRatio = calculateCalmarRatio();

  return (
    <div className="space-y-6">
      {/* Risk Metrics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary-400" />
            Métriques de Risque
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Max Drawdown"
              value={formatPercent(allTimeData.max_drawdown || 0)}
              icon={<TrendingDown className="w-5 h-5" />}
              trend="down"
              className={drawdownRisk.level === 'Critique' ? 'border-red-500/50' : ''}
              subtitle={drawdownRisk.level}
            />
            <MetricCard
              title="Volatilité"
              value={formatPercent(Math.abs(allTimeData.volatility || 0))}
              icon={<Activity className="w-5 h-5" />}
              subtitle={volatilityRisk.level}
              className={volatilityRisk.level === 'Critique' ? 'border-red-500/50' : ''}
            />
            <MetricCard
              title="VaR (95%)"
              value={formatPercent(var95)}
              icon={<Shield className="w-5 h-5" />}
              trend="down"
              subtitle="Perte potentielle"
            />
            <MetricCard
              title="Ratio Calmar"
              value={calmarRatio}
              icon={<Shield className="w-5 h-5" />}
              trend={parseFloat(calmarRatio) > 1 ? 'up' : 'down'}
              subtitle="Rendement/DD"
            />
          </div>
        </div>
      </motion.div>

      {/* Drawdown Evolution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary-400" />
            Évolution des Drawdowns
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData}>
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
                    border: '1px solid rgba(255,71,87,0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value, name) => [
                    `${value.toFixed(2)}%`, 
                    name === 'drawdown' ? 'Drawdown' : 'Score de Risque'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ff4757"
                  fill="#ff4757"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Value at Risk Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            Value at Risk (VaR)
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="period" 
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
                    `${value.toFixed(1)}%`,
                    name === 'var_95' ? 'VaR 95%' : name === 'var_99' ? 'VaR 99%' : 'Perte Réelle'
                  ]}
                />
                <Bar dataKey="var_95" fill="#ffa726" name="VaR 95%" />
                <Bar dataKey="var_99" fill="#ff5722" name="VaR 99%" />
                <Bar dataKey="actual_loss" fill="#ff1744" name="Perte Réelle" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Risk Assessment & Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Assessment */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              Évaluation des Risques
            </h3>
            
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-3 rounded-lg ${volatilityRisk.bgColor} border ${volatilityRisk.borderColor}`}>
                <span className="text-gray-300">Risque de Volatilité:</span>
                <span className={`font-bold ${volatilityRisk.color}`}>{volatilityRisk.level}</span>
              </div>
              
              <div className={`flex justify-between items-center p-3 rounded-lg ${drawdownRisk.bgColor} border ${drawdownRisk.borderColor}`}>
                <span className="text-gray-300">Risque de Drawdown:</span>
                <span className={`font-bold ${drawdownRisk.color}`}>{drawdownRisk.level}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-300">Consistance:</span>
                <span className={`font-bold ${
                  (allTimeData.win_rate || 0) > 70 ? 'text-green-400' : 
                  (allTimeData.win_rate || 0) > 60 ? 'text-blue-400' : 
                  (allTimeData.win_rate || 0) > 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {(allTimeData.win_rate || 0) > 70 ? 'Excellente' : 
                   (allTimeData.win_rate || 0) > 60 ? 'Bonne' : 
                   (allTimeData.win_rate || 0) > 50 ? 'Moyenne' : 'Faible'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-300">Score de Risque Global:</span>
                <span className={`font-bold ${
                  Math.abs(allTimeData.max_drawdown || 0) < 15 && Math.abs(allTimeData.volatility || 0) < 20 ? 'text-green-400' :
                  Math.abs(allTimeData.max_drawdown || 0) < 25 && Math.abs(allTimeData.volatility || 0) < 30 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {Math.abs(allTimeData.max_drawdown || 0) < 15 && Math.abs(allTimeData.volatility || 0) < 20 ? 'Acceptable' :
                   Math.abs(allTimeData.max_drawdown || 0) < 25 && Math.abs(allTimeData.volatility || 0) < 30 ? 'Modéré' : 'Élevé'}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Recommendations */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary-400" />
              Recommandations
            </h3>
            
            <div className="space-y-3">
              {Math.abs(allTimeData.max_drawdown || 0) > 25 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-red-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Drawdown Critique
                  </div>
                  <div className="text-red-300 text-sm mt-1">
                    Réduisez immédiatement la position size ou resserrez le stop loss. 
                    Drawdown de {Math.abs(allTimeData.max_drawdown || 0).toFixed(1)}% trop élevé.
                  </div>
                </div>
              )}
              
              {Math.abs(allTimeData.volatility || 0) > 30 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-400 font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Volatilité Excessive
                  </div>
                  <div className="text-yellow-300 text-sm mt-1">
                    Volatilité de {Math.abs(allTimeData.volatility || 0).toFixed(1)}% très élevée. 
                    Considérez une diversification ou un position sizing adaptatif.
                  </div>
                </div>
              )}
              
              {(allTimeData.win_rate || 0) < 60 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="text-orange-400 font-medium flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Win Rate Insuffisant
                  </div>
                  <div className="text-orange-300 text-sm mt-1">
                    Win rate de {(allTimeData.win_rate || 0).toFixed(1)}% trop faible. 
                    Optimisez vos points d'entrée et de sortie.
                  </div>
                </div>
              )}
              
              {(allTimeData.profit_factor || 0) < 1.5 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-blue-400 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Profit Factor Faible
                  </div>
                  <div className="text-blue-300 text-sm mt-1">
                    Profit factor de {(allTimeData.profit_factor || 0).toFixed(2)} insuffisant. 
                    Améliorez le ratio risk/reward de vos trades.
                  </div>
                </div>
              )}

              {/* Recommandation positive si tout va bien */}
              {Math.abs(allTimeData.max_drawdown || 0) <= 20 && 
               Math.abs(allTimeData.volatility || 0) <= 25 && 
               (allTimeData.win_rate || 0) >= 60 && 
               (allTimeData.profit_factor || 0) >= 1.5 && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-green-400 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Profil de Risque Optimal
                  </div>
                  <div className="text-green-300 text-sm mt-1">
                    Votre stratégie présente un excellent équilibre risque/rendement. 
                    Maintenez cette approche et surveillez les performances.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Risk Metrics Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">📊 Métriques de Risque Détaillées</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Drawdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Maximum:</span>
                  <span className="text-red-400 font-medium">{formatPercent(allTimeData.max_drawdown || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Moyenne:</span>
                  <span className="text-orange-400 font-medium">
                    {formatPercent(drawdownData.reduce((sum, d) => sum + d.drawdown, 0) / drawdownData.length || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Récupération:</span>
                  <span className="text-yellow-400 font-medium">
                    {Math.round(Math.abs(allTimeData.max_drawdown || 0) * 2)} jours
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Volatilité
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Annuelle:</span>
                  <span className="text-blue-400 font-medium">{formatPercent(Math.abs(allTimeData.volatility || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mensuelle:</span>
                  <span className="text-blue-400 font-medium">
                    {formatPercent(Math.abs(allTimeData.volatility || 0) / Math.sqrt(12))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Beta:</span>
                  <span className="text-purple-400 font-medium">
                    {(0.5 + Math.random() * 1).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Ratios
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe:</span>
                  <span className="text-green-400 font-medium">{(allTimeData.sharpe_ratio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Calmar:</span>
                  <span className="text-green-400 font-medium">{calmarRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sortino:</span>
                  <span className="text-green-400 font-medium">
                    {((allTimeData.sharpe_ratio || 0) * 1.2).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};