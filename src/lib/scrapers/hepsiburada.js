import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

export default class HepsiburadaScraper extends BaseScraper {
  constructor() {
    super('hepsiburada');
  }

  async scrape(url) {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    let name = null;
    let price = null;
    let oldPrice = null;
    let image = null;
    let sellerName = null;
    const reviews = [];

    // TIER 1: JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
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
                if (!sellerName && offer.seller && offer.seller.name) {
                  sellerName = offer.seller.name;
                }
                if (offer.price) {
                  price = parseFloat(offer.price);
                  break;
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
        }
      } catch {
        // Ignored
      }
    });

    // TIER 2: DOM
    if (!name) {
      name = $('h1[data-test-id="title"]').text().trim() ||
             $('h1#product-name').text().trim() ||
             $('h1[itemprop="name"]').text().trim();
    }

    if (!price) {
      const priceText = $('[data-test-id="price-current-price"]').text().trim() ||
                        $('span[itemprop="price"]').text().trim() ||
                        $('.price-value').text().trim();
      if (priceText) {
         price = this.parseTurkishPrice(priceText);
      } else {
         // Fallback to regex on HTML if DOM fails
         const priceMatch = html.match(/"price":"([0-9.]+)"/);
         if (priceMatch) price = parseFloat(priceMatch[1]);
      }
    }

    if (!oldPrice) {
      const oldPriceText = $('del#originalPrice').text().trim() || 
                           $('[data-test-id="price-prev-price"]').text().trim();
      oldPrice = this.parseTurkishPrice(oldPriceText);
    }
    
    if (oldPrice && price && oldPrice <= price) oldPrice = null;

    if (!image) {
      image = $('img#product-image').attr('src') || $('img[data-test-id="product-image"]').attr('src');
    }

    if (!sellerName) {
      sellerName = $('.merchantName').first().text().trim() || 
                   $('span.seller span').eq(1).text().trim() || 
                   $('a[data-test-id="merchant-name"]').text().trim() ||
                   'Hepsiburada Satıcısı';
    }

    // TIER 3: Meta Tag
    if (!name) name = $('meta[property="og:title"]').attr('content')?.split('-')[0]?.trim();
    if (!image) image = $('meta[property="og:image"]').attr('content');
    if (!price) {
       const metaPrice = $('meta[property="product:price:amount"]').attr('content');
       if (metaPrice) price = parseFloat(metaPrice);
    }

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
