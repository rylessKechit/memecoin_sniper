import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  className = "",
  subtitle 
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-400 text-sm">{title}</div>
        {icon && (
          <div className="text-primary-400">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold text-white">{value}</div>
        {getTrendIcon()}
      </div>
      
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </motion.div>
  );
};