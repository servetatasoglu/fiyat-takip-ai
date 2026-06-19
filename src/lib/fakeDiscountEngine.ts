import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function detectFakeDiscounts(matchGroupId: number) {
  // 1. Fetch recent price history for the match group (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const listings = await prisma.platformListing.findMany({
    where: { matchGroupId },
    include: {
      prices: {
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  let totalPrices: number[] = [];
  
  for (const listing of listings) {
    totalPrices.push(...listing.prices.map(p => p.price));
  }

  if (totalPrices.length < 5) return; // Not enough data to be statistically significant

  // Calculate Median
  totalPrices.sort((a, b) => a - b);
  const mid = Math.floor(totalPrices.length / 2);
  const medianPrice = totalPrices.length % 2 !== 0 ? totalPrices[mid] : (totalPrices[mid - 1] + totalPrices[mid]) / 2;

  // 2. Check for recent "Fake Discount" pattern
  // Logic: Did the price jump up recently and then drop, but the dropped price is still higher than the 30-day median?
  let hasFakeDiscount = false;

  for (const listing of listings) {
    const prices = listing.prices;
    if (prices.length < 3) continue;

    const currentPrice = prices[0].price;
    const previousPrice = prices[1].price;

    // Price dropped from previous, BUT is still 5% higher than the 30-day median
    if (currentPrice < previousPrice && currentPrice > medianPrice * 1.05) {
      // It's a fake discount!
      hasFakeDiscount = true;
      
      // Update PriceHistory anomaly flag
      await prisma.priceHistory.update({
        where: { id: prices[0].id },
        data: { isAnomaly: true }
      });

      // Penalize Seller
      if (listing.sellerId) {
        await prisma.seller.update({
          where: { id: listing.sellerId },
          data: { 
            fakeDiscountCount: { increment: 1 },
            trustScore: { decrement: 5 } // Penalize trust score
          }
        });
      }
    }
  }

  // 3. Update MatchGroup Trust Score and Fake Discount Rate
  if (hasFakeDiscount) {
    await prisma.matchGroup.update({
      where: { id: matchGroupId },
      data: {
        fakeDiscountRate: { increment: 0.1 },
        trustScore: { decrement: 2 }
      }
    });
  }
}
