// components/Config/ConfigPresets.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Trash2, Copy, Star, Clock, TrendingUp } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

export const ConfigPresets = ({ 
  savedConfigs, 
  onLoadConfig, 
  onDeleteConfig, 
  currentConfig 
}) => {
  const [selectedPreset, setSelectedPreset] = useState(null);

  const presetStrategies = [
    {
      name: 'Conservative',
      description: 'Stratégie prudente avec stop loss serré',
      config: {
        ...currentConfig,
        position_size: 1.5,
        stop_loss: -15,
        tp1: 25,
        tp2: 50,
        tp3: 100,
        tp4: 250,
        tp5: 500
      },
      risk: 'Faible',
      color: 'green'
    },
    {
      name: 'Balanced',
      description: 'Équilibre entre risque et rendement',
      config: {
        ...currentConfig,
        position_size: 2.0,
        stop_loss: -20,
        tp1: 35,
        tp2: 80,
        tp3: 200,
        tp4: 500,
        tp5: 1200
      },
      risk: 'Modéré',
      color: 'blue'
    },
    {
      name: 'Aggressive',
      description: 'Maximise les gains avec plus de risque',
      config: {
        ...currentConfig,
        position_size: 3.0,
        stop_loss: -25,
        tp1: 50,
        tp2: 120,
        tp3: 300,
        tp4: 800,
        tp5: 2000
      },
      risk: 'Élevé',
      color: 'red'
    },
    {
      name: 'Moon Hunter',
      description: 'Optimisé pour capturer les moon shots',
      config: {
        ...currentConfig,
        position_size: 2.5,
        stop_loss: -30,
        max_holding_days: 12,
        tp1: 100,
        tp2: 300,
        tp3: 800,
        tp4: 2000,
        tp5: 5000
      },
      risk: 'Très Élevé',
      color: 'yellow'
    }
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Faible': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'Modéré': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Élevé': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Très Élevé': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Strategies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary-400" />
            Stratégies Prédéfinies
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presetStrategies.map((preset, index) => (
              <motion.div
                key={preset.name}
                whileHover={{ scale: 1.02 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-500/50 transition-all"
                onClick={() => onLoadConfig({ name: preset.name, config: preset.config })}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-white">{preset.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getRiskColor(preset.risk)}`}>
                    {preset.risk}
                  </span>
                </div>
                
                <p className="text-gray-400 text-sm mb-3">{preset.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Position:</span>
                    <span className="text-white">{preset.config.position_size}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stop Loss:</span>
                    <span className="text-red-400">{preset.config.stop_loss}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TP1:</span>
                    <span className="text-green-400">{preset.config.tp1}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TP5:</span>
                    <span className="text-green-400">{preset.config.tp5}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Saved Configurations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-400" />
            Configurations Sauvegardées ({savedConfigs.length})
          </h3>
          
          {savedConfigs.length > 0 ? (
            <div className="space-y-3">
              {savedConfigs.map((saved, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-primary-500/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-white">{saved.name}</h4>
                        <span className="text-xs text-gray-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatRelativeTime(saved.created)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Capital:</span>
                          <div className="text-white font-medium">
                            {formatCurrency(saved.config.initial_capital)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Position:</span>
                          <div className="text-primary-400 font-medium">
                            {saved.config.position_size}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Période:</span>
                          <div className="text-blue-400 font-medium">
                            {saved.config.start_month}/{saved.config.start_year} - {saved.config.end_month}/{saved.config.end_year}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Stop Loss:</span>
                          <div className="text-red-400 font-medium">
                            {saved.config.stop_loss}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => onLoadConfig(saved)}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="Charger cette configuration"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteConfig(saved.name)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Supprimer cette configuration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Aucune configuration sauvegardée</p>
              <p className="text-gray-500 text-sm">
                Créez et sauvegardez vos configurations personnalisées pour les réutiliser facilement.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Compare */}
      {selectedPreset && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-blue-400 mb-3">🔍 Comparaison Rapide</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="text-white font-medium mb-2">Configuration Actuelle</h5>
                <div className="space-y-1 text-gray-400">
                  <div>Position: {currentConfig.position_size}%</div>
                  <div>Stop Loss: {currentConfig.stop_loss}%</div>
                  <div>TP Range: {currentConfig.tp1}% - {currentConfig.tp5}%</div>
                </div>
              </div>
              <div>
                <h5 className="text-white font-medium mb-2">{selectedPreset.name}</h5>
                <div className="space-y-1 text-gray-400">
                  <div>Position: {selectedPreset.config.position_size}%</div>
                  <div>Stop Loss: {selectedPreset.config.stop_loss}%</div>
                  <div>TP Range: {selectedPreset.config.tp1}% - {selectedPreset.config.tp5}%</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};