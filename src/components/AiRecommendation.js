'use client';

export default function AiRecommendation({ analysis }) {
  if (!analysis) return null;

  const { decision, reasoning, riskLevel, reviewSummary } = analysis;

  const decisionMap = {
    'BUY': '✅ AL',
    'WAIT': '⏳ BEKLE',
    'AVOID': '⚠️ KAÇIN'
  };

  const cssClassMap = {
    'BUY': 'al',
    'WAIT': 'bekle',
    'AVOID': 'kacin'
  };

  const decisionClass = cssClassMap[decision] || 'bekle';

  return (
    <div className="dashboard-panel" style={{ textAlign: 'center' }}>
      <h3>🤖 FiyatZeka Kararı</h3>
      
      <div className={`ai-decision ${decisionClass}`}>
        {decisionMap[decision] || '⏳ BEKLE'}
      </div>

      <div className="ai-reasoning">
        {reasoning}
      </div>
      
      {reviewSummary && (
        <div className="ai-summary">
          <strong>Yorum Özeti:</strong> {reviewSummary}
        </div>
      )}

      {analysis.alternatives && analysis.alternatives.length > 0 && (
        <div className="ai-alternatives" style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
          <h4 style={{ color: 'var(--blue-400)', marginBottom: '10px' }}>💡 Daha Uygun Alternatifler Bulundu!</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px' }}>
            {analysis.alternatives.map((alt) => (
              <li key={alt.id} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <a href={`/urun/${alt.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                  {alt.name.substring(0, 35)}...
                </a>
                <strong style={{ color: 'var(--green-400)' }}>{alt.price.toLocaleString('tr-TR')} TL</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
