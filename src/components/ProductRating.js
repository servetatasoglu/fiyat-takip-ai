'use client';

export default function ProductRating({ rating, reviewCount }) {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star full">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">★</span>);
    }

    return stars;
  };

  if (!rating || rating === 0 || isNaN(rating)) return null;

  return (
    <div className="product-rating">
      <div className="stars">{renderStars(rating)}</div>
      {reviewCount !== undefined && reviewCount !== null && reviewCount > 0 && (
        <span className="review-count">({reviewCount} yorum)</span>
      )}
    </div>
  );
}
