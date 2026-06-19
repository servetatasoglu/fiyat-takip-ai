'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  AnnotationController,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const RANGES = [
  { label: '7G', days: 7 },
  { label: '30G', days: 30 },
  { label: '90G', days: 90 },
  { label: 'Tümü', days: 0 },
];

const COLORS = {
  trendyol: '#f97316',
  hepsiburada: '#a855f7',
  amazon: '#facc15',
};

export default function PriceChart({ sources }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [selectedRange, setSelectedRange] = useState(30);

  // Compute filtered data based on range
  const { labels, datasets, allTimeLow, isAllTimeLow } = useMemo(() => {
    if (!sources || sources.length === 0) return { labels: [], datasets: [], allTimeLow: null, isAllTimeLow: false };

    const cutoff = selectedRange > 0
      ? new Date(Date.now() - selectedRange * 24 * 60 * 60 * 1000)
      : new Date(0);

    // Build unified sorted date labels
    const dateSet = new Set();
    sources.forEach(s => {
      (s.prices || []).forEach(p => {
        const d = new Date(p.createdAt);
        if (d >= cutoff) {
          dateSet.add(new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }));
        }
      });
    });

    // Sort by actual date value
    const allPoints = [];
    sources.forEach(s => {
      (s.prices || []).forEach(p => {
        const d = new Date(p.createdAt);
        if (d >= cutoff) allPoints.push(d);
      });
    });
    allPoints.sort((a, b) => a - b);

    // Deduplicate labels in time order
    const seenLabels = new Set();
    const labels = [];
    allPoints.forEach(d => {
      const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      if (!seenLabels.has(label)) {
        seenLabels.add(label);
        labels.push(label);
      }
    });

    // Compute all-time low across ALL history (not just selected range)
    let globalMin = null;
    sources.forEach(s => {
      (s.prices || []).forEach(p => {
        if (globalMin === null || p.price < globalMin) globalMin = p.price;
      });
    });

    // Current cheapest price
    let currentMin = null;
    sources.forEach(s => {
      const latestPrice = s.prices?.[s.prices.length - 1]?.price;
      if (latestPrice && (currentMin === null || latestPrice < currentMin)) currentMin = latestPrice;
    });

    const isAllTimeLow = globalMin !== null && currentMin !== null && currentMin <= globalMin;

    const datasets = sources.map(source => {
      const filteredPrices = (source.prices || []).filter(p => new Date(p.createdAt) >= cutoff);
      const data = labels.map(label => {
        const priceObj = filteredPrices.find(p =>
          new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) === label
        );
        return priceObj ? priceObj.price : null;
      });

      const color = COLORS[source.platform] || '#60a5fa';
      return {
        label: source.platform.charAt(0).toUpperCase() + source.platform.slice(1),
        data,
        borderColor: color,
        backgroundColor: `${color}15`,
        borderWidth: 2.5,
        pointBackgroundColor: color,
        pointRadius: data.length <= 14 ? 5 : 3,
        pointHoverRadius: 8,
        tension: 0.4,
        spanGaps: true,
        fill: sources.length === 1,
      };
    });

    return { labels, datasets, allTimeLow: globalMin, isAllTimeLow };
  }, [sources, selectedRange]);

  useEffect(() => {
    if (!chartRef.current || labels.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 400, easing: 'easeInOutQuart' },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: { size: 12, weight: '600' },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.97)',
            titleColor: '#94a3b8',
            bodyColor: '#f1f5f9',
            borderColor: 'rgba(148,163,184,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${new Intl.NumberFormat('tr-TR', {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
              }).format(ctx.parsed.y)} TL`,
            },
          },
          annotation: allTimeLow ? {
            annotations: {
              allTimeLowLine: {
                type: 'line',
                yMin: allTimeLow,
                yMax: allTimeLow,
                borderColor: 'rgba(34,197,94,0.5)',
                borderWidth: 1.5,
                borderDash: [6, 4],
                label: {
                  content: `🏆 En düşük: ${new Intl.NumberFormat('tr-TR').format(allTimeLow)} TL`,
                  display: true,
                  position: 'start',
                  color: '#22c55e',
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  borderRadius: 4,
                  padding: { x: 8, y: 4 },
                  font: { size: 11, weight: '700' },
                },
              },
            },
          } : {},
        },
        scales: {
          x: {
            ticks: { color: '#64748b', maxTicksLimit: 8, font: { size: 11 } },
            grid: { color: 'rgba(148, 163, 184, 0.05)' },
          },
          y: {
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              callback: v => new Intl.NumberFormat('tr-TR').format(v) + ' TL',
            },
            grid: { color: 'rgba(148, 163, 184, 0.05)' },
          },
        },
      },
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [labels, datasets, allTimeLow]);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="dashboard-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0 }}>📈 Fiyat Geçmişi</h3>
          {isAllTimeLow && (
            <span style={{
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(34,197,94,0.3)',
              animation: 'pulse 2s infinite',
            }}>
              🏆 TÜM ZAMANLARIN EN DÜŞÜĞÜ!
            </span>
          )}
        </div>

        {/* Range Selector */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-800)', borderRadius: '10px', padding: '4px' }}>
          {RANGES.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => setSelectedRange(days)}
              style={{
                padding: '5px 14px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedRange === days ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)' : 'transparent',
                color: selectedRange === days ? '#fff' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {labels.length === 0 ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Bu dönem için fiyat verisi yok
        </div>
      ) : (
        <div style={{ position: 'relative', height: '300px', width: '100%' }}>
          <canvas ref={chartRef} />
        </div>
      )}

      {/* Stats row */}
      {allTimeLow && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: 'var(--gray-800)', borderRadius: '8px', padding: '10px 14px', minWidth: '120px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tüm Zamanlar En Düşük</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#22c55e' }}>
              {new Intl.NumberFormat('tr-TR').format(allTimeLow)} TL
            </div>
          </div>
          {sources.map(s => {
            const latest = s.prices?.[s.prices.length - 1]?.price;
            if (!latest) return null;
            return (
              <div key={s.platform} style={{ flex: 1, background: 'var(--gray-800)', borderRadius: '8px', padding: '10px 14px', minWidth: '120px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {s.platform === 'trendyol' ? '🟠' : s.platform === 'hepsiburada' ? '🟣' : '🟡'} {s.platform}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: COLORS[s.platform] || 'var(--text-primary)' }}>
                  {new Intl.NumberFormat('tr-TR').format(latest)} TL
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
