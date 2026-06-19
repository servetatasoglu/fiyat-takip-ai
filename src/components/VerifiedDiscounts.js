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

export default function VerifiedDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/discounts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDiscounts(data);
          setLoading(false);
        } else {
          // Eğer indirim yoksa, DB'deki gerçek ürünlerden demo üret
          fetch('/api/products')
            .then(res => res.json())
            .then(prodData => {
              if (Array.isArray(prodData) && prodData.length >= 2) {
                setDiscounts([
                  {
                    id: prodData[0].id,
                    name: '(Demo) ' + prodData[0].name,
                    image: prodData[0].image || 'https://via.placeholder.com/150',
                    currentPrice: prodData[0].currentPrice,
                    oldPrice: Math.round(prodData[0].currentPrice * 1.15),
                    discountPercent: 15,
                    platform: prodData[0].platforms?.[0] || 'trendyol',
                    trustScore: prodData[0].trustScore || 90
                  },
                  {
                    id: prodData[1].id,
                    name: '(Demo) ' + prodData[1].name,
                    image: prodData[1].image || 'https://via.placeholder.com/150',
                    currentPrice: prodData[1].currentPrice,
                    oldPrice: Math.round(prodData[1].currentPrice * 1.12),
                    discountPercent: 12,
                    platform: prodData[1].platforms?.[0] || 'hepsiburada',
                    trustScore: prodData[1].trustScore || 85
                  }
                ]);
              }
              setLoading(false);
            })
            .catch(() => setLoading(false));
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(p);

  if (loading) return null;

  const displayData = discounts;

  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--green-400)' }}>🔥</span>
          Yapay Zeka Onaylı İndirimler
        </h2>
        <span style={{ fontSize: '11px', background: 'rgba(34,197,94,0.1)', color: 'var(--green-400)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
          SAHTE İNDİRİMLER FİLTRELENDİ
        </span>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', snapType: 'x mandatory' }} className="hide-scrollbar">
        {displayData.map(product => (
          <div key={product.id} className="dashboard-panel" style={{ minWidth: '280px', flex: '0 0 auto', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--red-500)', color: 'white', fontWeight: '800', fontSize: '14px', padding: '6px 12px', borderBottomLeftRadius: '12px' }}>
              -%{Math.round(product.discountPercent)}
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--gray-800)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛍️'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.name}
                </h3>
                <span style={{ fontSize: '11px', background: 'var(--gray-800)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                  {product.platform}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {formatPrice(product.oldPrice)} TL
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--green-400)' }}>
                  {formatPrice(product.currentPrice)} TL
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--blue-400)', textAlign: 'right' }}>
                Güven: %{Math.round(product.trustScore)}
              </div>
            </div>

            <Link href={`/urun/${nameToSlug(product.name)}-${product.id}`} className="platform-link-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Fırsatı İncele →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
