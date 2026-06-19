import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { scrapeProduct } from '@/lib/scrapers';
import { analyzeReviews } from '@/lib/engines/review';
import { analyzeDiscount } from '@/lib/engines/discount';
import { generateRecommendation } from '@/lib/engines/ai';
import { findBestMatchGroup } from '@/lib/engines/matching';

// In-memory quota tracker for free users (MVP approach)
// Maps IP to { count, date }
const usageMap = new Map();

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const today = new Date().toDateString();
    const userUsage = usageMap.get(ip) || { count: 0, date: today };

    if (userUsage.date !== today) {
      userUsage.count = 0;
      userUsage.date = today;
    }

    if (userUsage.count >= 5) {
      return NextResponse.json({ 
        error: 'Günlük analiz limitiniz doldu. Sınırsız analiz için FiyatTakip web sitesinden Premium üye olun.',
        isLimitReached: true 
      }, { status: 429, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    userUsage.count += 1;
    usageMap.set(ip, userUsage);

    const body = await request.json();
    const { url, html } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL gerekli.' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const cleanUrl = url.split('?')[0].trim();

    // 1. Check if listing already exists
    let listing = await prisma.platformListing.findUnique({
      where: { url: cleanUrl },
      include: { matchGroup: { include: { aiAnalysis: true } } }
    });

    // Eğer ürün veritabanında varsa ve AI analizi yapılmışsa hızlıca dön.
    if (listing && listing.matchGroup && listing.matchGroup.aiAnalysis) {
      return NextResponse.json({
        success: true,
        data: {
          productName: listing.rawTitle,
          price: listing.prices?.[0]?.price || 0,
          decision: listing.matchGroup.aiAnalysis.decision,
          trustScore: listing.matchGroup.aiAnalysis.trustScore,
          reasoning: listing.matchGroup.aiAnalysis.reasoning,
          matchGroupId: listing.matchGroupId
        }
      }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Yoksa scrape yap ve VERİTABANINA KAYDET
    const scrapedData = await scrapeProduct(cleanUrl, html);
    
    if (!scrapedData.success) {
      return NextResponse.json(
        { error: `Ürün bilgileri alınamadı: ${scrapedData.error}` },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let matchGroupId;

    if (listing) {
      // Sadece fiyatı güncelle
      await prisma.priceHistory.create({
        data: {
          price: scrapedData.price,
          oldPrice: scrapedData.oldPrice,
          listingId: listing.id
        }
      });
      matchGroupId = listing.matchGroupId;
    } else {
      const seller = await prisma.seller.upsert({
        where: { platform_name: { platform: scrapedData.platform, name: scrapedData.sellerName || 'Bilinmeyen Satıcı' } },
        update: {},
        create: { platform: scrapedData.platform, name: scrapedData.sellerName || 'Bilinmeyen Satıcı' }
      });

      const matchResult = await findBestMatchGroup(prisma, scrapedData.name);

      if (matchResult) {
        matchGroupId = matchResult.matchGroupId;
        listing = await prisma.platformListing.create({
          data: {
            matchGroupId,
            platform: scrapedData.platform,
            url: cleanUrl,
            externalId: scrapedData.externalId,
            rawTitle: scrapedData.name,
            image: scrapedData.image,
            sellerId: seller.id,
            prices: {
              create: { price: scrapedData.price, oldPrice: scrapedData.oldPrice }
            }
          }
        });
      } else {
        const newProduct = await prisma.product.create({
          data: {
            baseName: scrapedData.name,
            variants: {
              create: {
                attributes: {},
                matchGroup: { create: { canonicalName: scrapedData.name, confidenceScore: 100 } }
              }
            }
          },
          include: { variants: { include: { matchGroup: true } } }
        });
        
        matchGroupId = newProduct.variants[0].matchGroup.id;
        
        listing = await prisma.platformListing.create({
          data: {
            matchGroupId,
            platform: scrapedData.platform,
            url: cleanUrl,
            externalId: scrapedData.externalId,
            rawTitle: scrapedData.name,
            image: scrapedData.image,
            sellerId: seller.id,
            prices: {
              create: { price: scrapedData.price, oldPrice: scrapedData.oldPrice }
            }
          }
        });
      }
    }

    // Real Review & Discount AI Analysis
    const matchGroup = await prisma.matchGroup.findUnique({
      where: { id: matchGroupId },
      include: {
        listings: {
          include: {
            prices: { orderBy: { createdAt: 'asc' } },
            reviews: true
          }
        }
      }
    });

    let allPrices = [];
    let allReviews = [];
    
    matchGroup.listings.forEach(l => {
      allPrices = allPrices.concat(l.prices);
      allReviews = allReviews.concat(l.reviews);
    });

    // The cheapest listing in the group
    let lowestCurrentPriceListing = matchGroup.listings[0];
    for (const l of matchGroup.listings) {
       const lPrice = l.prices[l.prices.length-1]?.price || Infinity;
       const lowestPrice = lowestCurrentPriceListing.prices[lowestCurrentPriceListing.prices.length-1]?.price || Infinity;
       if (lPrice < lowestPrice) lowestCurrentPriceListing = l;
    }

    const discountData = analyzeDiscount(lowestCurrentPriceListing.prices);
    const reviewAnalysis = analyzeReviews(allReviews.length > 0 ? allReviews : scrapedData.reviews || []);

    // 1. Calculate GLOBAL recommendation based on the best market price
    const lowestPriceValue = lowestCurrentPriceListing.prices[lowestCurrentPriceListing.prices.length-1]?.price || 0;
    const globalRecommendation = await generateRecommendation(
      scrapedData.name,
      lowestPriceValue,
      allPrices,
      discountData,
      reviewAnalysis
    );

    // 2. Calculate LOCAL recommendation based on the specific listing the user is viewing
    const localRecommendation = await generateRecommendation(
      scrapedData.name,
      scrapedData.price,
      allPrices,
      discountData,
      reviewAnalysis
    );
    
    // 3. Find alternatives based on local price
    const { findCheaperAlternatives } = await import('@/lib/engines/matching.js');
    const alternatives = await findCheaperAlternatives(prisma, scrapedData.name, scrapedData.price);

    // Sadece global (en iyi fiyatlı) AI kararını DB'ye kaydet, böylece web sitesinde doğru gözükür.
    await prisma.aiAnalysis.upsert({
      where: { matchGroupId },
      update: {
        decision: globalRecommendation.decision,
        reasoning: globalRecommendation.reasoning,
        riskFactors: globalRecommendation.riskFactors,
        trustScore: reviewAnalysis.trustScore,
        marketValue: globalRecommendation.marketValue
      },
      create: {
        matchGroupId,
        decision: globalRecommendation.decision,
        reasoning: globalRecommendation.reasoning,
        riskFactors: globalRecommendation.riskFactors,
        trustScore: reviewAnalysis.trustScore,
        marketValue: globalRecommendation.marketValue
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        productName: scrapedData.name,
        price: scrapedData.price,
        decision: localRecommendation.decision, // Return local decision to extension
        trustScore: reviewAnalysis.trustScore,
        reasoning: localRecommendation.reasoning,
        matchGroupId: matchGroupId,
        alternatives: alternatives
      }
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    console.error('[API Extension]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
