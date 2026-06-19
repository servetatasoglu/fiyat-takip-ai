'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DemoCheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const sessionId = searchParams.get('session') || '';
  const [step, setStep] = useState(0); // 0: form, 1: processing, 2: success
  const [card, setCard] = useState('4242 4242 4242 4242');

  const handlePay = async () => {
    setStep(1);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));

    // Activate premium via API
    try {
      await fetch('/api/stripe/demo-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sessionId }),
      });
    } catch {}

    setStep(2);
    setTimeout(() => router.push('/premium'), 3000);
  };

  if (step === 2) {
    return (
      <div className="container fade-in" style={{ paddingTop: '80px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div className="dashboard-panel" style={{ padding: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#22c55e', marginBottom: '12px' }}>
            Ödeme Başarılı!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Premium üyeliğiniz aktif edildi. Yönlendiriliyorsunuz...
          </p>
          <div style={{
            marginTop: '20px', padding: '12px',
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '8px', fontSize: '12px', color: '#a78bfa',
          }}>
            🏷️ DEMO MODU — Gerçek ödeme alınmadı
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ paddingTop: '60px', maxWidth: '460px', margin: '0 auto' }}>
      <div className="dashboard-panel" style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '700', marginBottom: '4px' }}>FiyatTakip Premium</div>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>₺49<span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>/ay</span></div>
        </div>

        <div style={{
          padding: '10px 14px', marginBottom: '20px',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '8px', fontSize: '12px', color: 'var(--blue-400)',
          textAlign: 'center',
        }}>
          🧪 Demo Modu — Test kartı önceden doldurulmuş
        </div>

        {/* Card form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>E-posta</label>
            <input value={email} readOnly style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--gray-800)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px',
            }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Kart Numarası</label>
            <input value={card} onChange={e => setCard(e.target.value)} style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--gray-800)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              fontFamily: 'monospace', letterSpacing: '2px',
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Son Kullanma</label>
              <input defaultValue="12/28" style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--gray-800)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>CVC</label>
              <input defaultValue="123" style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--gray-800)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }} />
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={step === 1}
            style={{
              padding: '14px',
              background: step === 1 ? 'var(--gray-700)' : 'linear-gradient(135deg, #7c3aed, #1d4ed8)',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '15px', fontWeight: '700',
              cursor: step === 1 ? 'wait' : 'pointer',
              marginTop: '8px',
            }}
          >
            {step === 1 ? '💳 İşleniyor...' : '💎 ₺49 Öde — Premium Ol'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => router.push('/premium')} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '13px',
          }}>← Geri Dön</button>
        </div>

        <div style={{
          marginTop: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          🔒 SSL ile korunuyor — Stripe güvenli ödeme altyapısı
        </div>
      </div>
    </div>
  );
}

export default function DemoCheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>Yükleniyor...</div>}>
      <DemoCheckoutInner />
    </Suspense>
  );
}
