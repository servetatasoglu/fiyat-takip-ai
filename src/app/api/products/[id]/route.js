import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeDiscount } from '@/lib/engines/discount';
import { analyzeReviews } from '@/lib/engines/review';
import { predictPrice } from '@/lib/prediction';


export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const matchGroupId = parseInt(id, 10);

    if (isNaN(matchGroupId)) {
      return NextResponse.json({ error: 'Geçersiz ürün ID.' }, { status: 400 });
    }

    const matchGroup = await prisma.matchGroup.findUnique({
      where: { id: matchGroupId },
      include: {
        variant: {
           include: { product: true }
        },
        listings: {
          include: {
            prices: {
              orderBy: { createdAt: 'asc' },
            },
            reviews: true,
            seller: true
          },
        },
        aiAnalysis: true
      },
    });

    if (!matchGroup) {
      return NextResponse.json({ error: 'Ürün bulunamadı.' }, { status: 404 });
    }

    let primaryImage = null;
    let allReviews = [];

    // Structure the data for the frontend
    const sourceData = matchGroup.listings.map(listing => {
      if (!primaryImage && listing.image) {
         primaryImage = listing.image;
      }
      
      const discountAnalysis = analyzeDiscount(listing.prices);
      const currentPriceObj = listing.prices.length > 0 ? listing.prices[listing.prices.length - 1] : null;
      
      allReviews = allReviews.concat(listing.reviews);

      return {
        id: listing.id,
        platform: listing.platform,
        url: listing.url,
        currentPrice: currentPriceObj?.price,
        oldPrice: currentPriceObj?.oldPrice,
        shippingCost: currentPriceObj?.shippingCost,
        prices: listing.prices,
        discount: discountAnalysis,
        sellerName: listing.seller?.name || null,
        sellerTrustScore: listing.seller?.trustScore || null
      };
    });

    const reviewAnalysis = analyzeReviews(allReviews);

    // Run price prediction on cheapest listing's full price history
    const cheapestSource = sourceData.reduce((min, s) => (!min || (s.currentPrice && s.currentPrice < min.currentPrice)) ? s : min, null);
    const prediction = cheapestSource ? predictPrice(cheapestSource.prices, 14) : null;

    return NextResponse.json({
      id: matchGroup.id,
      name: matchGroup.canonicalName,
      image: primaryImage,
      confidenceScore: matchGroup.confidenceScore,
      sources: sourceData,
      reviewAnalysis,
      aiAnalysis: matchGroup.aiAnalysis,
      reviews: allReviews.slice(0, 10),
      prediction,
    });

  } catch (err) {
    console.error('[API /products/[id]]', err.message);
    return NextResponse.json(
      { error: 'Ürün bilgisi yüklenemedi.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const matchGroupId = parseInt(id, 10);

    if (isNaN(matchGroupId)) {
      return NextResponse.json({ error: 'Geçersiz ürün ID.' }, { status: 400 });
    }

    // Delete AI analysis
    await prisma.aiAnalysis.deleteMany({ where: { matchGroupId } });
    
    // Delete price alerts
    await prisma.priceAlert.deleteMany({ where: { matchGroupId } });

    // Delete reviews and price history for all listings
    const listings = await prisma.platformListing.findMany({ where: { matchGroupId } });
    for (const listing of listings) {
      await prisma.review.deleteMany({ where: { listingId: listing.id } });
      await prisma.priceHistory.deleteMany({ where: { listingId: listing.id } });
    }

    // Delete listings
    await prisma.platformListing.deleteMany({ where: { matchGroupId } });

    // Delete match group
    await prisma.matchGroup.delete({ where: { id: matchGroupId } });

    return NextResponse.json({ message: 'Ürün başarıyla silindi.' });
  } catch (err) {
    console.error('[API DELETE /products/[id]]', err.message);
    return NextResponse.json(
      { error: 'Ürün silinemedi.' },
      { status: 500 }
    );
  }
}
