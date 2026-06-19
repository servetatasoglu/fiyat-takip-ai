/**
 * Price prediction using linear regression on PriceHistory
 */

/**
 * Simple linear regression: y = mx + b
 * x = days from first point, y = price
 */
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  points.forEach(({ x, y }) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² — coefficient of determination (0-1, higher = better fit)
  const yMean = sumY / n;
  let ssTot = 0, ssRes = 0;
  points.forEach(({ x, y }) => {
    const predicted = slope * x + intercept;
    ssTot += (y - yMean) ** 2;
    ssRes += (y - predicted) ** 2;
  });
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

function calculateEMA(points, period = 3) {
  if (points.length < period) return null;
  const k = 2 / (period + 1);
  let ema = points[0].y;
  for (let i = 1; i < points.length; i++) {
    ema = (points[i].y * k) + (ema * (1 - k));
  }
  return ema;
}

/**
 * Predict price N days into the future using Linear Regression + EMA Momentum.
 * @param {Array<{price, createdAt}>} priceHistory - sorted ascending
 * @param {number} daysAhead - e.g. 7, 14, 30
 * @returns {{ predictedPrice, trend, confidence, daysAhead } | null}
 */
export function predictPrice(priceHistory, daysAhead = 14) {
  if (!priceHistory || priceHistory.length < 3) return null;

  // Sort ascending
  const sorted = [...priceHistory].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const origin = new Date(sorted[0].createdAt).getTime();

  const points = sorted.map(p => ({
    x: (new Date(p.createdAt).getTime() - origin) / (1000 * 60 * 60 * 24),
    y: p.price,
  }));

  const regression = linearRegression(points);
  if (!regression) return null;

  // EMA for short-term momentum
  const ema = calculateEMA(points, Math.min(5, points.length)) || sorted[sorted.length - 1].price;
  const currentPrice = sorted[sorted.length - 1].price;
  
  // Calculate momentum divergence
  const momentumRatio = ema / currentPrice; 
  
  const lastX = points[points.length - 1].x;
  const futureX = lastX + daysAhead;
  
  // Base linear prediction
  let predictedPrice = regression.slope * futureX + regression.intercept;
  
  // Apply EMA momentum weight
  if (momentumRatio > 1.05 && regression.slope < 0) {
    // Price is currently dropping linearly, but recent EMA is higher (recovering)
    predictedPrice = predictedPrice * 1.05;
  } else if (momentumRatio < 0.95 && regression.slope > 0) {
    // Price is rising linearly, but recent EMA is lower (cooling off)
    predictedPrice = predictedPrice * 0.95;
  }

  const changePercent = ((predictedPrice - currentPrice) / currentPrice) * 100;

  let trend = 'stable';
  if (changePercent < -3) trend = 'dropping';
  else if (changePercent > 3) trend = 'rising';

  // Confidence based on R² and data points
  const dataConfidence = Math.min(sorted.length / 10, 1); // more points = better
  let confidence = Math.round(regression.r2 * dataConfidence * 100);
  
  // If momentum directly opposes linear trend, drop confidence
  if ((changePercent > 0 && momentumRatio < 1) || (changePercent < 0 && momentumRatio > 1)) {
    confidence = Math.max(10, confidence - 20);
  }

  return {
    predictedPrice: Math.max(0, Math.round(predictedPrice)),
    currentPrice,
    changePercent: Math.round(changePercent * 10) / 10,
    trend,
    confidence: Math.min(95, Math.max(10, confidence)),
    daysAhead,
    slope: regression.slope,
  };
}
