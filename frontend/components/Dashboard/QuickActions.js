import { useRouter } from 'next/navigation';
import { Play, Settings, BarChart3, Download } from 'lucide-react';

export const QuickActions = () => {
  const router = useRouter();

  const actions = [
    {
      label: 'Nouveau Backtest',
      icon: Play,
      onClick: () => router.push('/backtest'),
      className: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500'
    },
    {
      label: 'Configuration',
      icon: Settings,
      onClick: () => router.push('/config'),
      className: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500'
    },
    {
      label: 'Analyse Avancée',
      icon: BarChart3,
      onClick: () => router.push('/analysis'),
      className: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500'
    },
    {
      label: 'Exporter Données',
      icon: Download,
      onClick: () => console.log('Export...'),
      className: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500'
    }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        🚀 Actions Rapides
      </h3>
      
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`w-full px-4 py-3 rounded-lg text-white font-medium transition-all flex items-center gap-3 ${action.className}`}
            >
              <Icon className="w-5 h-5" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};