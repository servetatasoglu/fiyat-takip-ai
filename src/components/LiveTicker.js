'use client';

import { useState, useEffect } from 'react';

const mockActivities = [
  { id: 1, text: "🤖 2 dk önce Dyson V15'te %12 sahte indirim engellendi.", type: "alert" },
  { id: 2, text: "✨ Apple iPhone 15 için 43.500 TL gerçek indirim tespit edildi! (Al Kararı)", type: "success" },
  { id: 3, text: "🚨 Philips Airfryer satıcısında %45 sahte yorum oranı tespit edildi.", type: "warning" },
  { id: 4, text: "📉 Samsung 65\" TV fiyatı son 30 günün en düşük seviyesinde.", type: "success" },
  { id: 5, text: "⚠️ Hepsiburada'daki robot süpürge fiyatı piyasa ortalamasının %20 üzerinde.", type: "alert" }
];

export default function LiveTicker() {
  const [activities, setActivities] = useState(mockActivities);

  useEffect(() => {
    // In a real app, this could listen to a WebSocket or SSE for live updates.
    // We'll just rotate the array every 8 seconds to simulate live feed.
    const interval = setInterval(() => {
      setActivities(prev => {
        const newArr = [...prev];
        const first = newArr.shift();
        newArr.push(first);
        return newArr;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-ticker-container">
      <div className="ticker-label">
        <span className="pulse-dot"></span> CANLI AI AKIŞI
      </div>
      <div className="ticker-content-wrapper">
        <div key={activities[0].id} className={`ticker-item slide-up type-${activities[0].type}`}>
          {activities[0].text}
        </div>
      </div>

      <style jsx>{`
        .live-ticker-container {
          display: flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          padding: 8px 24px;
          color: #e2e8f0;
          font-size: 13px;
          overflow: hidden;
          position: sticky;
          top: 73px; /* Just below navbar */
          z-index: 90;
        }
        .ticker-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          color: #818cf8;
          letter-spacing: 1px;
          margin-right: 24px;
          flex-shrink: 0;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 10px #ef4444;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .ticker-content-wrapper {
          flex: 1;
          position: relative;
          height: 20px;
          overflow: hidden;
        }
        .ticker-item {
          position: absolute;
          width: 100%;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .type-success { color: #4ade80; }
        .type-warning { color: #facc15; }
        .type-alert { color: #f87171; }
        
        .slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .ticker-label { font-size: 10px; margin-right: 12px; }
          .ticker-item { font-size: 11px; }
        }
      `}</style>
    </div>
  );
}
