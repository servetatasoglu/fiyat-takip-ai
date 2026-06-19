export default function DiscountBadge({ isRealDiscount, discountPercent }) {
  if (isRealDiscount) {
    return (
      <div className="discount-badge real">
        <span className="icon">✅</span>
        <span>Gerçek İndirim</span>
        <span className="percent">(%{Math.abs(discountPercent).toFixed(1)} daha ucuz)</span>
      </div>
    );
  }

  return (
    <div className="discount-badge fake">
      <span className="icon">⚠️</span>
      <span>Gerçek İndirim Değil</span>
      {discountPercent < 0 && (
        <span className="percent">(%{Math.abs(discountPercent).toFixed(1)} daha pahalı)</span>
      )}
    </div>
  );
}
