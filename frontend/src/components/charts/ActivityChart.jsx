import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10, 10, 15, 0.95)',
      border: '1px solid rgba(0, 229, 255, 0.2)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '0.8rem',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
          {p.dataKey}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ActivityChart({ data }) {
  // Only show last 30 ticks for clarity
  const sliced = useMemo(() => data.slice(-30), [data]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={sliced} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradCrit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#55556A' }}
          tickLine={false}
          axisLine={false}
          interval={9}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#55556A' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="low" stackId="1" stroke="#00E5FF" strokeWidth={1.5} fill="url(#gradLow)" />
        <Area type="monotone" dataKey="medium" stackId="1" stroke="#F59E0B" strokeWidth={1.5} fill="url(#gradMed)" />
        <Area type="monotone" dataKey="high" stackId="1" stroke="#F97316" strokeWidth={1.5} fill="url(#gradHigh)" />
        <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" strokeWidth={1.5} fill="url(#gradCrit)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
