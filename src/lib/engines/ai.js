/**
 * AI Decision Layer
 * Acts as a Kantitatif Finans Analisti (Quantitative Financial Analyst).
 */

export async function generateRecommendation(canonicalName, currentPrice, allPrices, discountData, reviewData) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    return await generateOpenAIRecommendation(apiKey, canonicalName, currentPrice, allPrices, discountData, reviewData);
  } else {
    return generateLocalRecommendation(canonicalName, currentPrice, allPrices, discountData, reviewData);
  }
}

function calculateMarketValue(prices) {
  if (prices.length === 0) return 0;
  // Simple moving average for market value
  const sum = prices.reduce((a, b) => a + b.price, 0);
  return sum / prices.length;
}

function calculateVolatility(prices) {
  if (prices.length < 2) return { percent: 0, level: 'Sabit' };
  
  const values = prices.map(p => p.price);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const volatilityPercent = mean === 0 ? 0 : (stdDev / mean) * 100;
  
  let level = 'Düşük';
  if (volatilityPercent >= 5) level = 'Yüksek';
  else if (volatilityPercent >= 2) level = 'Orta';
  else if (volatilityPercent === 0) level = 'Sabit';
  
  return {
    percent: Math.round(volatilityPercent * 100) / 100,
    level,
    changesCount: prices.length
  };
}

function generateLocalRecommendation(canonicalName, currentPrice, allPrices, discountData, reviewData) {
  let decision = 'WAIT';
  const riskFactors = [];
  const marketValue = calculateMarketValue(allPrices);
  let reasoning = '';

  const { isReal, verdict, inflationDetected, percent } = discountData;
  const { trustScore, fakePercent, flags } = reviewData;

  // CLV (Customer Lifetime Value) / True Value proxy logic
  const isUndervalued = currentPrice < (marketValue * 0.95);
  const isOvervalued = currentPrice > (marketValue * 1.05);

  if (inflationDetected) {
    riskFactors.push('Suni fiyat şişirme tespit edildi (Fake Inflation)');
  }
  if (verdict === 'fake_discount') {
    riskFactors.push('İndirim oranı piyasa ortalamasını yansıtmıyor');
  }
  if (trustScore < 50) {
    riskFactors.push('Satıcı/Yorum güvenilirliği çok düşük');
  }
  if (fakePercent > 30) {
    riskFactors.push(`%${fakePercent} oranında manipülatif/bot yorum riski`);
  }
  flags.forEach(f => riskFactors.push(f));

  // Volatility Analysis
  const volatility = calculateVolatility(allPrices);
  if (volatility.level === 'Yüksek') {
    riskFactors.push(`Yüksek Fiyat Dalgalanması (Volatilite: %${volatility.percent})`);
  }

  // Analyst Decision Tree
  if (riskFactors.length >= 2 || verdict === 'fake_discount' || inflationDetected) {
    decision = 'AVOID';
    reasoning = 'Piyasa analizi sonucunda, bu fiyatlama yapısının yapay olduğu ve risk/getiri oranının tüketici aleyhine olduğu tespit edilmiştir. Alım yapmaktan kaçınılmalıdır.';
  } else if (isUndervalued && trustScore >= 75 && isReal) {
    decision = 'BUY';
    reasoning = `Ürün, tahmini piyasa değeri olan ${marketValue.toFixed(2)} TL'nin altında işlem görmektedir. Puan güvenilirliği yüksek, alım için uygun bir arbitraj / indirim penceresi mevcuttur.`;
  } else {
    decision = 'WAIT';
    if (volatility.level === 'Yüksek') {
      reasoning = `Ürünün fiyatı çok dalgalı (son dönemde ${volatility.changesCount} kez değişmiş). Acele edilmemeli, fiyatın düşmesi beklenmelidir.`;
    } else if (volatility.level === 'Sabit') {
      decision = 'BUY'; // If it's fair value and stable, might as well buy
      reasoning = 'Ürün fiyatı uzun süredir sabit ve piyasa değerine uygun. Yakın zamanda indirim beklenmiyor, alım yapılabilir.';
    } else if (isOvervalued) {
      reasoning = 'Mevcut fiyat piyasa ortalamasının üzerindedir. Fiyatın normalize olması beklenmelidir.';
    } else {
      reasoning = 'Şu anki fiyat piyasa değeriyle uyumludur ancak belirgin bir indirim fırsatı sunmamaktadır. Pozisyon korunmalı ve beklenmelidir.';
    }
  }

  return {
    decision,
    reasoning,
    riskFactors: [...new Set(riskFactors)], // Unique
    marketValue: Math.round(marketValue * 100) / 100
  };
}

async function generateOpenAIRecommendation(apiKey, canonicalName, currentPrice, allPrices, discountData, reviewData) {
  // Mock fetch for OpenAI to avoid actual dependency/cost in MVP
  // Output follows the exact strict analyst prompt requested.
  console.log('[AI] OPENAI_API_KEY found, but using local mock implementation.');
  return generateLocalRecommendation(canonicalName, currentPrice, allPrices, discountData, reviewData);
}
