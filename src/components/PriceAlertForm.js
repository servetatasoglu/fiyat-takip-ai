'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PriceAlertForm({ matchGroupId, currentPrice }) {
  const [targetPrice, setTargetPrice] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [pushStatus, setPushStatus] = useState('idle'); // 'idle' | 'subscribed' | 'denied' | 'loading'
  const [pushSub, setPushSub] = useState(null);
  
  const { data: session } = useSession();

  // Auto-fill email from session if available
  useEffect(() => {
    if (session?.user?.email && !email) {
      setEmail(session.user.email);
    }
  }, [session]);

  // Register service worker and check push status on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setPushSub(existing);
        setPushStatus('subscribed');
      }
    });
  }, []);

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) return;
    setPushStatus('loading');

    try {
      const reg = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      setPushSub(sub);
      setPushStatus('subscribed');
    } catch (err) {
      console.error('[PUSH]', err);
      setPushStatus('denied');
    }
  };

  const unsubscribeFromPush = async () => {
    if (!pushSub) return;
    await pushSub.unsubscribe();
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: pushSub.endpoint }),
    });
    setPushSub(null);
    setPushStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchGroupId,
          targetPrice: parseFloat(targetPrice),
          email: email.trim() || undefined,
          whatsappNumber: whatsapp.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Alarm kurulamadı.');
      setStatus('success');
      setTargetPrice('');
      setEmail('');
      setWhatsapp('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const suggestedPrice = currentPrice ? Math.round(currentPrice * 0.9) : '';

  return (
    <div className="dashboard-panel">
      <h3 style={{ marginBottom: '16px' }}>🔔 Fiyat Alarmı Kur</h3>

      {/* Push Notification Toggle */}
      <div style={{
        background: 'var(--gray-800)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
            🔔 Tarayıcı Bildirimleri
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {pushStatus === 'subscribed' ? 'Aktif — fiyat düşünce bildirim alırsınız' :
             pushStatus === 'denied' ? 'Tarayıcı izin vermedi' :
             'Fiyat düşünce anlık bildirim alın'}
          </div>
        </div>
        {pushStatus === 'subscribed' ? (
          <button
            onClick={unsubscribeFromPush}
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: 'var(--red-400)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✕ Kapat
          </button>
        ) : (
          <button
            onClick={subscribeToPush}
            disabled={pushStatus === 'loading' || pushStatus === 'denied'}
            style={{
              background: pushStatus === 'denied' ? 'var(--gray-700)' : 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: pushStatus === 'denied' ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: pushStatus === 'loading' ? 0.7 : 1,
            }}
          >
            {pushStatus === 'loading' ? '...' : pushStatus === 'denied' ? 'İzin Yok' : '🔔 Aç'}
          </button>
        )}
      </div>

      {status === 'success' ? (
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--green-400)', marginBottom: '4px' }}>
            Alarm Kuruldu!
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Fiyat hedefinize ulaştığında{email ? ' e-posta' : ''} {pushStatus === 'subscribed' ? '+ bildirim' : ''} alacaksınız.
          </div>
          <button
            onClick={() => setStatus(null)}
            style={{
              marginTop: '12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 14px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            + Yeni Alarm
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Hedef Fiyat (TL)
            </label>
            <input
              type="number"
              id="alert-target-price"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              placeholder={suggestedPrice ? `Örn: ${suggestedPrice}` : 'Hedef fiyat girin...'}
              required
              min="1"
              style={{
                width: '100%',
                background: 'var(--gray-800)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: '600',
                boxSizing: 'border-box',
              }}
            />
            {currentPrice > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Mevcut fiyat: <strong>{new Intl.NumberFormat('tr-TR').format(currentPrice)} TL</strong>
                {' '}·{' '}
                <button
                  type="button"
                  onClick={() => setTargetPrice(suggestedPrice)}
                  style={{ background: 'none', border: 'none', color: 'var(--blue-400)', cursor: 'pointer', fontSize: '11px', padding: 0 }}
                >
                  %10 indirim öner ({new Intl.NumberFormat('tr-TR').format(suggestedPrice)} TL)
                </button>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              E-posta (isteğe bağlı)
            </label>
            <input
              type="email"
              id="alert-email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@gmail.com"
              style={{
                width: '100%',
                background: 'var(--gray-800)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fiyat düşünce e-posta bildirimi alırsınız
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              WhatsApp (isteğe bağlı)
            </label>
            <input
              type="tel"
              id="alert-whatsapp"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="+905551234567"
              style={{
                width: '100%',
                background: 'var(--gray-800)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fiyat düşünce WhatsApp bildirimi alırsınız
            </div>
          </div>

          <button
            type="submit"
            id="alert-submit-btn"
            disabled={status === 'loading'}
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {status === 'loading' ? '⏳ Kuruluyor...' : '🎯 Alarm Kur'}
          </button>

          {status === 'error' && (
            <div style={{ fontSize: '12px', color: 'var(--red-400)', textAlign: 'center' }}>
              ❌ Alarm kurulamadı. Tekrar deneyin.
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// Utility: Convert base64 VAPID key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
