import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeDiscount } from '@/lib/engines/discount';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Sadece "AL" (BUY) onayı verilmiş ürünleri getir
    const matchGroups = await prisma.matchGroup.findMany({
      where: {
        aiAnalysis: {
          decision: 'BUY',
        }
      },
      include: {
        listings: {
          include: {
            prices: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        aiAnalysis: true
      },
      take: 20
    });

    const verifiedDiscounts = [];

    for (const mg of matchGroups) {
      let bestListing = null;
      let maxDiscount = 0;
      let discountDataObj = null;

      // Hangi platformdaki listelemede en büyük "Gerçek" indirim var?
      for (const listing of mg.listings) {
        if (listing.prices.length < 2) continue;
        
        const discountData = analyzeDiscount(listing.prices);
        
        if (discountData.verdict === 'real_discount' || discountData.verdict === 'super_discount') {
          if (discountData.percent > maxDiscount) {
            maxDiscount = discountData.percent;
            bestListing = listing;
            discountDataObj = discountData;
          }
        }
      }

      if (bestListing) {
        verifiedDiscounts.push({
          id: mg.id,
          name: mg.canonicalName,
          image: bestListing.image,
          currentPrice: discountDataObj.currentPrice,
          oldPrice: discountDataObj.average30Days,
          discountPercent: maxDiscount,
          platform: bestListing.platform,
          url: bestListing.url,
          trustScore: mg.aiAnalysis.trustScore,
        });
      }
    }

    // En yüksek indirim oranına göre sırala
    verifiedDiscounts.sort((a, b) => b.discountPercent - a.discountPercent);

    return NextResponse.json(verifiedDiscounts.slice(0, 5)); // Sadece en iyi 5 indirim
  } catch (error) {
    console.error('[API /discounts]', error);
    return NextResponse.json({ error: 'İndirimler yüklenemedi' }, { status: 500 });
  }
}
