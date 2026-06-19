'use client';

export default function TechSpecsComparison({ specs }) {
  if (!specs || typeof specs !== 'object' || Object.keys(specs).length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Teknik özellik bilgisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="tech-specs-container">
      <h3>📋 Teknik Özellikler</h3>
      <table className="tech-specs-table">
        <tbody>
          {Object.entries(specs).map(([key, value]) => (
            <tr key={key}>
              <td className="spec-key">{key}</td>
              <td className="spec-value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
