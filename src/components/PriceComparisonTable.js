'use client';

const PLATFORM_SHIPPING = {
  trendyol: { free: true, freeThreshold: 150, cost: 29.99 },
  hepsiburada: { free: false, freeThreshold: 300, cost: 39.99 },
  amazon: { free: true, freeThreshold: 0, cost: 0 },
};

export default function PriceComparisonTable({ sources }) {
  const fmt = (price) => {
    if (price == null) return '—';
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Compute effective shipping cost per source
  const sourcesWithShipping = sources.map(s => {
    const platformInfo = PLATFORM_SHIPPING[s.platform?.toLowerCase()] || { free: false, freeThreshold: 0, cost: 29.99 };
    let shippingCost = s.shippingCost;

    // If not scraped, use platform default
    if (shippingCost == null) {
      if (platformInfo.free && (platformInfo.freeThreshold === 0 || s.currentPrice >= platformInfo.freeThreshold)) {
        shippingCost = 0;
      } else {
        shippingCost = platformInfo.cost;
      }
    }

    const totalCost = s.currentPrice ? s.currentPrice + shippingCost : null;
    return { ...s, effectiveShipping: shippingCost, totalCost };
  });

  // Find cheapest by total cost
  let cheapestId = null;
  let minTotal = Infinity;
  sourcesWithShipping.forEach(s => {
    if (s.totalCost && s.totalCost < minTotal) { minTotal = s.totalCost; cheapestId = s.id; }
  });

  const PLATFORM_ICON = { trendyol: '🟠', hepsiburada: '🟣', amazon: '🟡' };

  const buildAffiliateUrl = (s) =>
    `/api/redirect?url=${encodeURIComponent(s.url)}&platform=${s.platform}&pid=${s.id}`;

  return (
    <div className="dashboard-panel" style={{ overflowX: 'auto' }}>
      <h3>🏷️ Platform Fiyatları <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '8px' }}>Kargo dahil toplam maliyet</span></h3>
      <table className="price-table">
        <thead>
          <tr>
            <th>Platform</th>
            <th>Ürün Fiyatı</th>
            <th>Kargo</th>
            <th style={{ color: 'var(--blue-400)' }}>Toplam Maliyet</th>
            <th>Durum</th>
            <th>Son Güncelleme</th>
            <th>Satın Al</th>
          </tr>
        </thead>
        <tbody>
          {sourcesWithShipping.map(source => {
            const isCheapest = source.id === cheapestId;
            const discountPct = source.oldPrice && source.currentPrice
              ? Math.round((1 - source.currentPrice / source.oldPrice) * 100)
              : null;

            return (
              <tr key={source.id} style={{ background: isCheapest ? 'rgba(34,197,94,0.04)' : 'transparent' }}>
                <td className="table-platform">
                  <span style={{ fontSize: '16px' }}>{PLATFORM_ICON[source.platform] || '⚪'}</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{source.platform}</span>
                </td>
                <td>
                  <span className="table-price">{fmt(source.currentPrice)} TL</span>
                  {source.oldPrice && (
                    <span className="table-old-price">{fmt(source.oldPrice)} TL</span>
                  )}
                  {discountPct > 0 && (
                    <span style={{ marginLeft: '6px', background: 'rgba(239,68,68,0.15)', color: 'var(--red-400)', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                      -%{discountPct}
                    </span>
                  )}
                </td>
                <td>
                  {source.effectiveShipping === 0 ? (
                    <span style={{ color: 'var(--green-400)', fontWeight: '700', fontSize: '12px' }}>✓ Bedava</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{fmt(source.effectiveShipping)} TL</span>
                  )}
                </td>
                <td>
                  <span style={{
                    fontWeight: '800',
                    fontSize: '15px',
                    color: isCheapest ? 'var(--green-400)' : 'var(--text-primary)',
                  }}>
                    {fmt(source.totalCost)} TL
                  </span>
                </td>
                <td>
                  {isCheapest ? (
                    <span className="table-cheapest">🏆 En Ucuz</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                  )}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {formatDate(source.prices?.[source.prices.length - 1]?.createdAt)}
                </td>
                <td>
                  <a
                    href={buildAffiliateUrl(source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      background: isCheapest ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${isCheapest ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.2)'}`,
                      borderRadius: '6px',
                      color: isCheapest ? 'var(--green-400)' : 'var(--blue-400)',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Git ↗
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Shipping disclaimer */}
      <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        * Kargo ücretleri platform varsayılan değerleri ile hesaplanmıştır. Gerçek tutar sipariş adresine göre değişebilir.
      </div>
    </div>
  );
}
