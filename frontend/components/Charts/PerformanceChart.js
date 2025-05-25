import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateMockData } from '@/lib/utils';

export const PerformanceChart = ({ data }) => {
  // Données simulées si pas de vraies données
  const chartData = data || Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    capital: 10000 + Math.random() * 15000,
    return: (Math.random() - 0.5) * 40
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
          />
          <YAxis 
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
          />
          <Line 
            type="monotone" 
            dataKey="capital" 
            stroke="#00ff88" 
            strokeWidth={2}
            dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#00ff88', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};