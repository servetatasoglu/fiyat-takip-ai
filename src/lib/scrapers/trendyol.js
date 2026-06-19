import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

export default class TrendyolScraper extends BaseScraper {
  constructor() {
    super('trendyol');
  }

  async scrape(url, html = null) {
    if (!html) {
      html = await this.fetchHtml(url);
    }
    const $ = cheerio.load(html);

    let name = null;
    let price = null;
    let oldPrice = null;
    let image = null;
    let sellerName = null;
    const reviews = [];

    // TIER 1: JSON-LD Extraction
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          // Standard Product
          if (item['@type'] === 'Product') {
            if (!name && item.name) name = item.name;
            
            if (!image && item.image) {
              let rawImage = Array.isArray(item.image) ? item.image[0] : item.image;
              if (typeof rawImage === 'object' && rawImage !== null) {
                rawImage = rawImage.url || rawImage.contentUrl || null;
              }
              image = typeof rawImage === 'string' ? rawImage : null;
            }

            if (!price && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
              for (const offer of offers) {
                if (offer.price) price = parseFloat(offer.price);
                if (offer.lowPrice) price = parseFloat(offer.lowPrice);
                if (!sellerName && offer.seller && offer.seller.name) {
                  sellerName = offer.seller.name;
                }
              }
            }

            if (item.review) {
              const itemReviews = Array.isArray(item.review) ? item.review : [item.review];
              itemReviews.forEach(r => {
                if (r.reviewBody) {
                  reviews.push({
                    author: r.author?.name || 'Anonim',
                    rating: r.reviewRating?.ratingValue ? parseInt(r.reviewRating.ratingValue) : null,
                    text: r.reviewBody,
                    date: r.datePublished ? new Date(r.datePublished) : new Date(),
                  });
                }
              });
            }
          } 
          // Trendyol's New ProductGroup Schema
          else if (item['@type'] === 'ProductGroup') {
            if (!name && item.name) name = item.name;
            if (!image && item.image) {
               let rawImage = Array.isArray(item.image) ? item.image[0] : item.image;
               if (typeof rawImage === 'object' && rawImage !== null) {
                  rawImage = rawImage.url || rawImage.contentUrl || null;
               }
               image = typeof rawImage === 'string' ? rawImage : null;
            }
            if (!price && item.hasVariant) {
               const variants = Array.isArray(item.hasVariant) ? item.hasVariant : [item.hasVariant];
               for (const v of variants) {
                 if (v.offers) {
                   const offers = Array.isArray(v.offers) ? v.offers : [v.offers];
                   for (const offer of offers) {
                     if (offer.price) price = parseFloat(offer.price);
                     if (offer.lowPrice) price = parseFloat(offer.lowPrice);
                     if (!sellerName && offer.seller && offer.seller.name) {
                       sellerName = offer.seller.name;
                     }
                   }
                 }
                 if (price) break; // found a price
               }
            }
          }
        }
      } catch {
        // Ignored
      }
    });

    // TIER 2: DOM Fallbacks
    if (!name) {
      name = $('h1.pr-new-br').first().text().trim() ||
             $('h1.product-name').first().text().trim();
    }

    if (!price) {
      const priceText = $('.prc-dsc').first().text().trim() || 
                        $('.product-price-container .prc-dsc').first().text().trim();
      price = this.parseTurkishPrice(priceText);
    }

    if (!oldPrice) {
      const oldPriceText = $('.prc-org').first().text().trim();
      oldPrice = this.parseTurkishPrice(oldPriceText);
    }
    
    // Validate Old Price
    if (oldPrice && price && oldPrice <= price) {
      oldPrice = null;
    }

    if (!image) {
      image = $('img.detail-section-img').attr('src');
    }

    if (!sellerName) {
      sellerName = $('a.merchant-text').first().text().trim() || 'Trendyol Satıcısı';
    }

    // TIER 3: Meta Tag Fallbacks
    if (!name) name = $('meta[property="og:title"]').attr('content')?.split('|')[0]?.trim();
    if (!image) image = $('meta[property="og:image"]').attr('content');
    
    // Cleanup Image URLs
    if (typeof image === 'string' && image.startsWith('//')) {
      image = 'https:' + image;
    } else if (typeof image !== 'string') {
      image = null;
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
      externalId: null, // Could be parsed from URL if needed
      reviews: reviews.slice(0, 50),
      success: true
    };
  }
}
