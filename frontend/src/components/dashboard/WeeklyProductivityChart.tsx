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
import useTheme from '../../hooks/useTheme';

interface WeeklyProductivityChartProps {
  data: ProductivityDataPoint[];
}

export const WeeklyProductivityChart = ({ data }: WeeklyProductivityChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gridColor = isDark ? '#323744' : '#F0F0F0';
  const textColor = isDark ? '#A1A1AA' : '#888888';
  const tooltipBg = isDark ? '#171A21' : '#ffffff';
  const tooltipBorder = isDark ? '#323744' : '#ECECEC';
  const tooltipText = isDark ? '#F4F4F5' : '#1F1F1F';

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderRadius: '12px',
              border: `1px solid ${tooltipBorder}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '12px',
              fontWeight: 600,
              color: tooltipText,
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
