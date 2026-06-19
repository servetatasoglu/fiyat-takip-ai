'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductRating from './ProductRating';

function nameToSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          // Take first 3 products as featured
          setProducts(data.slice(0, 3));
        }
      } catch (err) {
        console.error('Öne çıkan ürünler yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getDecisionConfig = (decision) => {
    switch (decision) {
      case 'BUY': return { label: 'AL', color: 'var(--green-400)', bg: 'rgba(74, 222, 128, 0.1)', icon: '📈' };
      case 'AVOID': return { label: 'KAÇIN', color: 'var(--red-400)', bg: 'rgba(248, 113, 113, 0.1)', icon: '⚠️' };
      default: return { label: 'BEKLE', color: 'var(--yellow-400)', bg: 'rgba(250, 204, 21, 0.1)', icon: '⏳' };
    }
  };

  if (loading) {
    return (
      <div className="featured-section">
        <div className="section-header">
          <h2>🔥 Öne Çıkan Ürünler</h2>
          <span className="count">Popüler</span>
        </div>
        <div className="loading-screen" style={{ padding: '40px 0' }}>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="featured-section">
      <div className="section-header">
        <h2>🔥 Öne Çıkan Ürünler</h2>
        <span className="count">Popüler</span>
      </div>

      <div className="featured-grid">
        {products.map((product) => {
          const dc = getDecisionConfig(product.decision);
          return (
            <div key={product.id} className="product-card-wrapper">
              <Link href={`/urun/${nameToSlug(product.name)}-${product.id}`} className="product-card">
                <div className="featured-badge">Öne Çıkan</div>
                <div className="product-card-top">
                  {product.image ? (
                    <img className="product-card-image" src={product.image} alt={product.name} loading="lazy" />
                  ) : (
                    <div className="product-card-image" style={{display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gray-700)', fontSize: '32px'}}>🛍️</div>
                  )}
                  <div className="product-card-info">
                    <div className="product-card-name">{product.name}</div>
                    <div className="product-card-price">
                      {formatPrice(product.currentPrice)}<span> TL</span>
                    </div>
                    <ProductRating rating={product.rating} reviewCount={product.reviewCount} />
                  </div>
                </div>
                
                <div className="product-card-bottom">
                  <div className="platform-tags">
                    {product.platforms.map(p => (
                      <span key={p} className="platform-tag">{p}</span>
                    ))}
                  </div>
                  <div className="decision-chip" style={{ color: dc.color, background: dc.bg }}>
                    {dc.icon} {dc.label}
                  </div>
                </div>

                <div className="product-card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Güven</span>
                    <span className="stat-value" style={{ color: product.trustScore >= 70 ? 'var(--green-400)' : product.trustScore >= 40 ? 'var(--yellow-400)' : 'var(--red-400)' }}>
                      %{Math.round(product.trustScore)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Platform</span>
                    <span className="stat-value">{product.platforms.length}</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
