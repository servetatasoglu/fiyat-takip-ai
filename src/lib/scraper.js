import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * Validates that the given URL is a Trendyol product page.
 */
export function validateTrendyolUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes('trendyol.com') && parsed.pathname.length > 1
    );
  } catch {
    return false;
  }
}

/**
 * Scrapes a Trendyol product page and extracts name, price, and image.
 * Uses JSON-LD as primary source, with CSS selector fallbacks.
 */
export async function scrapeTrendyol(url) {
  if (!validateTrendyolUrl(url)) {
    throw new Error('Geçersiz Trendyol URL\'si. Lütfen geçerli bir ürün linki girin.');
  }

  let html;
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
    });
    html = response.data;
  } catch (err) {
    console.log(`[SCRAPER] Axios failed for ${url}, falling back to Puppeteer...`);
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true, // "new" is default now
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      html = await page.content();
    } catch (pupErr) {
      throw new Error(`Sayfa yüklenemedi (Puppeteer da başarısız): ${pupErr.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }

  const $ = cheerio.load(html);

  let name = null;
  let price = null;
  let image = null;

  // ─── 1. Try JSON-LD structured data (most reliable) ───
  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      // Could be array or single object
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Product') {
          if (!name && item.name) {
            name = item.name;
          }
          if (!image && item.image) {
            // item.image can be: string, array, ImageObject {url}, or array of ImageObjects
            let rawImage = Array.isArray(item.image) ? item.image[0] : item.image;
            if (typeof rawImage === 'object' && rawImage !== null) {
              rawImage = rawImage.url || rawImage.contentUrl || null;
            }
            image = typeof rawImage === 'string' ? rawImage : null;
          }
          if (!price && item.offers) {
            const offers = Array.isArray(item.offers)
              ? item.offers
              : [item.offers];
            for (const offer of offers) {
              if (offer.price) {
                price = parseFloat(offer.price);
                break;
              }
              if (offer.lowPrice) {
                price = parseFloat(offer.lowPrice);
                break;
              }
            }
          }
        }
      }
    } catch {
      // Skip invalid JSON-LD
    }
  });

  // ─── 2. CSS selector fallbacks ───
  if (!name) {
    name =
      $('h1.pr-new-br').first().text().trim() ||
      $('h1.product-name').first().text().trim() ||
      $('.pr-in-w h1').first().text().trim() ||
      $('title').first().text().trim().split('|')[0]?.trim() ||
      null;
  }

  if (!price) {
    const priceSelectors = [
      '.prc-dsc',
      '.prc-org',
      '.product-price-container .prc-dsc',
      '.pr-bx-w .prc-dsc',
      '[data-testid="product-price"]',
    ];
    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        // Remove "TL", dots (thousands separator), replace comma with dot
        const cleaned = priceText
          .replace(/[^\d.,]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) {
          price = parsed;
          break;
        }
      }
    }
  }

  if (!image) {
    image =
      $('img.detail-section-img').attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      $('img.gallery-img').first().attr('src') ||
      null;
  }

  // Ensure image is a string and uses https
  if (typeof image === 'string' && image.startsWith('//')) {
    image = 'https:' + image;
  } else if (typeof image !== 'string') {
    image = null;
  }

  // ─── 3. Validate results ───
  if (!name) {
    throw new Error(
      'Ürün adı bulunamadı. Trendyol sayfa yapısı değişmiş olabilir.'
    );
  }
  if (!price || isNaN(price)) {
    throw new Error(
      'Ürün fiyatı bulunamadı. Trendyol sayfa yapısı değişmiş olabilir.'
    );
  }

  return { name, price, image };
}
