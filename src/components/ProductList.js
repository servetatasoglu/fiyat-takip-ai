'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PriceTrend from '@/components/PriceTrend';
import ProductRating from '@/components/ProductRating';
import { useCompare } from '@/contexts/CompareContext';

function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ProductList({ refreshKey, category, filters, onProductsLoaded }) {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const navigateToProduct = (productId, productName) => {
    const slug = productName ? `${nameToSlug(productName)}-${productId}` : String(productId);
    router.push(`/urun/${slug}`);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setAllProducts(data);
        setFilteredProducts(data);
        if (onProductsLoaded) onProductsLoaded(data);
      }
    } catch (err) {
      console.error('Ürünler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshKey]);

  useEffect(() => {
    let filtered = [...allProducts];

    // Kategori filtresi
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (!filters) {
      setFilteredProducts(filtered);
      return;
    }

    // Fiyat aralığı filtresi
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.currentPrice >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.currentPrice <= parseFloat(filters.maxPrice));
    }

    // Platform filtresi
    if (filters.platforms && filters.platforms.length > 0) {
      filtered = filtered.filter(p => p.platforms && p.platforms.some(platform => filters.platforms.includes(platform)));
    }

    // Sıralama
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.currentPrice - b.currentPrice);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.currentPrice - a.currentPrice);
          break;
        case 'trust-desc':
          filtered.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
          break;
        case 'date-desc':
          filtered.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [category, filters, allProducts]);

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleDelete = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Bu ürünü takip listesinden kaldırmak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllProducts(prev => prev.filter(p => p.id !== productId));
        setFilteredProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Silme hatası:', err);
    }
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
      <div className="loading-screen">
        <div className="loading-dots"><span /><span /><span /></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Market Verileri Yükleniyor...</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🔍</div>
        <p>Filtre kriterlerine uygun ürün bulunamadı.<br />Filtreleri temizleyerek tekrar deneyin.</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="section-header">
        <h2>Piyasa İzleme Listesi</h2>
        <span className="count">{filteredProducts.length} Benzersiz Ürün Grubu</span>
      </div>

      <div className="product-grid">
        {filteredProducts.map((product) => {
          const dc = getDecisionConfig(product.decision);
          return (
            <div key={product.id} className="product-card-wrapper">
              <div 
                className="product-card"
                onClick={() => navigateToProduct(product.id, product.name)}
                style={{ cursor: 'pointer' }}
              >
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
                    {product.platforms.map(p => {
                      const platformInfo = {
                        trendyol: { name: 'Trendyol', color: '#f27a1a', icon: '🟠' },
                        hepsiburada: { name: 'Hepsiburada', color: '#9d28b0', icon: '🟣' },
                        amazon: { name: 'Amazon', color: '#ff9900', icon: '🟡' },
                        n11: { name: 'N11', color: '#000000', icon: '⚫' },
                      };
                      const info = platformInfo[p?.toLowerCase()] || { name: p, color: '#64748b', icon: '⚪' };
                      return (
                        <span 
                          key={p} 
                          className="platform-tag"
                          style={{ 
                            background: `${info.color}20`,
                            borderColor: info.color,
                            color: info.color 
                          }}
                        >
                          {info.icon} {info.name}
                        </span>
                      );
                    })}
                  </div>
                  <div className="decision-chip" style={{ color: dc.color, background: dc.bg }}>
                    {dc.icon} {dc.label}
                  </div>
                </div>

                <PriceTrend trend={product.priceTrend || 'stable'} percentage={product.priceChangePercentage} />

                <div className="product-card-stats">
                  <div className="stat-item" title="Güven skoru: Yorum kalitesi, sahte yorum oranı ve satıcı güvenilirliğine göre hesaplanır">
                    <span className="stat-label">Güven</span>
                    <span className="stat-value" style={{ color: product.trustScore >= 70 ? 'var(--green-400)' : product.trustScore >= 40 ? 'var(--yellow-400)' : 'var(--red-400)' }}>
                      %{Math.round(product.trustScore)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Eşleşme</span>
                    <span className="stat-value">%{product.matchConfidence}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Güncelleme</span>
                    <span className="stat-value">{new Date(product.lastUpdated).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>
              <div className="card-actions">
                <button
                  title={isInCompare(product.id) ? 'Karşılaştırmadan Çıkar' : 'Karşılaştırmaya Ekle'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product);
                  }}
                  style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    border: `1px solid ${isInCompare(product.id) ? 'rgba(124,58,237,0.4)' : 'rgba(148,163,184,0.2)'}`,
                    background: isInCompare(product.id) ? 'rgba(124,58,237,0.15)' : 'rgba(30,41,59,0.8)',
                    color: isInCompare(product.id) ? '#a78bfa' : 'var(--text-muted)',
                    fontSize: '14px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  }}
                >
                  {isInCompare(product.id) ? '✓' : '⊕'}
                </button>
                <button 
                  className="delete-btn-inline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(e, product.id);
                  }} 
                  title="Takipten Kaldır"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
