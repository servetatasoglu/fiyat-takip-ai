'use client';

import { useCompare, MAX_COMPARE } from '@/contexts/CompareContext';
import { useRouter } from 'next/navigation';

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const router = useRouter();

  if (compareList.length === 0) return null;

  const fmt = (p) => p ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(p) : '—';

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9000,
      background: 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.97) 20%)',
      paddingTop: '24px',
    }}>
      <div style={{
        background: 'rgba(15,23,42,0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(59,130,246,0.3)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '1280px',
        margin: '0 auto',
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--blue-400)', whiteSpace: 'nowrap' }}>
          ⚖️ Karşılaştır ({compareList.length}/{MAX_COMPARE})
        </div>

        {/* Product chips */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
          {compareList.map(p => (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--gray-800)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
            }}>
              {p.image && <img src={p.image} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} />}
              <span style={{ color: 'var(--text-primary)', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <span style={{ color: 'var(--green-400)', fontWeight: '700' }}>{fmt(p.currentPrice)} TL</span>
              <button
                onClick={() => removeFromCompare(p.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '0', lineHeight: 1 }}
              >×</button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: MAX_COMPARE - compareList.length }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              background: 'rgba(30,41,59,0.4)',
              border: '1px dashed var(--border)',
              borderRadius: '8px',
              padding: '6px 20px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              + Ürün ekle
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={clearCompare}
            style={{
              background: 'var(--gray-800)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Temizle
          </button>
          <button
            onClick={() => router.push('/compare')}
            disabled={compareList.length < 2}
            style={{
              background: compareList.length >= 2 ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)' : 'var(--gray-700)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: compareList.length >= 2 ? 'pointer' : 'not-allowed',
              opacity: compareList.length < 2 ? 0.5 : 1,
            }}
          >
            Karşılaştır →
          </button>
        </div>
      </div>
    </div>
  );
}
