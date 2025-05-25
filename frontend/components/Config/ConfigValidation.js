// components/Config/ConfigValidation.js
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { validateConfig } from '@/lib/utils';

export const ConfigValidation = ({ config }) => {
  const validation = validateConfig(config);
  const warnings = [];
  const tips = [];

  // Générer des avertissements
  if (config.position_size > 5) {
    warnings.push('Position size élevée (>5%) - Risque accru');
  }
  if (config.stop_loss < -30) {
    warnings.push('Stop loss très large - Pertes potentielles importantes');
  }
  if (config.max_holding_days > 15) {
    warnings.push('Période de détention longue - Exposition prolongée au risque');
  }

  // Générer des conseils
  if (config.tp1 < 30) {
    tips.push('TP1 bas - Considérez 30-50% pour des sorties plus fréquentes');
  }
  if (config.tp5 > 2000) {
    tips.push('TP5 très élevé - Peu de chances d\'atteindre ce niveau');
  }
  if (config.position_size < 1) {
    tips.push('Position size faible - Profits limités malgré de bons trades');
  }

  const getValidationIcon = () => {
    if (validation.valid && warnings.length === 0) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (validation.valid && warnings.length > 0) {
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getValidationColor = () => {
    if (validation.valid && warnings.length === 0) return 'border-green-500/30 bg-green-500/10';
    if (validation.valid && warnings.length > 0) return 'border-yellow-500/30 bg-yellow-500/10';
    return 'border-red-500/30 bg-red-500/10';
  };

  const getValidationTextColor = () => {
    if (validation.valid && warnings.length === 0) return 'text-green-400';
    if (validation.valid && warnings.length > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`border rounded-2xl p-6 ${getValidationColor()}`}>
        <div className="flex items-center gap-2 mb-4">
          {getValidationIcon()}
          <h3 className={`text-lg font-bold ${getValidationTextColor()}`}>
            Validation de Configuration
          </h3>
        </div>

        {/* Erreurs */}
        {!validation.valid && (
          <div className="mb-4">
            <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Erreurs à corriger:
            </h4>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-red-300 text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avertissements */}
        {warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Avertissements:
            </h4>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-yellow-300 text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-yellow-400 rounded-full"></span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conseils */}
        {tips.length > 0 && (
          <div className="mb-4">
            <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Conseils d'optimisation:
            </h4>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-blue-300 text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status final */}
        {validation.valid && warnings.length === 0 && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Configuration optimale - Prête pour le backtest</span>
          </div>
        )}

        {/* Métriques de risque */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <h5 className="text-gray-400 font-medium mb-2">Analyse de Risque:</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Risque par Trade:</span>
              <div className={`font-bold ${
                config.position_size <= 2 ? 'text-green-400' : 
                config.position_size <= 5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {config.position_size <= 2 ? 'Faible' : 
                 config.position_size <= 5 ? 'Modéré' : 'Élevé'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Perte Max:</span>
              <div className="text-red-400 font-bold">
                {((config.initial_capital * config.position_size / 100) * Math.abs(config.stop_loss) / 100).toFixed(0)}$
              </div>
            </div>
            <div>
              <span className="text-gray-500">Ratio Risk/Reward:</span>
              <div className="text-blue-400 font-bold">
                1:{(config.tp1 / Math.abs(config.stop_loss)).toFixed(1)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Durée Test:</span>
              <div className="text-gray-300 font-bold">
                {((config.end_year - config.start_year) * 12 + (config.end_month - config.start_month) + 1)} mois
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};