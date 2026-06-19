export default function HakkimizdaPage() {
  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>
        <span style={{ marginRight: '10px' }}>🏢</span>Hakkımızda
      </h1>

      <div className="dashboard-panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#818cf8' }}>Misyonumuz</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '15px' }}>
          FiyatTakip, Türk tüketicilerini sahte indirimlerden ve manipülatif fiyatlandırma stratejilerinden korumak amacıyla kurulmuş, 
          yapay zeka destekli bir fiyat karşılaştırma ve istihbarat platformudur.
        </p>
      </div>

      <div className="dashboard-panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#818cf8' }}>Ne Yapıyoruz?</h2>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 2, fontSize: '14px', paddingLeft: '20px' }}>
          <li>Trendyol, Hepsiburada ve Amazon Türkiye'deki ürün fiyatlarını gerçek zamanlı takip ediyoruz.</li>
          <li>Yapay zeka ile sahte indirimleri, fiyat şişirme taktiklerini ve bot yorumları tespit ediyoruz.</li>
          <li>Her ürüne özel güven skoru ve "AL / BEKLE / KAÇIN" kararı sunuyoruz.</li>
          <li>14 günlük fiyat tahmin modeli ile en doğru zamanda alışveriş yapmanızı sağlıyoruz.</li>
        </ul>
      </div>

      <div className="dashboard-panel">
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#818cf8' }}>Rakamlarla Biz</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#4ade80' }}>12.847</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Analiz Edilen Ürün</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#f87171' }}>4.213</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Engellenen Sahte İndirim</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#818cf8' }}>%94</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Doğruluk Oranı</div>
          </div>
        </div>
      </div>
    </div>
  );
}
