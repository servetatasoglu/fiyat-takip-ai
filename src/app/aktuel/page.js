'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AktuelPage() {
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brochures')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setBrochures(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(p);

  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <Link href="/" className="back-link" style={{ display: 'inline-block', marginBottom: '24px', color: 'var(--blue-400)', textDecoration: 'none' }}>
        ← Ana Sayfaya Dön
      </Link>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
          <span style={{ marginRight: '8px' }}>🛒</span>Süpermarket Aktüel Ürünleri
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          BİM, A101, ŞOK ve diğer marketlerin bu haftaki öne çıkan teknoloji fırsatları.
        </p>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : brochures.length === 0 ? (
        <div className="empty-state">
          <p>Şu an için aktif broşür bulunmuyor.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {brochures.map(brochure => (
            <div key={brochure.id} className="dashboard-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px', background: 'linear-gradient(90deg, var(--gray-800), var(--bg-dark))', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--blue-500)', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                    {brochure.storeName}
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{brochure.title}</h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Geçerlilik: {new Date(brochure.startDate).toLocaleDateString('tr-TR')} - {new Date(brochure.endDate).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
                <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue-400)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  {brochure.items.length} Ürün
                </span>
              </div>
              
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {brochure.items.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => alert('Yapay Zeka bu ürünü çok yakında analiz edecek! 🤖')}
                    style={{ background: 'var(--gray-800)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s, borderColor 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--blue-400)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ height: '120px', background: 'var(--bg-dark)', borderRadius: '4px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🛍️'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--blue-400)', marginBottom: '4px', fontWeight: 'bold' }}>{item.category}</div>
                    <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', lineHeight: 1.3 }}>{item.name}</h3>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--green-400)' }}>
                      {formatPrice(item.price)} TL
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
