// components/Analysis/OptimizationAnalysis.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, Target, TrendingUp, Play, Square } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPercent, formatCurrency } from '@/lib/utils';

export const OptimizationAnalysis = ({ data }) => {
  const [selectedParams, setSelectedParams] = useState(['position_size', 'stop_loss']);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  const parameters = [
    { id: 'position_size', name: 'Position Size', min: 0.5, max: 5, step: 0.1, unit: '%' },
    { id: 'stop_loss', name: 'Stop Loss', min: -50, max: -5, step: 1, unit: '%' },
    { id: 'tp1', name: 'Take Profit 1', min: 10, max: 100, step: 5, unit: '%' },
    { id: 'tp2', name: 'Take Profit 2', min: 50, max: 200, step: 10, unit: '%' },
    { id: 'max_holding_days', name: 'Max Holding Days', min: 3, max: 20, step: 1, unit: 'jours' }
  ];

  // Données simulées d'optimisation 3D
  const optimizationData = Array.from({ length: 100 }, (_, i) => ({
    positionSize: Math.random() * 4 + 0.5,
    return: Math.random() * 200 - 50,
    sharpe: Math.random() * 3,
    drawdown: Math.random() * -40,
    risk: Math.random() * 100
  }));

  const startOptimization = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    // Simulation d'optimisation avec progress
    const totalSteps = 100;
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setOptimizationProgress((i / totalSteps) * 100);
    }
    
    // Résultats simulés
    setOptimizationResults({
      optimal: {
        position_size: 2.3,
        stop_loss: -18,
        tp1: 42,
        tp2: 95,
        tp3: 220,
        max_holding_days: 6,
        expected_return: 89.4,
        expected_sharpe: 2.7,
        expected_drawdown: -15.2,
        expected_win_rate: 71.8
      },
      tested_combinations: Math.pow(10, selectedParams.length),
      improvement: 31.7,
      confidence: 87.3
    });
    
    setIsOptimizing(false);
  };

  const stopOptimization = () => {
    setIsOptimizing(false);
    setOptimizationProgress(0);
  };

  const resetOptimization = () => {
    setOptimizationResults(null);
    setOptimizationProgress(0);
  };

  const toggleParameter = (paramId) => {
    if (selectedParams.includes(paramId)) {
      setSelectedParams(selectedParams.filter(p => p !== paramId));
    } else {
      setSelectedParams([...selectedParams, paramId]);
    }
  };

  const estimatedCombinations = selectedParams.length > 0 
    ? Math.pow(10, selectedParams.length)
    : 0;

  const estimatedDuration = Math.round(estimatedCombinations / 100); // seconds

  return (
    <div className="space-y-6">
      {/* Parameter Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" />
            Paramètres à Optimiser
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {parameters.map(param => (
              <label 
                key={param.id} 
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedParams.includes(param.id)}
                  onChange={() => toggleParameter(param.id)}
                  className="w-4 h-4 text-primary-500 bg-transparent border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="text-white font-medium">{param.name}</div>
                  <div className="text-xs text-gray-400">
                    {param.min} - {param.max} {param.unit}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Optimization Info */}
          {selectedParams.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Combinaisons:</span>
                  <div className="text-blue-400 font-bold">{estimatedCombinations.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-400">Durée estimée:</span>
                  <div className="text-blue-400 font-bold">{estimatedDuration}s</div>
                </div>
                <div>
                  <span className="text-gray-400">Paramètres:</span>
                  <div className="text-blue-400 font-bold">{selectedParams.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {!isOptimizing ? (
              <>
                <button
                  onClick={startOptimization}
                  disabled={selectedParams.length < 2}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 rounded-lg font-medium hover:from-primary-400 hover:to-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Lancer l'Optimisation
                </button>
                
                {optimizationResults && (
                  <button
                    onClick={resetOptimization}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500 flex items-center gap-2"
                  >
                    Nouveau Test
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={stopOptimization}
                className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-400 flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Arrêter
              </button>
            )}

            {selectedParams.length < 2 && (
              <div className="text-sm text-gray-400">
                Sélectionnez au moins 2 paramètres pour commencer
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Optimization Progress */}
      {isOptimizing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-400 animate-pulse" />
              <h3 className="text-xl font-bold text-blue-400">Optimisation en Cours</h3>
            </div>
            
            <div className="space-y-3">
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 relative"
                  style={{ width: `${optimizationProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-blue-300">
                  🔍 Test des combinaisons de paramètres...
                </span>
                <span className="text-blue-400 font-bold">
                  {optimizationProgress.toFixed(1)}%
                </span>
              </div>
              
              <div className="text-blue-300 text-xs">
                {Math.round((optimizationProgress / 100) * estimatedCombinations).toLocaleString()} / {estimatedCombinations.toLocaleString()} combinaisons testées
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Optimization Results */}
      {optimizationResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Résultats d'Optimisation
              </h3>
              <div className="text-sm text-green-300">
                Confiance: {optimizationResults.confidence}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-white font-medium mb-3">🎯 Paramètres Optimaux</h4>
                <div className="space-y-2 text-sm">
                  {selectedParams.map(paramId => {
                    const param = parameters.find(p => p.id === paramId);
                    const value = optimizationResults.optimal[paramId];
                    return (
                      <div key={paramId} className="flex justify-between p-2 bg-white/5 rounded">
                        <span className="text-gray-400">{param?.name}:</span>
                        <span className="text-green-400 font-bold">
                          {value}{param?.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">📈 Performance Attendue</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-white/5 rounded">
                    <span className="text-gray-400">Rendement:</span>
                    <span className="text-green-400 font-bold">+{optimizationResults.optimal.expected_return}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/5 rounded">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-green-400 font-bold">{optimizationResults.optimal.expected_win_rate}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/5 rounded">
                    <span className="text-gray-400">Sharpe Ratio:</span>
                    <span className="text-green-400 font-bold">{optimizationResults.optimal.expected_sharpe}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/5 rounded">
                    <span className="text-gray-400">Max Drawdown:</span>
                    <span className="text-green-400 font-bold">{optimizationResults.optimal.expected_drawdown}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-400 font-medium text-lg">
                    🚀 Amélioration de +{optimizationResults.improvement}%
                  </div>
                  <div className="text-green-300 text-sm">
                    {optimizationResults.tested_combinations.toLocaleString()} combinaisons testées
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Simulation d'application des paramètres optimaux
                    alert('Paramètres optimaux appliqués à la configuration !');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-400"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Optimization Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">📊 Surface d'Optimisation</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-gray-300 font-medium mb-3">Rendement vs Position Size</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={optimizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="positionSize" 
                      name="Position Size"
                      stroke="rgba(255,255,255,0.6)"
                      fontSize={12}
                    />
                    <YAxis 
                      dataKey="return" 
                      name="Rendement"
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
                        name === 'return' ? `${value.toFixed(1)}%` : value.toFixed(2),
                        name === 'return' ? 'Rendement' : 'Position Size'
                      ]}
                    />
                    <Scatter 
                      dataKey="return" 
                      fill="#00ff88" 
                      fillOpacity={0.6}
                      r={4}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-gray-300 font-medium mb-3">Sharpe vs Risque</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={optimizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="risk" 
                      name="Risque"
                      stroke="rgba(255,255,255,0.6)"
                      fontSize={12}
                    />
                    <YAxis 
                      dataKey="sharpe" 
                      name="Sharpe"
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
                        value.toFixed(2),
                        name === 'sharpe' ? 'Ratio Sharpe' : 'Niveau de Risque'
                      ]}
                    />
                    <Scatter 
                      dataKey="sharpe" 
                      fill="#4ade80" 
                      fillOpacity={0.6}
                      r={4}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Optimization Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">💡 Conseils d'Optimisation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="text-white font-medium">🎯 Stratégies</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Commencez par optimiser 2-3 paramètres clés</li>
                <li>• Position Size et Stop Loss sont prioritaires</li>
                <li>• Testez sur différentes périodes</li>
                <li>• Validez avec du walk-forward testing</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-white font-medium">⚠️ Précautions</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Évitez le sur-optimisation (overfitting)</li>
                <li>• Gardez des paramètres réalistes</li>
                <li>• Considérez la robustesse vs performance</li>
                <li>• Testez en out-of-sample</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};