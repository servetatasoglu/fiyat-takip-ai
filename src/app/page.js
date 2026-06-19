'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import SearchForm from '@/components/SearchForm';
import ProductList from '@/components/ProductList';
import VerifiedDiscounts from '@/components/VerifiedDiscounts';
import CategoryNav from '@/components/CategoryNav';
import AdvancedFilters from '@/components/AdvancedFilters';
import FeaturedProducts from '@/components/FeaturedProducts';
import AdvancedSearch from '@/components/AdvancedSearch';

import { usePriceStream } from '@/hooks/usePriceStream';
import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState(null);
  const [products, setProducts] = useState([]);
  const [priceToast, setPriceToast] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  usePriceStream(useCallback((update) => {
    setPriceToast(update);
    setTimeout(() => setPriceToast(null), 5000);
    setRefreshKey(k => k + 1);
  }, []));

  const handleProductAdded = () => setRefreshKey(prev => prev + 1);
  const handleCategoryChange = (categoryId) => setSelectedCategory(categoryId);
  const handleFilterChange = (newFilters) => setFilters(newFilters);
  const handleSearch = (product) => console.log('Searching for:', product);

  return (
    <div className="container fade-in">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: '120px', right: '20px',
          padding: '10px 18px',
          background: isDark ? 'var(--gray-800)' : '#e2e8f0',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: isDark ? 'var(--text-primary)' : '#1e293b',
          cursor: 'pointer', fontSize: '13px', fontWeight: '600',
          zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {isDark ? '☀️ Light' : '🌙 Dark'}
      </button>

      {/* Price Drop Toast */}
      {priceToast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: '12px', padding: '14px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: '320px',
          animation: 'slideIn 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '28px' }}>📉</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e' }}>Fiyat Düştü!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {priceToast.productName} — {priceToast.currentPrice} TL
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ PREMIUM HERO ═══════════ */}
      <section className="bento-hero">
        {/* Floating orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="bento-hero-inner">
          {/* Title */}
          <div className="bento-hero-badge">
            <span className="bento-live-dot" /> Yapay Zeka Aktif &amp; Canlı
          </div>
          <h1 className="bento-hero-title">
            Sahte İndirimleri<br />
            <span className="bento-gradient-text">Yapay Zeka Bulur</span>
          </h1>
          <p className="bento-hero-sub">
            Trendyol, Hepsiburada &amp; Amazon'daki ürünleri milisaniyeler içinde analiz et. 
            Gerçek indirimleri gör, sahte yorumları tespit et, en iyi kararı al.
          </p>

          {/* Giant Search */}
          <div className="bento-search-wrapper">
            <SearchForm onProductAdded={handleProductAdded} />
          </div>

          {/* Bento Stats Grid */}
          <div className="bento-stats-grid">
            <div className="bento-stat-card bento-stat-blue">
              <div className="bento-stat-icon">🔍</div>
              <div className="bento-stat-number">12.847</div>
              <div className="bento-stat-label">Analiz Edildi</div>
            </div>
            <div className="bento-stat-card bento-stat-green">
              <div className="bento-stat-icon">🚨</div>
              <div className="bento-stat-number">4.213</div>
              <div className="bento-stat-label">Sahte İndirim Engellendi</div>
            </div>
            <div className="bento-stat-card bento-stat-purple">
              <div className="bento-stat-icon">💰</div>
              <div className="bento-stat-number">₺2.4M</div>
              <div className="bento-stat-label">Kullanıcı Tasarrufu</div>
            </div>
            <div className="bento-stat-card bento-stat-orange">
              <div className="bento-stat-icon">🤖</div>
              <div className="bento-stat-number">%94</div>
              <div className="bento-stat-label">Doğruluk Oranı</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ BENTO FEATURE CARDS ═══════════ */}
      <section className="bento-features-section">
        <div className="bento-grid">
          {/* Large card - AI Dashboard */}
          <div className="bento-card bento-card-large bento-card-indigo">
            <div className="bento-card-glow" />
            <div className="bento-card-content">
              <div className="bento-card-tag">🚀 YENİ</div>
              <h2 className="bento-card-title">Canlı AI Test Paneli</h2>
              <p className="bento-card-text">Gerçek Trendyol URL'sini yapıştır, yapay zekamız saniyeler içinde tam istihbarat raporu üretsin.</p>
              <Link href="/test_trendyol.html" className="bento-cta-btn bento-cta-primary">
                Paneli Aç →
              </Link>
            </div>
            <div className="bento-card-visual">
              <div className="mini-dashboard">
                <div className="mini-row"><span className="mini-dot green" />Güven Skoru: %87</div>
                <div className="mini-row"><span className="mini-dot red" />Sahte Yorum: %23</div>
                <div className="mini-row"><span className="mini-dot blue" />Karar: AL ✓</div>
                <div className="mini-bar-wrap"><div className="mini-bar" style={{ width: '87%', background: 'linear-gradient(90deg, #4ade80, #22c55e)' }} /></div>
              </div>
            </div>
          </div>

          {/* Tall card - Fake Discount */}
          <div className="bento-card bento-card-tall bento-card-red">
            <div className="bento-card-glow" style={{ background: 'rgba(239,68,68,0.15)' }} />
            <div className="bento-card-content">
              <div className="bento-card-tag" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>🛡️ KORUMA</div>
              <h2 className="bento-card-title">Sahte İndirim Dedektörü</h2>
              <p className="bento-card-text">Satıcının fiyatı şişirip sonra "indirim" yaptığını anında yakalarız.</p>
              <div className="bento-fake-example">
                <div className="fake-old">Eski Fiyat: <s>₺12.500</s></div>
                <div className="fake-new">Şişirilmiş: ₺15.000 → ₺12.000</div>
                <div className="fake-verdict">⚠️ SAHTE İNDİRİM</div>
              </div>
            </div>
          </div>

          {/* Small card - Trust Score */}
          <div className="bento-card bento-card-small bento-card-green">
            <div className="bento-card-glow" style={{ background: 'rgba(74,222,128,0.1)' }} />
            <div className="bento-card-content">
              <div className="bento-card-tag" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)' }}>🛡️</div>
              <h2 className="bento-card-title" style={{ fontSize: '18px' }}>Güven Skoru</h2>
              <div className="bento-score-circle">
                <svg viewBox="0 0 80 80" width="80" height="80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(74,222,128,0.2)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#4ade80" strokeWidth="8"
                    strokeDasharray="201" strokeDashoffset="50" strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
                  <text x="40" y="45" textAnchor="middle" fill="#4ade80" fontSize="18" fontWeight="800">75</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Small card - Price Prediction */}
          <div className="bento-card bento-card-small bento-card-yellow">
            <div className="bento-card-glow" style={{ background: 'rgba(250,204,21,0.08)' }} />
            <div className="bento-card-content">
              <div className="bento-card-tag" style={{ color: '#facc15', background: 'rgba(250,204,21,0.1)' }}>📈</div>
              <h2 className="bento-card-title" style={{ fontSize: '18px' }}>14 Günlük Tahmin</h2>
              <p className="bento-card-text" style={{ fontSize: '12px' }}>AI modeli fiyat düşüşünü önceden tespit eder.</p>
              <div style={{ color: '#facc15', fontSize: '22px', fontWeight: '900', marginTop: '8px' }}>-5.2%</div>
            </div>
          </div>

          {/* Extension download card - wide */}
          <div className="bento-card bento-card-wide bento-card-dark">
            <div className="bento-card-glow" style={{ background: 'rgba(99,102,241,0.08)' }} />
            <div className="bento-extension-layout">
              <div>
                <div className="bento-card-tag" style={{ color: '#818cf8', background: 'rgba(99,102,241,0.1)' }}>🔌 TARAYıCı EKLENTİSİ</div>
                <h2 className="bento-card-title">Chrome'da Gezinirken de Koruma Altında</h2>
                <p className="bento-card-text">Trendyol'da bir ürüne baktığınız anda, yapay zekamız sağ köşede "Bu İndirim Gerçek mi?" sorusunun cevabını gösterir.</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <Link href="/extension-kurulum" className="bento-cta-btn bento-cta-primary">
                    <span style={{ fontSize: '18px' }}>🔌</span> Chrome'a Ekle
                  </Link>
                  <button className="bento-cta-btn bento-cta-ghost" onClick={() => alert('Eklenti çok yakında yayınlanıyor! 🔌')}>
                    Nasıl Çalışır?
                  </button>
                </div>
              </div>
              <div className="bento-extension-preview">
                <div className="ext-popup">
                  <div className="ext-header">🔍 FiyatTakip AI</div>
                  <div className="ext-body">
                    <div className="ext-row"><span>İndirim:</span> <span style={{ color: '#f87171' }}>SAHTE ⚠️</span></div>
                    <div className="ext-row"><span>Gerçek Fiyat:</span> <span style={{ color: '#4ade80' }}>₺8.299</span></div>
                    <div className="ext-row"><span>Güven:</span> <span style={{ color: '#60a5fa' }}>%61</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ VERIFIED DISCOUNTS ═══════════ */}
      <div style={{ marginTop: '60px' }}>
        <VerifiedDiscounts />
      </div>

      {/* ═══════════ SEARCH & FILTERS ═══════════ */}
      <div style={{ marginTop: '40px' }}>
        <AdvancedSearch onSearch={handleSearch} products={products} />
      </div>



      <CategoryNav onCategoryChange={handleCategoryChange} selectedCategory={selectedCategory} />

      <AdvancedFilters onFilterChange={handleFilterChange} />

      <FeaturedProducts />

      <ProductList refreshKey={refreshKey} category={selectedCategory} filters={filters} onProductsLoaded={setProducts} />
    </div>
  );
}
