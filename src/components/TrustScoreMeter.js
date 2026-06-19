'use client';

import { useEffect, useState } from 'react';

export default function TrustScoreMeter({ score }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate to the score
    const timer = setTimeout(() => setProgress(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let colorClass = 'score-low';
  let label = 'DÜŞÜK';
  if (score >= 70) {
    colorClass = 'score-high';
    label = 'YÜKSEK';
  } else if (score >= 40) {
    colorClass = 'score-medium';
    label = 'ORTA';
  }

  return (
    <div className="trust-meter-container">
      <div className="trust-meter">
        <svg className="trust-meter-svg" viewBox="0 0 140 140">
          <circle
            className="trust-meter-bg"
            cx="70"
            cy="70"
            r={radius}
          />
          <circle
            className={`trust-meter-progress ${colorClass}`}
            cx="70"
            cy="70"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="trust-meter-text">
          <div className={`trust-meter-value ${colorClass}`}>{progress}</div>
        </div>
      </div>
      <div className="trust-meter-label">
        GÜVEN SKORU: <span className={colorClass}>{label}</span>
      </div>
    </div>
  );
}
