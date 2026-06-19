'use client';

export default function SellerComparison({ sellers }) {
  if (!sellers || !Array.isArray(sellers) || sellers.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Satıcı karşılaştırma bilgisi bulunamadı.
      </div>
    );
  }

  const bestSeller = sellers.reduce((best, current) => 
    (current.trustScore > best.trustScore) ? current : best, sellers[0]
  );

  return (
    <div className="seller-comparison-container">
      <h3>🏪 Satıcı Karşılaştırma</h3>
      <div className="seller-cards">
        {sellers.map((seller, index) => (
          <div 
            key={index} 
            className={`seller-card ${seller.id === bestSeller.id ? 'best-choice' : ''}`}
          >
            {seller.id === bestSeller.id && (
              <div className="best-choice-badge">En İyi Seçim</div>
            )}
            <div className="seller-name">{seller.name}</div>
            <div className="seller-metrics">
              <div className="seller-metric">
                <span className="seller-metric-label">Güven</span>
                <span className="seller-metric-value" style={{ color: seller.trustScore >= 80 ? 'var(--green-400)' : seller.trustScore >= 50 ? 'var(--yellow-400)' : 'var(--red-400)' }}>
                  %{seller.trustScore}
                </span>
              </div>
              <div className="seller-metric">
                <span className="seller-metric-label">Fiyat</span>
                <span className="seller-metric-value">{seller.price} TL</span>
              </div>
              <div className="seller-metric">
                <span className="seller-metric-label">Platform</span>
                <span className="seller-metric-value">{seller.platform}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
