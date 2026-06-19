'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCompare } from '@/contexts/CompareContext';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (compareList.length === 0) return;
    const fetchDetails = async () => {
      setLoading(true);
      const results = {};
      await Promise.all(compareList.map(async (p) => {
        try {
          const res = await fetch(`/api/products/${p.id}`);
          if (res.ok) results[p.id] = await res.json();
        } catch {}
      }));
      setDetails(results);
      setLoading(false);
    };
    fetchDetails();
  }, [compareList]);

  const fmt = (n) => n != null ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '—';

  const ROWS = [
    { label: 'Fiyat', key: (d) => d.sources?.reduce((min, s) => (!min || s.currentPrice < min) ? s.currentPrice : min, null), render: (v) => v ? `${fmt(v)} TL` : '—', highlight: 'min' },
    { label: 'AI Kararı', key: (d) => d.aiAnalysis?.decision, render: (v) => ({ BUY: '✅ AL', WAIT: '⏳ BEKLE', AVOID: '⚠️ KAÇIN' })[v] || '—' },
    { label: 'Güven Skoru', key: (d) => d.aiAnalysis?.trustScore, render: (v) => v != null ? `%${Math.round(v)}` : '—', highlight: 'max' },
    { label: 'Platform Sayısı', key: (d) => d.sources?.length, render: (v) => v || '—', highlight: 'max' },
    { label: 'Son Güncelleme', key: (d) => d.sources?.[0]?.updatedAt, render: (v) => v ? new Date(v).toLocaleDateString('tr-TR') : '—' },
    { label: 'Sahte Yorum', key: (d) => d.reviewAnalysis?.fakePercent, render: (v) => v != null ? `%${v}` : '—', highlight: 'min' },
  ];

  if (compareList.length === 0) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Karşılaştırma Listesi Boş</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Ürün kartlarındaki ⊕ butonuna tıklayarak karşılaştırma listesine ekleyin.
        </p>
        <Link href="/" style={{ color: 'var(--blue-400)', textDecoration: 'none', fontWeight: '600' }}>← Ana Sayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ paddingTop: '32px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <Link href="/" style={{ color: 'var(--blue-400)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>← Geri</Link>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginTop: '8px' }}>⚖️ Ürün Karşılaştırma</h1>
        </div>
        <button onClick={clearCompare} style={{ background: 'var(--gray-800)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>
          Listeyi Temizle
        </button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="loading-dots"><span/><span/><span/></div></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            {/* Header row with product images + names */}
            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid var(--border)', width: '180px' }}>
                  Özellik
                </th>
                {compareList.map(p => (
                  <th key={p.id} style={{ padding: '16px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', background: 'var(--gray-800)' }} />
                      ) : (
                        <div style={{ width: '60px', height: '60px', background: 'var(--gray-800)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛍️</div>
                      )}
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '140px', textAlign: 'center', lineHeight: 1.4 }}>{p.name}</div>
                      <button onClick={() => removeFromCompare(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}>Kaldır ×</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row, ri) => {
                const values = compareList.map(p => row.key(details[p.id] || {}));
                const numVals = values.map(v => typeof v === 'number' ? v : parseFloat(v));
                const best = row.highlight === 'min' ? Math.min(...numVals.filter(v => !isNaN(v))) : row.highlight === 'max' ? Math.max(...numVals.filter(v => !isNaN(v))) : null;

                return (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(30,41,59,0.3)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', borderBottom: '1px solid var(--border)' }}>
                      {row.label}
                    </td>
                    {compareList.map((p, ci) => {
                      const val = values[ci];
                      const numVal = typeof val === 'number' ? val : parseFloat(val);
                      const isBest = best !== null && !isNaN(numVal) && numVal === best;
                      return (
                        <td key={p.id} style={{
                          padding: '14px 16px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: isBest ? '800' : '600',
                          color: isBest ? 'var(--green-400)' : 'var(--text-primary)',
                          background: isBest ? 'rgba(34,197,94,0.05)' : 'transparent',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          {row.render(val)}
                          {isBest && <span style={{ marginLeft: '6px', fontSize: '12px' }}>🏆</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
