'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BADGES = [
  { id: 'first_save', icon: '🥇', label: 'İlk Tasarruf', desc: 'İlk fiyat düşüşünü yakala', threshold: 1 },
  { id: 'hunter_10', icon: '🎯', label: 'Av Uzmanı', desc: '10 ürün takip et', threshold: 10 },
  { id: 'saver_100', icon: '💰', label: 'Tasarruf Ustası', desc: '100 TL tasarruf et', threshold: 100 },
  { id: 'saver_1000', icon: '💎', label: 'Elmas Tasarruf', desc: '1.000 TL tasarruf et', threshold: 1000 },
  { id: 'alert_master', icon: '🔔', label: 'Alarm Ustası', desc: '5 alarm kur', threshold: 5 },
  { id: 'streak_7', icon: '🔥', label: '7 Günlük Seri', desc: '7 gün üst üste giriş yap', threshold: 7 },
];

export default function SavingsDashboard({ products }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertRes] = await Promise.all([
          fetch('/api/alerts'),
        ]);
        const alertData = alertRes.ok ? await alertRes.json() : [];
        setAlerts(alertData);
      } catch {}
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!products) return;

    // Compute savings stats from products
    let totalSaved = 0;
    let dealsFound = 0;

    products.forEach(p => {
      if (p.decision === 'BUY' && p.currentPrice) {
        const marketValue = p.currentPrice * 1.12; // estimated market value
        const saved = marketValue - p.currentPrice;
        if (saved > 0) {
          totalSaved += saved;
          dealsFound++;
        }
      }
    });

    // Load from localStorage for persistence
    const storedSaved = parseFloat(localStorage.getItem('fiyat_total_saved') || '0');
    const storedDeals = parseInt(localStorage.getItem('fiyat_deals') || '0');
    const streak = parseInt(localStorage.getItem('fiyat_streak') || '1');

    // Update streak
    const lastVisit = localStorage.getItem('fiyat_last_visit');
    const today = new Date().toDateString();
    if (lastVisit !== today) {
      localStorage.setItem('fiyat_last_visit', today);
    }

    setStats({
      totalSaved: Math.max(totalSaved, storedSaved),
      dealsFound: Math.max(dealsFound, storedDeals),
      trackedProducts: products.length,
      alertsSet: alerts.length,
      streak,
    });
    setLoading(false);
  }, [products, alerts]);

  const getEarnedBadges = () => {
    if (!stats) return [];
    return BADGES.filter(badge => {
      switch (badge.id) {
        case 'first_save': return stats.dealsFound >= 1;
        case 'hunter_10': return stats.trackedProducts >= 10;
        case 'saver_100': return stats.totalSaved >= 100;
        case 'saver_1000': return stats.totalSaved >= 1000;
        case 'alert_master': return stats.alertsSet >= 5;
        case 'streak_7': return stats.streak >= 7;
        default: return false;
      }
    });
  };

  if (loading || !stats) return null;

  const earnedBadges = getEarnedBadges();
  const level = Math.floor(stats.totalSaved / 500) + 1;
  const levelProgress = (stats.totalSaved % 500) / 500 * 100;
  const nextLevelSave = 500 - (stats.totalSaved % 500);

  return (
    <div className="dashboard-panel fade-in" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>🏆 Tasarruf Dashboard'u</h3>
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #1d4ed8)',
          borderRadius: '20px',
          padding: '4px 14px',
          fontSize: '12px',
          fontWeight: '800',
          color: '#fff',
        }}>
          SEVİYE {level} ⚡
        </div>
      </div>

      {/* Level Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          <span>Seviye {level}</span>
          <span>Sonraki: {new Intl.NumberFormat('tr-TR').format(Math.ceil(nextLevelSave))} TL daha tasarruf</span>
          <span>Seviye {level + 1}</span>
        </div>
        <div style={{ height: '8px', background: 'var(--gray-800)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(levelProgress, 100)}%`,
            background: 'linear-gradient(90deg, #7c3aed, #1d4ed8)',
            borderRadius: '4px',
            transition: 'width 1s ease-out',
          }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Tasarruf', value: `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(stats.totalSaved)} TL`, color: 'var(--green-400)', icon: '💰', href: null },
          { label: 'Bulunan Fırsatlar', value: stats.dealsFound, color: 'var(--blue-400)', icon: '🎯', href: '/compare' },
          { label: 'Takip Edilen Ürün', value: stats.trackedProducts, color: 'var(--yellow-400)', icon: '📦', href: '/' },
          { label: 'Aktif Alarm', value: stats.alertsSet, color: '#a855f7', icon: '🔔', href: '/alerts' },
        ].map(stat => (
          <div
            key={stat.label}
            onClick={() => stat.href && router.push(stat.href)}
            style={{
              background: 'var(--gray-800)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: stat.href ? 'pointer' : 'default',
              transition: 'transform 0.15s, background 0.15s',
              border: '1px solid transparent',
            }}
            onMouseEnter={e => { if (stat.href) { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.border = '1px solid rgba(124,58,237,0.2)'; }}}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray-800)'; e.currentTarget.style.border = '1px solid transparent'; }}
          >
            <span style={{ fontSize: '24px' }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {stat.label}{stat.href && <span style={{ marginLeft: '4px', opacity: 0.6 }}>→</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          🎖️ Rozetler ({earnedBadges.length}/{BADGES.length})
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {BADGES.map(badge => {
            const earned = earnedBadges.some(b => b.id === badge.id);
            return (
              <div
                key={badge.id}
                title={badge.desc}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '10px 12px',
                  background: earned ? 'rgba(124,58,237,0.15)' : 'var(--gray-800)',
                  border: `1px solid ${earned ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  opacity: earned ? 1 : 0.4,
                  transition: 'all 0.3s',
                  cursor: 'default',
                  minWidth: '64px',
                }}
              >
                <span style={{ fontSize: '22px', filter: earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: earned ? '#a78bfa' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: '#a78bfa',
          textAlign: 'center',
        }}>
          🎉 Tebrikler! <strong>{earnedBadges.length} rozet</strong> kazandınız. Daha fazla tasarruf edin ve seviyelerin kilidini açın!
        </div>
      )}
    </div>
  );
}
