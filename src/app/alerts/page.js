'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAlerts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (p) => p ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(p) : '—';

  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
          <span style={{ marginRight: '8px' }}>📊</span>Fiyat Alarm Merkezi
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Hedef fiyatınıza ne kadar yaklaştığınızı görsel olarak takip edin.
        </p>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔕</div>
          <p style={{ marginBottom: '16px' }}>Henüz kurulmuş bir fiyat alarmınız yok.</p>
          <Link href="/" style={{ color: 'var(--blue-400)', textDecoration: 'none', fontWeight: '600' }}>
            ← Ürün Ekle
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {alerts.map(alert => {
            const mg = alert.matchGroup;
            // Get cheapest current price from listings
            let currentPrice = null;
            if (mg?.listings) {
              for (const l of mg.listings) {
                if (l.prices && l.prices.length > 0) {
                  const p = l.prices[l.prices.length - 1]?.price || l.prices[0]?.price;
                  if (p && (currentPrice === null || p < currentPrice)) currentPrice = p;
                }
              }
            }

            const target = alert.targetPrice;
            // Calculate gauge: how close current price is to target
            // If current >= 2x target, gauge is at 0%. If current <= target, gauge is at 100%
            const maxRange = target * 2;
            const progress = currentPrice ? Math.max(0, Math.min(100, ((maxRange - currentPrice) / (maxRange - target)) * 100)) : 0;
            const isTriggered = alert.isTriggered || (currentPrice && currentPrice <= target);
            const gaugeColor = isTriggered ? 'var(--green-500)' : progress > 60 ? 'var(--yellow-400)' : 'var(--blue-500)';

            return (
              <div key={alert.id} className="alert-card">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {new Date(alert.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {mg?.canonicalName || 'Bilinmeyen Ürün'}
                    </h3>
                  </div>
                  {isTriggered ? (
                    <span style={{ fontSize: '11px', background: 'rgba(34,197,94,0.15)', color: 'var(--green-400)', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      ✓ Hedefe Ulaşıldı
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: 'var(--blue-400)', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      ⏳ İzleniyor
                    </span>
                  )}
                </div>

                {/* Price comparison */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Güncel Fiyat</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{formatPrice(currentPrice)} TL</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hedef Fiyat</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--green-400)' }}>{formatPrice(target)} TL</div>
                  </div>
                </div>

                {/* Visual gauge bar */}
                <div className="alert-gauge">
                  <div className="alert-gauge-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, var(--blue-500), ${gaugeColor})` }} />
                  <div className="alert-gauge-marker" style={{ left: '100%' }} />
                </div>
                <div className="alert-prices">
                  <span>Mevcut</span>
                  <span style={{ color: gaugeColor, fontWeight: '700' }}>%{Math.round(progress)} yakın</span>
                  <span>Hedef 🎯</span>
                </div>

                {/* Action */}
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Link href={`/urun/urun-${mg?.id}`} className="platform-link-btn" style={{ width: '100%', justifyContent: 'center' }}>
                    Detaylı Analiz →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
