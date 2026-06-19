'use client';

const TREND_CONFIG = {
  dropping: { icon: '📉', color: 'var(--green-400)', label: 'Düşüyor', bgColor: 'rgba(74,222,128,0.08)' },
  rising:   { icon: '📈', color: 'var(--red-400)',   label: 'Yükseliyor', bgColor: 'rgba(248,113,113,0.08)' },
  stable:   { icon: '➡️', color: 'var(--yellow-400)', label: 'Sabit', bgColor: 'rgba(250,204,21,0.08)' },
};

export default function PricePrediction({ prediction }) {
  if (!prediction) return null;

  const cfg = TREND_CONFIG[prediction.trend] || TREND_CONFIG.stable;
  const fmt = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n);

  return (
    <div style={{
      background: cfg.bgColor,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '28px' }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Yapay Zeka Fiyat Tahmini
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {prediction.daysAhead} gün içinde beklenen fiyat
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Şu an</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(prediction.currentPrice)} TL</div>
        </div>

        <div style={{ fontSize: '20px', color: 'var(--text-muted)' }}>→</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{prediction.daysAhead} gün sonra</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: cfg.color }}>{fmt(prediction.predictedPrice)} TL</div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: cfg.color }}>
            {prediction.changePercent > 0 ? '+' : ''}{prediction.changePercent}%
          </div>
        </div>

        <div style={{
          background: 'var(--gray-800)',
          borderRadius: '8px',
          padding: '8px 12px',
          textAlign: 'center',
          minWidth: '72px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Güvenilirlik</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '800',
            color: prediction.confidence >= 60 ? 'var(--green-400)' : prediction.confidence >= 30 ? 'var(--yellow-400)' : 'var(--red-400)',
          }}>
            %{prediction.confidence}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
        {prediction.trend === 'dropping'
          ? '⏳ Sabırla beklemeye değer olabilir'
          : prediction.trend === 'rising'
          ? '⚡ Fiyat artmadan almayı düşünün'
          : '🔄 Fiyat stabil seyrediyor'}
      </div>
    </div>
  );
}
