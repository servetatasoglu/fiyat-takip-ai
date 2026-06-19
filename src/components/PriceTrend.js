'use client';

export default function PriceTrend({ trend, percentage }) {
  const getTrendConfig = (trend) => {
    switch (trend) {
      case 'up':
        return { icon: '📈', label: 'Düşüyor', color: 'var(--green-400)' };
      case 'down':
        return { icon: '📉', label: 'Yükseliyor', color: 'var(--red-400)' };
      default:
        return { icon: '➡️', label: 'Stabil', color: 'var(--yellow-400)' };
    }
  };

  const config = getTrendConfig(trend);

  return (
    <div className="price-trend">
      <span className="trend-icon">{config.icon}</span>
      <span className="trend-label" style={{ color: config.color }}>
        {config.label}
      </span>
      {percentage !== undefined && percentage !== null && !isNaN(percentage) && (
        <span className="trend-percentage">
          %{Math.abs(percentage).toFixed(1)}
        </span>
      )}
    </div>
  );
}
