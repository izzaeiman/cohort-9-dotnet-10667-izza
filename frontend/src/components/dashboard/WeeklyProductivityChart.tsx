import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ProductivityDataPoint } from '../../types/dashboard.types';

interface WeeklyProductivityChartProps {
  data: ProductivityDataPoint[];
}

export const WeeklyProductivityChart = ({ data }: WeeklyProductivityChartProps) => {
  const safeData = data ?? [];

  return (
    <div style={{ width: '100%', height: 260 }}>
      {/* Screen-reader accessible data text alternative */}
      <div className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
        <h4>Weekly Productivity Overview</h4>
        <ul>
          {safeData.map((item) => (
            <li key={item.day}>
              {item.day}: {item.completed} completed, {item.created} created
            </li>
          ))}
        </ul>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={safeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF7A1A" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FF7A1A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB347" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#FFB347" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Tasks Completed"
            stroke="#FF7A1A"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCompleted)"
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Tasks Created"
            stroke="#FFB347"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorCreated)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyProductivityChart;
