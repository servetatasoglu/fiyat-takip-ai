import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRecommendation } from '@/lib/engines/ai';
import { analyzeDiscount } from '@/lib/engines/discount';
import { analyzeReviews } from '@/lib/engines/review';
import { findCheaperAlternatives } from '@/lib/engines/matching';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

// In-memory quota tracker for free users (MVP approach)
// Maps IP to { count, date }
const usageMap = new Map();

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const isPremium = session?.user?.isPremium || false;

    // Quota Enforcement for Free Users
    if (!isPremium) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
      const today = new Date().toDateString();
      const userUsage = usageMap.get(ip) || { count: 0, date: today };

      if (userUsage.date !== today) {
        userUsage.count = 0;
        userUsage.date = today;
      }

      if (userUsage.count >= 5) {
        return NextResponse.json({ 
          error: 'Günlük analiz limitiniz doldu. Sınırsız analiz için Premium üye olun.',
          isLimitReached: true 
        }, { status: 429 });
      }

      userUsage.count += 1;
      usageMap.set(ip, userUsage);
    }

    const { id } = await params;
    const matchGroupId = parseInt(id, 10);

    if (isNaN(matchGroupId)) {
      return NextResponse.json({ error: 'Geçersiz ürün ID.' }, { status: 400 });
    }

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

    if (!matchGroup) {
      return NextResponse.json({ error: 'Ürün bulunamadı.' }, { status: 404 });
    }

    let allPrices = [];
    let allReviews = [];
    
    matchGroup.listings.forEach(l => {
      allPrices = allPrices.concat(l.prices);
      allReviews = allReviews.concat(l.reviews);
    });

    if (matchGroup.listings.length === 0) {
      return NextResponse.json({ error: 'Yeterli veri yok.' }, { status: 400 });
    }

    let lowestCurrentPriceListing = matchGroup.listings[0];
    for (const l of matchGroup.listings) {
       const lPrice = l.prices[l.prices.length-1]?.price || Infinity;
       const lowestPrice = lowestCurrentPriceListing.prices[lowestCurrentPriceListing.prices.length-1]?.price || Infinity;
       if (lPrice < lowestPrice) lowestCurrentPriceListing = l;
    }

    const discountData = analyzeDiscount(lowestCurrentPriceListing.prices);
    const reviewAnalysis = analyzeReviews(allReviews);

    const currentPrice = lowestCurrentPriceListing.prices[lowestCurrentPriceListing.prices.length-1]?.price || 0;

    const aiRecommendation = await generateRecommendation(
      matchGroup.canonicalName,
      currentPrice,
      allPrices,
      discountData,
      reviewAnalysis
    );

    const analysis = await prisma.aiAnalysis.upsert({
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
    
    // Find alternatives
    const alternatives = await findCheaperAlternatives(prisma, matchGroup.canonicalName, currentPrice);

    return NextResponse.json({ ...analysis, alternatives });
  } catch (err) {
    console.error('[API /analyze/[id]]', err.message);
    return NextResponse.json(
      { error: 'Analiz tamamlanamadı.' },
      { status: 500 }
    );
  }
}
