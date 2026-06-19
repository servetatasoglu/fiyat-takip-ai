/**
 * Review Intelligence Engine
 * Upgraded for velocity tracking, simple sentiment variance, and anomaly detection.
 */

function levenshtein(s1, s2) {
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[s2.length][s1.length];
}

const GENERIC_PRAISE_PATTERNS = [
  'çok güzel', 'harika', 'tavsiye ederim', 'iyi', 'güzel ürün',
  'hızlı kargo', 'teşekkürler', 'süper', 'mükemmel', 'sorunsuz geldi'
];

// Extremely basic AFINN-tr inspired sentiment words
const NEGATIVE_WORDS = new Set(['kötü', 'bozuk', 'kırık', 'iade', 'berbat', 'çalışmıyor', 'rezalet', 'sorun', 'hata', 'defolu']);

export function analyzeReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    return { fakePercent: 0, realPercent: 0, trustScore: 50, flags: ['Yeterli yorum yok'] };
  }

  let fakeCount = 0;
  const flags = new Set();
  const timeBuckets = {}; 
  let fiveStarCount = 0;
  let anonCount = 0;

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    let isFake = false;
    let text = review.text.toLowerCase().trim();

    if (review.author?.toLowerCase().includes('anonim')) {
      anonCount++;
    }

    if (text.length < 15) {
      isFake = true;
      flags.add('Kısa ve anlamsız yorum yığınları');
    }

    if (text.length < 30) {
      for (const pattern of GENERIC_PRAISE_PATTERNS) {
        if (text.includes(pattern)) {
          isFake = true;
          flags.add('Jenerik bot-benzeri övgüler');
          break;
        }
      }
    }

    if (review.rating === 5) fiveStarCount++;

    // Sentiment Variance: 5 star rating but contains strongly negative words
    if (review.rating >= 4) {
      const tokens = text.split(' ');
      const hasNegative = tokens.some(t => NEGATIVE_WORDS.has(t));
      if (hasNegative) {
        isFake = true;
        flags.add('Tutarsız Duygu (Yüksek puan ama negatif metin)');
      }
    }

    // Velocity / Density tracking
    if (review.date) {
      const dateKey = new Date(review.date).toISOString().slice(0, 10); // Group by day
      timeBuckets[dateKey] = (timeBuckets[dateKey] || 0) + 1;
    }

    // Repetitive text detection (sliding window)
    for (let j = Math.max(0, i - 4); j < i; j++) {
      const prevText = reviews[j].text.toLowerCase().trim();
      if (text.length > 20 && prevText.length > 20) {
        const distance = levenshtein(text, prevText);
        const maxLen = Math.max(text.length, prevText.length);
        const similarity = 1 - (distance / maxLen);
        if (similarity > 0.8) {
          isFake = true;
          flags.add('Tekrarlayan kopya yorumlar tespit edildi');
          break;
        }
      }
    }

    if (isFake) fakeCount++;
  }

  // Velocity anomaly
  let maxPerDay = 0;
  for (const date in timeBuckets) {
    if (timeBuckets[date] > maxPerDay) maxPerDay = timeBuckets[date];
  }
  // If a single day has > 30% of all reviews (and there are >10 reviews total)
  if (reviews.length >= 10 && maxPerDay > (reviews.length * 0.3)) {
    flags.add('Doğal olmayan yorum sıklığı (Belirli bir günde ani yorum artışı)');
    fakeCount += Math.floor(reviews.length * 0.1); // Add penalty
  }

  if (reviews.length >= 10 && (fiveStarCount / reviews.length) > 0.95) {
    flags.add('Şüpheli puan dağılımı (Neredeyse tümü 5 yıldız)');
  }
  
  if (reviews.length >= 10 && (anonCount / reviews.length) > 0.6) {
    flags.add('Aşırı "Anonim" kullanıcı yoğunluğu');
  }

  const fakePercent = Math.min(100, (fakeCount / reviews.length) * 100);
  const realPercent = 100 - fakePercent;
  
  let trustScore = 100 - fakePercent;
  if (flags.size > 2) trustScore -= 10;
  if (reviews.length < 5) trustScore -= 20;
  trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

  return {
    fakePercent: Math.round(fakePercent),
    realPercent: Math.round(realPercent),
    trustScore,
    flags: Array.from(flags)
  };
}
