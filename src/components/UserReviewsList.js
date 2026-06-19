'use client';

import ProductRating from './ProductRating';

export default function UserReviewsList({ reviews }) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Henüz yorum yok.
      </div>
    );
  }

  return (
    <div className="reviews-list">
      {reviews.map((review, index) => {
        if (!review) return null;
        return (
          <div key={index} className={`review-item ${review.isFake ? 'fake' : ''}`}>
            <div className="review-header">
              <div>
                <span className="review-author">{review.author || 'Anonim'}</span>
                {review.isFake && <span className="fake-badge">Şüpheli</span>}
              </div>
              <span className="review-date">
                {review.date ? new Date(review.date).toLocaleDateString('tr-TR') : ''}
              </span>
            </div>
            
            {review.rating && review.rating > 0 && !isNaN(review.rating) && (
              <div className="review-rating">
                <ProductRating rating={review.rating} />
              </div>
            )}
            
            <p className="review-text">{review.text || ''}</p>
          </div>
        );
      })}
    </div>
  );
}
