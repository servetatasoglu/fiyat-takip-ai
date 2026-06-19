'use client';

export default function MarketValueBarometer({ currentPrice, marketValue }) {
  if (!currentPrice || !marketValue) return null;

  // Calculate percentage difference
  const diff = currentPrice - marketValue;
  const percentDiff = (diff / marketValue) * 100;
  
  // Cap the visual needle at -50% and +50%
  const clampedPercent = Math.max(-50, Math.min(50, percentDiff));
  
  // Transform -50..50 to 0..100 for absolute positioning (left: 0% to left: 100%)
  const leftPosition = clampedPercent + 50;

  const isGoodDeal = currentPrice < marketValue;
  const color = isGoodDeal ? 'var(--green-400)' : 'var(--red-400)';
  const label = isGoodDeal 
    ? `Piyasa değerinin %${Math.abs(percentDiff).toFixed(1)} altında` 
    : `Piyasa değerinin %${Math.abs(percentDiff).toFixed(1)} üzerinde`;

  return (
    <div className="dashboard-panel" style={{ marginBottom: '24px', overflow: 'hidden' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        🧭 Piyasa Değeri Barometresi
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Yapay zeka tüm platformlardaki tarihsel fiyatları analiz ederek ürünün gerçek değerini <strong style={{ color: 'var(--text-primary)' }}>{marketValue.toLocaleString('tr-TR')} TL</strong> olarak belirledi.
      </p>

      <div style={{ position: 'relative', height: '24px', borderRadius: '12px', background: 'linear-gradient(90deg, var(--green-500) 0%, var(--yellow-400) 50%, var(--red-500) 100%)', marginBottom: '8px' }}>
        {/* Needle */}
        <div style={{
          position: 'absolute',
          top: '-4px',
          bottom: '-4px',
          left: `${leftPosition}%`,
          width: '4px',
          background: 'var(--text-primary)',
          borderRadius: '2px',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          transform: 'translateX(-50%)',
          transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
        <span>Çok Ucuz</span>
        <span>Adil Değer</span>
        <span>Çok Pahalı</span>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <div style={{ fontSize: '24px', fontWeight: '800', color: color }}>
          {currentPrice.toLocaleString('tr-TR')} TL
        </div>
        <div style={{ fontSize: '14px', color: color, fontWeight: '600' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
