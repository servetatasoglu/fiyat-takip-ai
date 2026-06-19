import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function detectFakeReviews(listingId: number) {
  const reviews = await prisma.review.findMany({
    where: { listingId, isFake: false },
    orderBy: { createdAt: 'desc' }
  });

  if (reviews.length < 5) return;

  for (let i = 0; i < reviews.length; i++) {
    const currentReview = reviews[i];
    let isSpam = false;
    let anomalyFlags: string[] = [];

    // 1. Dublicate/Spam Text Detection (Basic example using Levenshtein or direct match)
    // If exact same review exists multiple times from different users
    const duplicateCount = reviews.filter(
      r => r.id !== currentReview.id && r.text.toLowerCase().trim() === currentReview.text.toLowerCase().trim()
    ).length;

    if (duplicateCount >= 2) {
      isSpam = true;
      anomalyFlags.push("DUPLICATE_TEXT");
    }

    // 2. Length & Quality check (e.g., "Güzel" repeated 50 times)
    if (currentReview.text.length < 10 && currentReview.rating === 5) {
      // Short 5-star reviews might be suspicious if clustered, we just flag them
      anomalyFlags.push("SHORT_5_STAR");
    }

    // 3. AI / LLM Sentiment Validation (Mocked)
    /* 
    const aiCheck = await checkSpamWithLLM(currentReview.text);
    if (aiCheck.isSpam) { isSpam = true; anomalyFlags.push("LLM_FLAGGED_SPAM"); }
    */

    // If review is marked as fake, update DB
    if (isSpam) {
      await prisma.review.update({
        where: { id: currentReview.id },
        data: { 
          isFake: true, 
          flags: anomalyFlags 
        }
      });

      // Optionally, penalize seller if too many fake reviews are detected
      const listing = await prisma.platformListing.findUnique({
        where: { id: listingId },
        select: { sellerId: true }
      });

      if (listing?.sellerId) {
        await prisma.seller.update({
          where: { id: listing.sellerId },
          data: { trustScore: { decrement: 0.5 } }
        });
      }
    }
  }
}
