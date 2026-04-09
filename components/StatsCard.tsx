interface StatsCardProps {
  title: string;
  value: string;
  sub?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

const styles: Record<string, { border: string; bg: string; text: string }> = {
  blue:   { border: '#2E78B7', bg: '#eef5fb', text: '#2E78B7' },
  green:  { border: '#5AAA4A', bg: '#eef7ec', text: '#5AAA4A' },
  yellow: { border: '#E8872D', bg: '#fdf3e8', text: '#E8872D' },
  purple: { border: '#3B3B4F', bg: '#ededf0', text: '#3B3B4F' },
};

export default function StatsCard({ title, value, sub, color = 'blue' }: StatsCardProps) {
  const s = styles[color];
  return (
    <div className="rounded-xl p-4 md:p-5 shadow bg-white"
      style={{ borderLeft: `4px solid ${s.border}`, background: s.bg }}>
      <p className="text-xs md:text-sm font-medium" style={{ color: '#6b7280' }}>{title}</p>
      <p className="text-lg md:text-2xl font-bold mt-1" style={{ color: s.text }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{sub}</p>}
    </div>
  );
}
