import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Target, TrendingUp, AlertTriangle } from 'lucide-react';

const FormSection = ({ title, icon: Icon, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}
  >
    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary-400" />
      {title}
    </h3>
    {children}
  </motion.div>
);

const FormField = ({ label, value, onChange, type = "number", min, max, step, unit, tooltip, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">
      {label}
      {tooltip && (
        <span className="ml-2 text-xs text-gray-400 cursor-help" title={tooltip}>
          ℹ️
        </span>
      )}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || e.target.value)}
        min={min}
        max={max}
        step={step}
        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
          error 
            ? 'border-red-500 focus:border-red-400' 
            : 'border-white/20 focus:border-primary-500'
        }`}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
          {unit}
        </span>
      )}
    </div>
    {error && (
      <p className="text-red-400 text-xs flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

export const ConfigForm = ({ config, onConfigChange }) => {
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    // Validation en temps réel
    const newErrors = { ...errors };
    
    // Validation spécifique par champ
    switch (field) {
      case 'initial_capital':
        if (value < 1000) newErrors[field] = 'Capital minimum: 1000$';
        else if (value > 1000000) newErrors[field] = 'Capital maximum: 1M$';
        else delete newErrors[field];
        break;
      
      case 'position_size':
        if (value < 0.1) newErrors[field] = 'Taille minimum: 0.1%';
        else if (value > 10) newErrors[field] = 'Taille maximum: 10%';
        else delete newErrors[field];
        break;
      
      case 'stop_loss':
        if (value > -1) newErrors[field] = 'Stop loss doit être négatif';
        else if (value < -50) newErrors[field] = 'Stop loss maximum: -50%';
        else delete newErrors[field];
        break;
        
      default:
        delete newErrors[field];
    }
    
    setErrors(newErrors);
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Paramètres Financiers */}
      <FormSection title="Paramètres Financiers" icon={DollarSign}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Capital Initial"
            value={config.initial_capital}
            onChange={(value) => updateField('initial_capital', value)}
            min={1000}
            max={1000000}
            step={1000}
            unit="$"
            tooltip="Capital de départ pour le backtest"
            error={errors.initial_capital}
          />
          <FormField
            label="Taille de Position"
            value={config.position_size}
            onChange={(value) => updateField('position_size', value)}
            min={0.1}
            max={10}
            step={0.1}
            unit="%"
            tooltip="Pourcentage du capital risqué par trade"
            error={errors.position_size}
          />
        </div>
      </FormSection>

      {/* Période de Test */}
      <FormSection title="Période de Backtest" icon={Calendar}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            label="Année Début"
            value={config.start_year}
            onChange={(value) => updateField('start_year', value)}
            min={2020}
            max={new Date().getFullYear()}
            tooltip="Année de début du backtest"
          />
          <FormField
            label="Mois Début"
            value={config.start_month}
            onChange={(value) => updateField('start_month', value)}
            min={1}
            max={12}
            tooltip="Mois de début (1-12)"
          />
          <FormField
            label="Année Fin"
            value={config.end_year}
            onChange={(value) => updateField('end_year', value)}
            min={2020}
            max={new Date().getFullYear()}
            tooltip="Année de fin du backtest"
          />
          <FormField
            label="Mois Fin"
            value={config.end_month}
            onChange={(value) => updateField('end_month', value)}
            min={1}
            max={12}
            tooltip="Mois de fin (1-12)"
          />
        </div>
        
        {/* Validation de période */}
        {config.start_year > config.end_year || 
         (config.start_year === config.end_year && config.start_month >= config.end_month) && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              La date de fin doit être postérieure à la date de début
            </p>
          </div>
        )}
      </FormSection>

      {/* Stratégie de Sortie */}
      <FormSection title="Gestion des Risques" icon={Target}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            label="Stop Loss"
            value={config.stop_loss}
            onChange={(value) => updateField('stop_loss', value)}
            min={-50}
            max={-1}
            step={1}
            unit="%"
            tooltip="Perte maximale acceptée par trade"
            error={errors.stop_loss}
          />
          <FormField
            label="Jours Maximum"
            value={config.max_holding_days}
            onChange={(value) => updateField('max_holding_days', value)}
            min={1}
            max={30}
            step={1}
            unit="jours"
            tooltip="Durée maximale de détention d'une position"
          />
          <FormField
            label="Seuil de Détection"
            value={config.detection_threshold}
            onChange={(value) => updateField('detection_threshold', value)}
            min={10}
            max={100}
            step={5}
            unit="%"
            tooltip="Seuil de performance pour déclencher un signal"
          />
        </div>
      </FormSection>

      {/* Take Profits */}
      <FormSection title="Niveaux de Take Profit" icon={TrendingUp}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['tp1', 'tp2', 'tp3', 'tp4', 'tp5'].map((tp, index) => (
            <FormField
              key={tp}
              label={`TP${index + 1}`}
              value={config[tp]}
              onChange={(value) => updateField(tp, value)}
              min={index === 0 ? 10 : config[`tp${index}`] || 10}
              max={2000}
              step={5}
              unit="%"
              tooltip={`Take Profit niveau ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Validation Take Profits */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-400 font-medium mb-2">💡 Conseils Take Profits</h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• TP1 (35%) : Sortie conservatrice, gain rapide</li>
            <li>• TP2 (80%) : Objectif intermédiaire rentable</li>
            <li>• TP3 (200%) : Pump significatif</li>
            <li>• TP4 (500%) : Moon shot modéré</li>
            <li>• TP5 (1200%) : Moon shot exceptionnel</li>
          </ul>
        </div>
      </FormSection>

      {/* Résumé de Configuration */}
      <FormSection title="Résumé de la Configuration" icon={Target} className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-primary-500/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">
              {((config.end_year - config.start_year) * 12 + (config.end_month - config.start_month) + 1)}
            </div>
            <div className="text-gray-400">Mois de test</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">
              ${config.initial_capital.toLocaleString()}
            </div>
            <div className="text-gray-400">Capital initial</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">
              {config.position_size}%
            </div>
            <div className="text-gray-400">Position size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">
              {config.stop_loss}%
            </div>
            <div className="text-gray-400">Stop Loss</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-gray-300 text-sm">
            🎯 Configuration prête pour backtesting sur {((config.end_year - config.start_year) * 12 + (config.end_month - config.start_month) + 1)} mois
            avec un capital de ${config.initial_capital.toLocaleString()} et une position size de {config.position_size}%.
          </p>
        </div>
      </FormSection>
    </div>
  );
};