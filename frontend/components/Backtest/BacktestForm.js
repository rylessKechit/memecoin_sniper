// components/Backtest/BacktestForm.js
import { motion } from 'framer-motion';
import { Settings, Calendar, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const BacktestForm = ({ config }) => {
  const estimatedDuration = ((config.end_year - config.start_year) * 12 + (config.end_month - config.start_month) + 1) * 2;
  const positionSizeUSD = config.initial_capital * (config.position_size / 100);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" />
            Configuration Actuelle
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-300">💰 Paramètres Financiers</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Capital Initial:</span>
                  <span className="text-white font-medium">{formatCurrency(config.initial_capital)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Position Size:</span>
                  <span className="text-white font-medium">{config.position_size}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Montant par Trade:</span>
                  <span className="text-primary-400 font-medium">{formatCurrency(positionSizeUSD)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-300">📅 Période</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Début:</span>
                  <span className="text-white font-medium">{config.start_month}/{config.start_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fin:</span>
                  <span className="text-white font-medium">{config.end_month}/{config.end_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Durée:</span>
                  <span className="text-primary-400 font-medium">
                    {((config.end_year - config.start_year) * 12 + (config.end_month - config.start_month) + 1)} mois
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-300">🎯 Stratégie</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="text-red-400 font-medium">{config.stop_loss}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Jours:</span>
                  <span className="text-white font-medium">{config.max_holding_days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Take Profits:</span>
                  <span className="text-green-400 font-medium">
                    {config.tp1}% → {config.tp5}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 font-medium mb-2">
              <Calendar className="w-4 h-4" />
              Estimation du Backtest
            </div>
            <p className="text-blue-300 text-sm">
              Durée estimée: <strong>~{estimatedDuration} secondes</strong> 
              • Analyse de {((config.end_year - config.start_year) * 12 + (config.end_month - config.start_month) + 1)} mois de données 
              • Capital risqué par trade: <strong>{formatCurrency(positionSizeUSD)}</strong>
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/30 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-primary-400 mb-3">🚀 Prêt pour le Backtest</h4>
          <p className="text-gray-300 text-sm mb-4">
            Votre configuration est valide et prête pour le test. Cliquez sur "Démarrer Backtest" pour lancer l'analyse 
            avec votre stratégie de trading memecoin sur les données historiques.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>✅ Configuration validée</span>
            <span>✅ Période valide</span>
            <span>✅ Paramètres optimaux</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};