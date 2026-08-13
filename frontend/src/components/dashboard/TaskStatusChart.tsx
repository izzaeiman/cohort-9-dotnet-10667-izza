import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { StatusDistributionData } from '../../types/dashboard.types';

interface TaskStatusChartProps {
  data: StatusDistributionData[];
}

export const TaskStatusChart = ({ data }: TaskStatusChartProps) => {
  const safeData = data ?? [];

  return (
    <div style={{ width: '100%', height: 260 }}>
      {/* Screen-reader accessible data text alternative */}
      <div className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
        <h4>Task Status Distribution Summary</h4>
        <ul>
          {safeData.map((item) => (
            <li key={item.name}>
              {item.name}: {item.value} tasks
            </li>
          ))}
        </ul>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={safeData}
            cx="50%"
            cy="48%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {safeData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
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
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: '#444444', fontSize: '12px', fontWeight: 600 }}>
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
