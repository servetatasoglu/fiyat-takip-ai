// We will import platform specific scrapers here as we create them
// import TrendyolScraper from './trendyol.js';
// import HepsiburadaScraper from './hepsiburada.js';
// import AmazonScraper from './amazon.js';

export function detectPlatform(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('trendyol.com')) return 'trendyol';
    if (parsed.hostname.includes('hepsiburada.com')) return 'hepsiburada';
    if (parsed.hostname.includes('amazon.com.tr')) return 'amazon';
    return null;
  } catch {
    return null;
  }
}

export async function scrapeProduct(url, html = null) {
  const platform = detectPlatform(url);
  if (!platform) {
    throw new Error('Desteklenmeyen platform URL\'si.');
  }

  let scraper;
  if (platform === 'trendyol') {
    const { default: TrendyolScraper } = await import('./trendyol.js');
    scraper = new TrendyolScraper();
  } else if (platform === 'hepsiburada') {
    const { default: HepsiburadaScraper } = await import('./hepsiburada.js');
    scraper = new HepsiburadaScraper();
  } else if (platform === 'amazon') {
    const { default: AmazonScraper } = await import('./amazon.js');
    scraper = new AmazonScraper();
  }

  return scraper.safeScrape(url, html);
}
