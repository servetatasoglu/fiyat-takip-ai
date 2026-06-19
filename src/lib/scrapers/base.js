import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Sleep function for exponential backoff
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class BaseScraper {
  constructor(platformName) {
    this.platform = platformName;
  }

  /**
   * Returns platform-specific headers to bypass bot detection (e.g. Hepsiburada 403).
   */
  getHeaders(url) {
    const ua = getRandomUA();
    const parsedUrl = new URL(url);
    return {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
      'Sec-Ch-Ua': '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  /**
   * Fetches the HTML of the given URL with exponential backoff and realistic browser headers.
   */
  async fetchHtml(url, retries = 4) {
    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await axios.get(url, {
          headers: this.getHeaders(url),
          timeout: 20000,
          maxRedirects: 5,
          validateStatus: (status) => status < 400,
        });
        return response.data;
      } catch (err) {
        attempt++;
        const status = err.response?.status;
        
        // If 404, no point in retrying
        if (status === 404) {
          throw new Error('Ürün bulunamadı (404)');
        }
        
        // If we hit max retries, try Puppeteer stealth as a final fallback
        if (attempt >= retries) {
          if (status === 403 || status === 429) {
            console.log(`[SCRAPER] Axios failed permanently for ${url}, falling back to Puppeteer Stealth...`);
            let browser;
            try {
              const puppeteer = (await import('puppeteer-extra')).default;
              const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
              // Sadece ilk defasında eklensin diye basit bir kontrol yapılabilir veya plugin zaten varsa es geçilebilir
              if (!puppeteer._plugins?.some(p => p.name === 'stealth')) {
                 puppeteer.use(StealthPlugin());
              }
              
              const browserlessToken = process.env.BROWSERLESS_TOKEN;
              
              if (browserlessToken) {
                console.log('[SCRAPER] Connecting to Browserless.io...');
                browser = await puppeteer.connect({
                  browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
                });
              } else {
                browser = await puppeteer.launch({
                  headless: true,
                  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
                });
              }
              const page = await browser.newPage();
              await page.setUserAgent(getRandomUA());
              await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
              const html = await page.content();
              return html;
            } catch (pupErr) {
              throw new Error(`Erişim engellendi (403/429) ve Puppeteer da başarısız oldu: ${pupErr.message}`);
            } finally {
              if (browser) await browser.close();
            }
          }
          throw new Error(`Sayfa yüklenemedi (${this.platform}): ${err.message}`);
        }
        
        // Exponential backoff with jitter for 403/429
        const baseDelay = (status === 403 || status === 429) ? 3000 : 1500;
        const delay = Math.pow(2, attempt) * baseDelay + Math.random() * 1000;
        console.warn(`[SCRAPER] ${this.platform} fetch failed (${status || 'network'}). Retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
      }
    }
  }

  /**
   * Cleans and parses a Turkish price string (e.g., "1.234,56 TL" -> 1234.56)
   */
  parseTurkishPrice(priceText) {
    if (!priceText) return null;
    const cleaned = priceText
      .replace(/[^\d.,]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  }

  /**
   * Fail-Safe wrapper for execution. Ensures we don't crash the whole process.
   */
  async safeScrape(url) {
    try {
      return await this.scrape(url);
    } catch (err) {
      console.error(`[SCRAPER ERROR] ${this.platform} @ ${url}`, err.message);
      return {
        platform: this.platform,
        url,
        error: err.message,
        success: false
      };
    }
  }

  /**
   * Core scraping method to be implemented by child classes.
   */
  async scrape(url) {
    throw new Error('Not implemented');
  }
}
