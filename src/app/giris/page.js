'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        // Auto-login after register
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(mode === 'register' ? 'Kayıt başarılı ama giriş yapılamadı.' : 'E-posta veya şifre hatalı.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ paddingTop: '60px', maxWidth: '440px', margin: '0 auto' }}>
      <div className="dashboard-panel" style={{ padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>
            {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Alarmlarınıza ve takip listenize erişin' : 'Ücretsiz hesap oluşturun'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#f87171',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Ad Soyad</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Adınız"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--gray-800)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@gmail.com"
              required
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--gray-800)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'En az 6 karakter' : '••••••'}
              required
              minLength={6}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--gray-800)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              background: loading ? 'var(--gray-700)' : 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '14px', fontWeight: '700',
              cursor: loading ? 'wait' : 'pointer',
              marginTop: '8px',
            }}
          >
            {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <>Hesabınız yok mu? <button onClick={() => { setMode('register'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--blue-400)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Kayıt Ol</button></>
          ) : (
            <>Zaten hesabınız var mı? <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--blue-400)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Giriş Yap</button></>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Ana Sayfaya Dön</Link>
        </div>
      </div>
    </div>
  );
}
