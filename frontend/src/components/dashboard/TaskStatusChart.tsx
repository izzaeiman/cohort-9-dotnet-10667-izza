import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { StatusDistributionData } from '../../types/dashboard.types';
import useTheme from '../../hooks/useTheme';

interface TaskStatusChartProps {
  data: StatusDistributionData[];
}

export const TaskStatusChart = ({ data }: TaskStatusChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const legendTextColor = isDark ? '#A1A1AA' : '#444444';
  const tooltipBg = isDark ? '#171A21' : '#ffffff';
  const tooltipBorder = isDark ? '#323744' : '#ECECEC';
  const tooltipText = isDark ? '#F4F4F5' : '#1F1F1F';

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="48%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
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
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: legendTextColor, fontSize: '12px', fontWeight: 600 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskStatusChart;
