import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cacheGet, cacheSet } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0') || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '0') || 0;
    const sort = searchParams.get('sort') || 'newest';
    const platform = searchParams.get('platform') || '';

    // Cache key — skip cache for search queries (dynamic results)
    const cacheKey = q ? null : `products:${platform}:${sort}:${minPrice}:${maxPrice}`;
    if (cacheKey) {
      const cached = await cacheGet(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    const matchGroups = await prisma.matchGroup.findMany({
      where: {
        ...(q ? {
          canonicalName: { contains: q, mode: 'insensitive' }
        } : {}),
        ...(platform ? {
          listings: { some: { platform } }
        } : {}),
      },
      include: {
        listings: {
          include: {
            prices: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        aiAnalysis: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let result = matchGroups.map((mg) => {
      let cheapestPrice = null;
      let platforms = [];
      let lastUpdated = mg.createdAt;
      let primaryImage = null;
      let externalUrl = null;

      mg.listings.forEach((listing) => {
        platforms.push(listing.platform);
        if (!primaryImage && listing.image) primaryImage = listing.image;

        if (listing.prices.length > 0) {
          const currentPrice = listing.prices[0].price;
          if (cheapestPrice === null || currentPrice < cheapestPrice) {
            cheapestPrice = currentPrice;
            externalUrl = listing.url;
          }
          if (listing.prices[0].createdAt > lastUpdated) lastUpdated = listing.prices[0].createdAt;
        }
      });

      return {
        id: mg.id,
        name: mg.canonicalName,
        image: primaryImage,
        currentPrice: cheapestPrice,
        externalUrl,
        platforms: [...new Set(platforms)],
        trustScore: mg.aiAnalysis?.trustScore || 50,
        decision: mg.aiAnalysis?.decision || 'WAIT',
        matchConfidence: mg.confidenceScore,
        lastUpdated,
        createdAt: mg.createdAt,
      };
    });

    // Price range filter (post-query since price is computed)
    if (minPrice > 0) result = result.filter(p => p.currentPrice && p.currentPrice >= minPrice);
    if (maxPrice > 0) result = result.filter(p => p.currentPrice && p.currentPrice <= maxPrice);

    // Sorting
    if (sort === 'price_asc') result.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));
    else if (sort === 'price_desc') result.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
    else if (sort === 'trust_desc') result.sort((a, b) => b.trustScore - a.trustScore);

    if (cacheKey) await cacheSet(cacheKey, result, 300); // 5 dakika cache
    return NextResponse.json(result);
  } catch (err) {
    console.error('[API /products]', err.message);
    return NextResponse.json({ error: 'Ürünler yüklenemedi.' }, { status: 500 });
  }
}
