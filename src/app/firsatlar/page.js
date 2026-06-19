'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function nameToSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function FirsatlarPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // AI'ın "BUY" kararı verdiği ve güven skoru yüksek olan ürünleri filtrele
          const best = data
            .filter(p => p.decision === 'BUY' || p.trustScore >= 65)
            .sort((a, b) => b.trustScore - a.trustScore);
          setProducts(best.length > 0 ? best : data.sort((a, b) => b.trustScore - a.trustScore).slice(0, 6));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (p) => p ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(p) : '—';

  const getDecision = (d) => {
    switch(d) {
      case 'BUY': return { label: '✅ AL', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' };
      case 'AVOID': return { label: '⚠️ KAÇIN', color: '#f87171', bg: 'rgba(248,113,113,0.1)' };
      default: return { label: '⏳ BEKLE', color: '#facc15', bg: 'rgba(250,204,21,0.1)' };
    }
  };

  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <Link href="/" className="back-link" style={{ display: 'inline-block', marginBottom: '24px', color: 'var(--blue-400)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
        ← Ana Sayfaya Dön
      </Link>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
            🏆 Haftanın En İyi Fırsatları
          </h1>
          <span style={{ fontSize: '11px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontWeight: '700' }}>
            AI SEÇİMİ
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Yapay zekamızın "AL" kararı verdiği, güven skoru yüksek, gerçek indirimi onaylanmış ürünler.
        </p>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="loading-dots"><span/><span/><span/></div></div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p>Henüz yeterli veri yok. Ürün eklemeye başlayın!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {products.map((product, i) => {
            const dc = getDecision(product.decision);
            return (
              <Link
                key={product.id}
                href={`/urun/${nameToSlug(product.name)}-${product.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="bento-card" style={{
                  padding: '24px',
                  transition: 'all 0.3s',
                  background: i === 0
                    ? 'linear-gradient(145deg, rgba(74,222,128,0.08), rgba(30,41,59,0.8))'
                    : 'var(--bg-card)',
                  borderColor: i === 0 ? 'rgba(74,222,128,0.2)' : 'var(--border)',
                  position: 'relative',
                }}>
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#0f172a', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' }}>
                      🥇 EN İYİ FIRSAT
                    </div>
                  )}
                  {i === 1 && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(168,85,247,0.15)', color: '#c084fc', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' }}>
                      🥈 2. SIRADA
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    {product.image ? (
                      <img src={product.image} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '10px', background: 'var(--gray-800)' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', background: 'var(--gray-800)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🛍️</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', lineHeight: 1.4, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {product.platforms?.map(p => (
                          <span key={p} style={{ fontSize: '11px', background: 'var(--gray-800)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: '#4ade80' }}>{formatPrice(product.currentPrice)} TL</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: dc.color, background: dc.bg, padding: '4px 10px', borderRadius: '6px' }}>
                        {dc.label}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: product.trustScore >= 70 ? '#4ade80' : product.trustScore >= 40 ? '#facc15' : '#f87171' }}>
                        %{Math.round(product.trustScore)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
