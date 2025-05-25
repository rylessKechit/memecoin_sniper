'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { PerformanceAnalysis } from '@/components/Analysis/PerformanceAnalysis';
import { RiskAnalysis } from '@/components/Analysis/RiskAnalysis';
import { ComparisonAnalysis } from '@/components/Analysis/ComparisonAnalysis';
import { OptimizationAnalysis } from '@/components/Analysis/OptimizationAnalysis';
import { useApi } from '@/lib/hooks/useApi';

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('performance');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { api } = useApi();

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    try {
      const stats = await api.getTradingStatistics();
      setStatistics(stats.statistics);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement analyse:', error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'risk', label: 'Risques', icon: AlertTriangle },
    { id: 'comparison', label: 'Comparaison', icon: TrendingUp },
    { id: 'optimization', label: 'Optimisation', icon: Zap },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
          📈 Analyse Avancée
        </h1>
        <p className="text-gray-400 text-lg">
          Analysez en détail les performances de votre stratégie
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
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'performance' && <PerformanceAnalysis data={statistics} />}
        {activeTab === 'risk' && <RiskAnalysis data={statistics} />}
        {activeTab === 'comparison' && <ComparisonAnalysis data={statistics} />}
        {activeTab === 'optimization' && <OptimizationAnalysis data={statistics} />}
      </motion.div>
    </div>
  );
}