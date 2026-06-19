import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { scrapeProduct } from '@/lib/scrapers';
import { analyzeReviews } from '@/lib/engines/review';
import { analyzeDiscount } from '@/lib/engines/discount';
import { generateRecommendation } from '@/lib/engines/ai';
import { findBestMatchGroup } from '@/lib/engines/matching';

export async function POST(request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL gerekli.' }, { status: 400 });
    }

    const cleanUrl = url.split('?')[0].trim();

    // 1. Check if listing already exists
    let listing = await prisma.platformListing.findUnique({
      where: { url: cleanUrl },
      include: { matchGroup: true }
    });

    // 2. Scrape data safely
    const scrapedData = await scrapeProduct(cleanUrl);
    
    if (!scrapedData.success) {
      return NextResponse.json(
        { error: `Ürün bilgileri alınamadı: ${scrapedData.error}` },
        { status: 400 }
      );
    }

    let matchGroupId;

    if (listing) {
      // Add new price entry
      await prisma.priceHistory.create({
        data: {
          price: scrapedData.price,
          oldPrice: scrapedData.oldPrice,
          listingId: listing.id
        }
      });
      matchGroupId = listing.matchGroupId;
    } else {
      // Upsert Seller
      const seller = await prisma.seller.upsert({
        where: { platform_name: { platform: scrapedData.platform, name: scrapedData.sellerName || 'Bilinmeyen Satıcı' } },
        update: {},
        create: { platform: scrapedData.platform, name: scrapedData.sellerName || 'Bilinmeyen Satıcı' }
      });

      // 3. Match Engine: Find existing group or create new
      const matchResult = await findBestMatchGroup(prisma, scrapedData.name);

      if (matchResult) {
        matchGroupId = matchResult.matchGroupId;
        // Create listing linked to existing group
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
              create: {
                price: scrapedData.price,
                oldPrice: scrapedData.oldPrice
              }
            }
          }
        });
      } else {
        // Create new Product, Variant, MatchGroup, and Listing
        // For MVP, we use raw title as base Name and Canonical Name
        const newProduct = await prisma.product.create({
          data: {
            baseName: scrapedData.name,
            variants: {
              create: {
                attributes: {}, // Empty JSON for now
                matchGroup: {
                  create: {
                    canonicalName: scrapedData.name,
                    confidenceScore: 100 // Origin score
                  }
                }
              }
            }
          },
          include: {
            variants: { include: { matchGroup: true } }
          }
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
              create: {
                price: scrapedData.price,
                oldPrice: scrapedData.oldPrice
              }
            }
          }
        });
      }
    }

    // 4. Process Reviews
    if (scrapedData.reviews && scrapedData.reviews.length > 0) {
      await prisma.review.deleteMany({
        where: { listingId: listing.id }
      });

      // Simple anomaly detection happens during Review Engine analysis, 
      // but we save raw reviews here
      await prisma.review.createMany({
        data: scrapedData.reviews.map(r => ({
          listingId: listing.id,
          author: r.author,
          rating: r.rating,
          text: r.text,
          date: r.date,
        }))
      });
    }

    // 5. Update AI Analysis for the entire MatchGroup
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
      // Take only the latest price sequence from the best platform, or combine them.
      // For discount engine, it's best to analyze the specific platform's history,
      // but for overall AI, we need the market average.
      allPrices = allPrices.concat(l.prices);
      allReviews = allReviews.concat(l.reviews);
    });

    // We'll analyze the lowest current price's history for the discount engine
    let lowestCurrentPriceListing = matchGroup.listings[0];
    for (const l of matchGroup.listings) {
       const lPrice = l.prices[l.prices.length-1]?.price || Infinity;
       const lowestPrice = lowestCurrentPriceListing.prices[lowestCurrentPriceListing.prices.length-1]?.price || Infinity;
       if (lPrice < lowestPrice) lowestCurrentPriceListing = l;
    }

    const discountData = analyzeDiscount(lowestCurrentPriceListing.prices);
    const reviewAnalysis = analyzeReviews(allReviews);

    // Penalize Seller if fake discount
    if (lowestCurrentPriceListing.sellerId && (discountData.verdict === 'fake_discount' || discountData.inflationDetected)) {
      await prisma.seller.update({
        where: { id: lowestCurrentPriceListing.sellerId },
        data: {
          trustScore: { decrement: 5 },
          fakeDiscountCount: { increment: 1 }
        }
      });
    }

    const currentPrice = lowestCurrentPriceListing.prices[lowestCurrentPriceListing.prices.length-1]?.price || 0;

    const aiRecommendation = await generateRecommendation(
      matchGroup.canonicalName,
      currentPrice,
      allPrices,
      discountData,
      reviewAnalysis
    );

    await prisma.aiAnalysis.upsert({
      where: { matchGroupId },
      update: {
        decision: aiRecommendation.decision,
        reasoning: aiRecommendation.reasoning,
        riskFactors: aiRecommendation.riskFactors,
        trustScore: reviewAnalysis.trustScore,
        marketValue: aiRecommendation.marketValue
      },
      create: {
        matchGroupId,
        decision: aiRecommendation.decision,
        reasoning: aiRecommendation.reasoning,
        riskFactors: aiRecommendation.riskFactors,
        trustScore: reviewAnalysis.trustScore,
        marketValue: aiRecommendation.marketValue
      }
    });

    return NextResponse.json({
      message: 'Ürün başarıyla analiz edildi ve eşleştirildi!',
      matchGroupId
    });
  } catch (err) {
    console.error('[API /track]', err.message);
    return NextResponse.json(
      { error: err.message || 'Bir hata oluştu.' },
      { status: 500 }
    );
  }
}
