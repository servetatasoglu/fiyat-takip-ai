/**
 * Product Matching Engine
 * Uses normalization, Jaccard token similarity, and Levenshtein distance 
 * to determine if two product listings represent the same canonical product.
 */

// Simple Levenshtein distance
function levenshtein(s1, s2) {
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion/deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

const STOP_WORDS = new Set([
  've', 'ile', 'için', 'bir', 'bu', 'da', 'de', 'ise', 'olan', 'olarak',
  'telefon', 'akıllı', 'orijinal', 'garantili', 'distribütör', 'türkiye',
  'uyumlu', 'modeli'
]);

export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    // Remove Turkish chars slightly for matching
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    // Remove punctuation
    .replace(/[^\w\s-]/g, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => !STOP_WORDS.has(word) && word.length > 1)
    .join(' ');
}

function tokenize(text) {
  return new Set(text.split(' '));
}

function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Compares a new listing title with an existing canonical name or another listing.
 * Returns a confidence score between 0 and 100.
 */
export function calculateMatchScore(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  const tokens1 = tokenize(norm1);
  const tokens2 = tokenize(norm2);

  // 1. Jaccard Token Similarity (0 to 1)
  const tokenSim = jaccardSimilarity(tokens1, tokens2);

  // 2. Levenshtein String Similarity (0 to 1)
  const dist = levenshtein(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  const stringSim = maxLen === 0 ? 1 : 1 - (dist / maxLen);

  // Combine scores: tokens are more important for variants (like "128GB" vs "256GB")
  // because Levenshtein distance between them is small, but token set differs completely on key terms.
  
  // Weighting: 60% Token, 40% String
  let combinedScore = (tokenSim * 0.6) + (stringSim * 0.4);

  return Math.round(combinedScore * 100);
}

/**
 * Attempts to find the best matching MatchGroup for a given product title.
 * Returns { matchGroupId, confidenceScore } or null if no good match.
 */
export async function findBestMatchGroup(prisma, title) {
  const allGroups = await prisma.matchGroup.findMany({
    select: { id: true, canonicalName: true }
  });

  let bestMatch = null;
  let highestScore = 0;

  for (const group of allGroups) {
    const score = calculateMatchScore(title, group.canonicalName);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = group;
    }
  }

  // Thresholds:
  // > 80: High confidence auto-match
  // 60-80: Tentative match (manual review later, but we will group it for MVP logic)
  if (highestScore >= 65 && bestMatch) {
    return {
      matchGroupId: bestMatch.id,
      confidenceScore: highestScore
    };
  }

  return null;
}

/**
 * Finds cheaper alternatives (arbitrage) that are similar to the given title.
 * For example, if searching "iPhone 15 Pro Max 256GB Mavi", it might find "iPhone 15 Pro Max 256GB Siyah" if it's cheaper.
 */
export async function findCheaperAlternatives(prisma, title, currentPrice) {
  const allGroups = await prisma.matchGroup.findMany({
    select: { id: true, canonicalName: true, aiAnalysis: true }
  });

  const alternatives = [];
  const baseTokens = tokenize(normalizeTitle(title));

  for (const group of allGroups) {
    // We want SIMILAR products, not EXACT matches. So token similarity between 0.3 and 0.8
    // Or exact matches that are just cheaper variants
    const targetTokens = tokenize(normalizeTitle(group.canonicalName));
    const tokenSim = jaccardSimilarity(baseTokens, targetTokens);
    
    // If it's somewhat similar (e.g. same brand and model but different color/storage)
    if (tokenSim >= 0.3 && tokenSim < 0.99) {
      if (group.aiAnalysis && group.aiAnalysis.marketValue && group.aiAnalysis.marketValue < currentPrice) {
        alternatives.push({
          id: group.id,
          name: group.canonicalName,
          price: group.aiAnalysis.marketValue,
          similarity: tokenSim
        });
      }
    }
  }

  // Sort by similarity descending, then price ascending
  alternatives.sort((a, b) => b.similarity - a.similarity || a.price - b.price);
  
  return alternatives.slice(0, 3); // Top 3 alternatives
}
