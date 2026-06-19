'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function AuthNav() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (status === 'loading') return <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray-800)' }} />;

  if (!session) {
    return (
      <Link
        href="/giris"
        style={{
          padding: '6px 14px',
          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          border: 'none', borderRadius: '8px',
          color: '#fff', textDecoration: 'none',
          fontSize: '12px', fontWeight: '700',
          whiteSpace: 'nowrap',
        }}
      >
        Giriş Yap
      </Link>
    );
  }

  const initial = (session.user.name || session.user.email || '?')[0].toUpperCase();
  const isPremium = session.user.isPremium;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: isPremium ? 'linear-gradient(135deg, #7c3aed, #1d4ed8)' : 'var(--gray-700)',
          border: isPremium ? '2px solid #a78bfa' : '1px solid var(--border)',
          color: '#fff', fontSize: '14px', fontWeight: '700',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={session.user.email}
      >
        {initial}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '42px', right: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '12px', padding: '8px',
          minWidth: '200px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{session.user.name || 'Kullanıcı'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{session.user.email}</div>
            {isPremium && <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: '700', marginTop: '4px' }}>💎 Premium Üye</div>}
          </div>

          {[
            { href: '/alerts', icon: '🔔', label: 'Alarmlarım' },
            { href: '/compare', icon: '⚖️', label: 'Karşılaştırmalar' },
            { href: '/premium', icon: '💎', label: isPremium ? 'Premium Yönet' : 'Premium\'a Geç' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px',
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}

          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px',
              color: '#f87171', background: 'none', border: 'none',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              marginTop: '4px', borderTop: '1px solid var(--border)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
