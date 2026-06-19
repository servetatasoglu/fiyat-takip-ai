/**
 * Discount Analysis Engine
 * Analyzes price history to determine real discounts and detect artificial inflation.
 */

export function analyzeDiscount(prices) {
  if (!prices || prices.length === 0) {
    return {
      isReal: false,
      percent: 0,
      verdict: 'normal',
      inflationDetected: false,
      average30Days: null,
      currentPrice: null
    };
  }

  // Sort prices by date ascending
  const sortedPrices = [...prices].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const currentPrice = sortedPrices[sortedPrices.length - 1].price;
  
  if (sortedPrices.length === 1) {
    return {
      isReal: false,
      percent: 0,
      verdict: 'normal', // Not enough history
      inflationDetected: false,
      average30Days: currentPrice,
      currentPrice
    };
  }

  // Calculate 30-day average
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const last30DaysPrices = sortedPrices.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).map(p => p.price);
  
  // If we don't have prices in last 30 days (rare, but possible), fallback to all prices
  const relevantPrices = last30DaysPrices.length > 0 ? last30DaysPrices : sortedPrices.map(p => p.price);
  
  const average30Days = relevantPrices.reduce((sum, p) => sum + p, 0) / relevantPrices.length;

  // Detect artificial inflation: Did the price jump more than 15% right before this discount?
  let inflationDetected = false;
  if (sortedPrices.length >= 3) {
    // Check if there was a spike then drop
    for (let i = sortedPrices.length - 2; i >= 1; i--) {
      const prevPrice = sortedPrices[i-1].price;
      const spikePrice = sortedPrices[i].price;
      const currPrice = sortedPrices[sortedPrices.length - 1].price;
      
      // If price spiked > 15% and then dropped, it's likely fake inflation
      if (spikePrice > prevPrice * 1.15 && currPrice < spikePrice) {
         // Also check if current price is actually higher or equal to the pre-spike price
         if (currPrice >= prevPrice * 0.95) {
            inflationDetected = true;
            break;
         }
      }
    }
  }

  const isReal = currentPrice < average30Days * 0.95 && !inflationDetected; // Must be at least 5% cheaper than average
  const percent = ((average30Days - currentPrice) / average30Days) * 100;
  
  let verdict = 'normal';
  if (isReal) {
    verdict = 'real_discount';
  } else if (inflationDetected || (currentPrice < sortedPrices[sortedPrices.length - 2].price && currentPrice >= average30Days)) {
    // It's a "discount" from yesterday, but higher than average -> fake discount
    verdict = 'fake_discount';
  }

  return {
    isReal,
    percent: Math.round(percent * 100) / 100,
    verdict,
    inflationDetected,
    average30Days: Math.round(average30Days * 100) / 100,
    currentPrice
  };
}
