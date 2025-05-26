// components/Dashboard/ActiveBacktests.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, TrendingUp } from 'lucide-react';

export const ActiveBacktests = () => {
  const [activeBacktests, setActiveBacktests] = useState([]);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-400" />
        Backtests Actifs
      </h3>
      
      {activeBacktests.length > 0 ? (
        <div className="space-y-3">
          {activeBacktests.map((backtest, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{backtest.name}</span>
                <span className="text-primary-400">{backtest.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">Aucun backtest en cours</p>
        </div>
      )}
    </div>
  );
};