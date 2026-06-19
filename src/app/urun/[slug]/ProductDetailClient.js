'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PriceChart from '@/components/PriceChart';
import PricePrediction from '@/components/PricePrediction';
import PriceComparisonTable from '@/components/PriceComparisonTable';
import TrustScoreMeter from '@/components/TrustScoreMeter';
import AiRecommendation from '@/components/AiRecommendation';
import ReviewBreakdown from '@/components/ReviewBreakdown';
import PriceAlertForm from '@/components/PriceAlertForm';
import TechSpecsComparison from '@/components/TechSpecsComparison';
import SellerComparison from '@/components/SellerComparison';
import PriceTrend from '@/components/PriceTrend';
import ProductRating from '@/components/ProductRating';
import UserReviewsList from '@/components/UserReviewsList';
import MarketValueBarometer from '@/components/MarketValueBarometer';

export default function ProductDetailClient({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ürün yüklenemedi.');
      }
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const triggerAnalysis = async () => {
    setLoading(true);
    try {
      await fetch(`/api/analyze/${id}`);
      await fetchProduct();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  };

  // Share product
  const handleShare = async () => {
    const url = window.location.href;
    const text = `${product.name} — ${formatPrice(product.sources?.[0]?.currentPrice)} TL | FiyatTakip`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link kopyalandı!');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <div className="loading-dots"><span /><span /><span /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Piyasa Analizi Yapılıyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Link href="/" className="back-link">← Ana Sayfa</Link>
        <div className="empty-state">
          <div className="icon">❌</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const lowestSource = product.sources?.reduce((min, s) => (!min || (s.currentPrice && s.currentPrice < min.currentPrice)) ? s : min, null);

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href="/" className="back-link" style={{ color: 'var(--blue-400)', textDecoration: 'none' }}>
          ← Analiz Paneline Dön
        </Link>
        <button
          onClick={handleShare}
          style={{
            background: 'var(--gray-800)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          📤 Paylaş
        </button>
      </div>

      {/* Hero Product Header */}
      <div className="product-hero">
        <div className="product-hero-left">
          {product.image ? (
            <img src={product.image} alt={product.name} className="product-hero-img" />
          ) : (
            <div className="product-hero-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-800)', fontSize: '48px' }}>🛍️</div>
          )}
        </div>
        <div className="product-hero-center">
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', lineHeight: 1.4 }}>{product.name}</h1>
          {product.rating && <ProductRating rating={product.rating} reviewCount={product.reviewCount} />}
          <div className="hero-meta-row" style={{ marginTop: '12px' }}>
            <span className="hero-meta-chip">
              Eşleşme: <strong style={{color: product.confidenceScore > 80 ? 'var(--green-400)' : 'var(--yellow-400)'}}>%{product.confidenceScore}</strong>
            </span>
            <span className="hero-meta-chip">
              Platformlar: {product.sources?.map(s => s.platform).join(', ') || '-'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {product.sources?.map(s => (
              <a key={s.id} href={`/api/redirect?url=${encodeURIComponent(s.url)}&platform=${s.platform}&pid=${s.id}`} target="_blank" rel="noopener noreferrer" className="platform-link-btn">
                {s.platform === 'trendyol' ? '🟠' : s.platform === 'hepsiburada' ? '🟣' : '🟡'} {s.platform} — {formatPrice(s.currentPrice)} TL
                <span className="external-icon">↗</span>
              </a>
            ))}
          </div>
        </div>
        <div className="product-hero-right">
          <button onClick={triggerAnalysis} className="refresh-analysis-btn">
            🔄 Analizi Yenile
          </button>
        </div>
      </div>

      {/* Seller Info Bar */}
      {product.sources?.some(s => s.sellerName) && (
        <div className="seller-bar">
          {product.sources.filter(s => s.sellerName).map(s => (
            <div key={s.id} className="seller-chip">
              <span className="seller-platform">{s.platform}</span>
              <span className="seller-name">🏪 {s.sellerName}</span>
              {s.sellerTrustScore !== null && (
                <span className="seller-score" style={{ color: s.sellerTrustScore >= 80 ? 'var(--green-400)' : s.sellerTrustScore >= 50 ? 'var(--yellow-400)' : 'var(--red-400)' }}>
                  Güven: %{Math.round(s.sellerTrustScore)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Price Trend Indicator */}
      <div style={{ marginBottom: '24px' }}>
        <PriceTrend trend={product.priceTrend || 'stable'} percentage={product.priceChangePercentage} />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-col-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AiRecommendation analysis={product.aiAnalysis} />
          <PriceComparisonTable sources={product.sources || []} />
          {product.prediction && <PricePrediction prediction={product.prediction} />}
          <PriceChart sources={product.sources || []} />
          {product.techSpecs && <TechSpecsComparison specs={product.techSpecs} />}
          {product.sellers && <SellerComparison sellers={product.sellers} />}
        </div>
        
        <div className="dashboard-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="dashboard-panel">
            <h3>🛡️ Pazar Güven Analizi</h3>
            <TrustScoreMeter score={product.aiAnalysis?.trustScore || 50} />
            <ReviewBreakdown analysis={product.reviewAnalysis} />
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--gray-800)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Güven Skoru Hesaplama:</strong><br />
              • Başlangıç: 100<br />
              • Sahte yorum oranı: -{product.reviewAnalysis?.fakePercent || 0}%<br />
              • Risk faktörleri: -{product.reviewAnalysis?.flags?.length > 2 ? '10' : '0'}<br />
              • Yorum sayısı az: -{product.reviewAnalysis?.flags?.includes('Yeterli yorum yok') ? '20' : '0'}
            </div>
          </div>

          {product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0 && (
            <div className="dashboard-panel">
              <h3>💬 Kullanıcı Yorumları</h3>
              <UserReviewsList reviews={product.reviews} />
            </div>
          )}
          
          {lowestSource && (
            <MarketValueBarometer 
              currentPrice={lowestSource.currentPrice} 
              marketValue={product.aiAnalysis?.marketValue || lowestSource.currentPrice * 1.15} 
            />
          )}
          
          <div className="dashboard-panel">
            <h3>⚠️ Risk Faktörleri</h3>
            {product.aiAnalysis?.riskFactors?.length > 0 ? (
               <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                 {product.aiAnalysis.riskFactors.map((rf, i) => (
                    <li key={i} style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--red-400)' }}>🚩</span>
                      {rf}
                    </li>
                 ))}
               </ul>
            ) : (
               <div style={{ fontSize: '13px', color: 'var(--green-400)' }}>✅ Belirgin bir risk tespit edilmedi.</div>
            )}
          </div>
          
          <PriceAlertForm matchGroupId={product.id} currentPrice={product.aiAnalysis?.marketValue || 0} />
        </div>
      </div>
    </div>
  );
}
