interface StatsCardProps {
  title: string;
  value: string;
  sub?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

const colorMap = {
  blue: 'border-blue-500 bg-blue-50',
  green: 'border-green-500 bg-green-50',
  yellow: 'border-yellow-500 bg-yellow-50',
  purple: 'border-purple-500 bg-purple-50',
};

const textMap = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  yellow: 'text-yellow-700',
  purple: 'text-purple-700',
};

export default function StatsCard({ title, value, sub, color = 'blue' }: StatsCardProps) {
  return (
    <div className={`border-l-4 rounded-xl p-5 shadow ${colorMap[color]}`}>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${textMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
