'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, FolderOpen, Trash2, Copy, Download, Upload } from 'lucide-react';
import { ConfigForm } from '@/components/Config/ConfigForm';
import { ConfigPresets } from '@/components/Config/ConfigPresets';
import { ConfigValidation } from '@/components/Config/ConfigValidation';
import { useApi } from '@/lib/hooks/useApi';
import { useConfig } from '@/lib/hooks/useConfig';
import toast from 'react-hot-toast';

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState('parameters');
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [configName, setConfigName] = useState('');
  const [importedConfig, setImportedConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const { api } = useApi();
  const { config, updateConfig, resetConfig, validateConfig } = useConfig();

  useEffect(() => {
    loadSavedConfigs();
  }, []);

  const loadSavedConfigs = async () => {
    try {
      const configs = await api.loadConfigs();
      setSavedConfigs(configs);
    } catch (error) {
      console.error('Erreur chargement configurations:', error);
      toast.error('Impossible de charger les configurations');
    }
  };

  const saveConfiguration = async () => {
    if (!configName.trim()) {
      toast.error('Veuillez entrer un nom pour la configuration');
      return;
    }

    const validation = validateConfig(config);
    if (!validation.valid) {
      toast.error(`Configuration invalide: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await api.saveConfig(configName, config);
      toast.success('Configuration sauvegardée avec succès!');
      setConfigName('');
      loadSavedConfigs();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async (savedConfig) => {
    try {
      updateConfig(savedConfig.config);
      toast.success(`Configuration "${savedConfig.name}" chargée`);
    } catch (error) {
      console.error('Erreur chargement config:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const deleteConfiguration = async (configName) => {
    if (!confirm(`Supprimer la configuration "${configName}" ?`)) return;

    try {
      await api.deleteConfig(configName);
      toast.success('Configuration supprimée');
      loadSavedConfigs();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportConfiguration = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `config_${configName || 'export'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration exportée');
  };

  const importConfiguration = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setImportedConfig(importedData);
        toast.success('Fichier chargé. Cliquez sur "Appliquer" pour utiliser cette configuration.');
      } catch (error) {
        toast.error('Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  const applyImportedConfig = () => {
    if (!importedConfig) return;
    
    const validation = validateConfig(importedConfig);
    if (!validation.valid) {
      toast.error(`Configuration invalide: ${validation.errors.join(', ')}`);
      return;
    }

    updateConfig(importedConfig);
    setImportedConfig(null);
    toast.success('Configuration importée avec succès');
  };

  const tabs = [
    { id: 'parameters', label: 'Paramètres', icon: Settings },
    { id: 'presets', label: 'Presets', icon: FolderOpen },
    { id: 'import-export', label: 'Import/Export', icon: Download },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
          ⚙️ Configuration
        </h1>
        <p className="text-gray-400 text-lg">
          Configurez et gérez vos stratégies de trading
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-dark-900 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'parameters' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Configuration Validation */}
            <ConfigValidation config={config} />
            
            {/* Configuration Form */}
            <ConfigForm config={config} onConfigChange={updateConfig} />
            
            {/* Save Configuration */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Save className="w-5 h-5 text-primary-400" />
                Sauvegarder la Configuration
              </h3>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Nom de la configuration (ex: Strategy-V1)"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                />
                <button
                  onClick={saveConfiguration}
                  disabled={loading || !configName.trim()}
                  className="px-6 py-2 bg-primary-500 text-dark-900 rounded-lg font-medium hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'presets' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ConfigPresets
              savedConfigs={savedConfigs}
              onLoadConfig={loadConfiguration}
              onDeleteConfig={deleteConfiguration}
              currentConfig={config}
            />
          </motion.div>
        )}

        {activeTab === 'import-export' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Export */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary-400" />
                Exporter la Configuration
              </h3>
              <p className="text-gray-400 mb-4">
                Exportez votre configuration actuelle en fichier JSON pour la partager ou la sauvegarder.
              </p>
              <button
                onClick={exportConfiguration}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter au format JSON
              </button>
            </div>

            {/* Import */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-400" />
                Importer une Configuration
              </h3>
              <p className="text-gray-400 mb-4">
                Importez un fichier de configuration JSON précédemment exporté.
              </p>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfiguration}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500 file:text-dark-900 hover:file:bg-primary-400"
                />
                
                {importedConfig && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 mb-2">
                      ⚠️ Configuration prête à être importée
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={applyImportedConfig}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-400 text-sm"
                      >
                        Appliquer
                      </button>
                      <button
                        onClick={() => setImportedConfig(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-400 text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Copy className="w-5 h-5 text-primary-400" />
                Actions Rapides
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                    toast.success('Configuration copiée dans le presse-papiers');
                  }}
                  className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier en JSON
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration ?')) {
                      resetConfig();
                      toast.success('Configuration réinitialisée');
                    }
                  }}
                  className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Réinitialiser
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}