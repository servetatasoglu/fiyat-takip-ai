'use client';

export default function ReviewBreakdown({ analysis }) {
  if (!analysis) return null;

  const { realPercent, fakePercent, flags } = analysis;

  return (
    <div className="review-breakdown">
      <div className="review-stats">
        <span className="review-stats-real">Organik (%{realPercent})</span>
        <span className="review-stats-fake">Şüpheli/Sahte (%{fakePercent})</span>
      </div>
      
      <div className="review-bar-container">
        <div 
          className="review-bar-real" 
          style={{ width: `${realPercent}%` }}
        />
        <div 
          className="review-bar-fake" 
          style={{ width: `${fakePercent}%` }}
        />
      </div>

      {flags && flags.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            🚩 Tespit Edilen Riskler:
          </div>
          <div className="review-flags">
            {flags.map((flag, i) => (
              <div key={i} className="review-flag">
                {flag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
