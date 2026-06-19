'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow" />
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div className="logo-icon" style={{ width: '32px', height: '32px', fontSize: '16px' }}>📉</div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9' }}>Fiyat<span style={{ color: '#818cf8' }}>Takip</span></span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, maxWidth: '280px' }}>
              Türkiye'nin en gelişmiş yapay zeka destekli fiyat karşılaştırma ve sahte indirim tespit platformu.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-link" title="Twitter/X">𝕏</a>
              <a href="#" className="social-link" title="Instagram">📷</a>
              <a href="#" className="social-link" title="Telegram">✈️</a>
              <a href="#" className="social-link" title="YouTube">▶️</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Platform</h4>
            <Link href="/" className="footer-link">Anasayfa</Link>
            <Link href="/aktuel" className="footer-link">Aktüel Ürünler</Link>
            <Link href="/firsatlar" className="footer-link">En İyi Fırsatlar</Link>
            <Link href="/compare" className="footer-link">Karşılaştır</Link>
            <Link href="/alerts" className="footer-link">Fiyat Alarmları</Link>
          </div>

          {/* Tools */}
          <div className="footer-col">
            <h4 className="footer-col-title">Araçlar</h4>
            <Link href="/test_trendyol.html" className="footer-link">AI Test Paneli</Link>
            <Link href="/premium" className="footer-link">Premium Üyelik</Link>
            <Link href="/extension-kurulum" className="footer-link">Chrome Eklentisi</Link>
            <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); alert('Telegram bot çok yakında! 🤖'); }}>Telegram Bot</a>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">Yasal</h4>
            <Link href="/hakkimizda" className="footer-link">Hakkımızda</Link>
            <Link href="/gizlilik" className="footer-link">Gizlilik Politikası</Link>
            <Link href="/kullanim-kosullari" className="footer-link">Kullanım Koşulları</Link>
            <Link href="/iletisim" className="footer-link">İletişim</Link>
          </div>

          {/* Newsletter */}
          <div className="footer-col">
            <h4 className="footer-col-title">Bülten</h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: 1.6 }}>
              Haftalık fırsat raporları ve yapay zeka analizleri e-postanıza gelsin.
            </p>
            <form className="footer-newsletter" onSubmit={(e) => { e.preventDefault(); alert('Bülten kaydınız alındı! 📧'); }}>
              <input type="email" placeholder="E-posta adresiniz" required />
              <button type="submit">→</button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FiyatTakip AI. Tüm hakları saklıdır.</span>
          <span className="footer-made">Yapay Zeka ile Güçlendirilmiştir 🤖</span>
        </div>
      </div>
    </footer>
  );
}
