import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

export default class AmazonScraper extends BaseScraper {
  constructor() {
    super('amazon');
  }

  async scrape(url, html = null) {
    let html_to_use = html; if (!html_to_use) { html_to_use = await this.fetchHtml(url); }
    const $ = cheerio.load(html_to_use);

    let name = null;
    let price = null;
    let oldPrice = null;
    let image = null;
    let sellerName = null;
    const reviews = [];

    // TIER 1: DOM Primary
    name = $('#productTitle').text().trim() ||
           $('h1.a-size-large').text().trim();

    const priceSelectors = [
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price.a-text-price.a-size-medium .a-offscreen',
      '.a-price .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
      '.a-color-price'
    ];

    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        price = this.parseTurkishPrice(priceText);
        if (price) break;
      }
    }

    const oldPriceSelectors = [
      '.a-text-strike',
      '#priceblock_ourprice'
    ];
    for (const selector of oldPriceSelectors) {
      const oldPriceText = $(selector).first().text().trim();
      if (oldPriceText) {
         oldPrice = this.parseTurkishPrice(oldPriceText);
         if (oldPrice) break;
      }
    }
    
    if (oldPrice && price && oldPrice <= price) oldPrice = null;

    image = $('#landingImage').attr('src') ||
            $('#imgBlkFront').attr('src');

    sellerName = $('#sellerProfileTriggerId').text().trim() ||
                 $('#merchant-info a').first().text().trim() ||
                 'Amazon Satıcısı';

    // TIER 2: Meta Tags
    if (!name) name = $('meta[name="title"]').attr('content');
    if (!image) image = $('meta[property="og:image"]').attr('content');

    // TIER 3: Reviews DOM Parse
    $('.review').each((_, el) => {
      const author = $(el).find('.a-profile-name').text().trim();
      const text = $(el).find('.review-text-content span').text().trim();
      const ratingText = $(el).find('.review-rating').text().trim(); 
      let rating = null;
      if (ratingText) {
         const match = ratingText.match(/(\d)/);
         if (match) rating = parseInt(match[1]);
      }
      
      if (text) {
        reviews.push({
          author: author || 'Anonim',
          rating,
          text,
          date: new Date()
        });
      }
    });

    if (typeof image === 'string' && image.startsWith('//')) {
      image = 'https:' + image;
    }

    if (!name || !price) {
      throw new Error('Sayfa yapısı değişmiş veya ürün fiyatı/adı okunamadı.');
    }

    return {
      platform: this.platform,
      url,
      name,
      price,
      oldPrice,
      image,
      sellerName,
      externalId: null,
      reviews: reviews.slice(0, 50),
      success: true
    };
  }
}
