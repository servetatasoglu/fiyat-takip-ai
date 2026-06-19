import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create a Product
  const product = await prisma.product.create({
    data: {
      baseName: "Apple iPhone 15 Pro",
      category: "Elektronik",
      brand: "Apple",
      model: "iPhone 15 Pro"
    }
  });

  // 2. Create a Variant
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      attributes: { storage: "256GB", color: "Titanium" }
    }
  });

  // 3. Create a Match Group
  const matchGroup = await prisma.matchGroup.create({
    data: {
      variantId: variant.id,
      canonicalName: "Apple iPhone 15 Pro 256GB Titanium",
      confidenceScore: 99.5,
      trustScore: 85.0
    }
  });

  // 4. Create Seller
  const seller = await prisma.seller.create({
    data: {
      platform: "trendyol",
      name: "Apple Türkiye",
      trustScore: 98.0
    }
  });

  // 5. Create a Listing (Trendyol)
  const listing = await prisma.platformListing.create({
    data: {
      matchGroupId: matchGroup.id,
      platform: "trendyol",
      url: "http://localhost:3000/test_trendyol.html-p-12345", // Must match test HTML URL
      rawTitle: "iPhone 15 Pro 256 GB Natürel Titanyum",
      sellerId: seller.id
    }
  });

  // 6. Add some price history
  await prisma.priceHistory.createMany({
    data: [
      { listingId: listing.id, price: 68000, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { listingId: listing.id, price: 69000, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      // Fake discount pattern: price shot up to 80000 2 days ago, and dropped to 75000 today
      { listingId: listing.id, price: 80000, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { listingId: listing.id, price: 75000, createdAt: new Date() }
    ]
  });

  // 7. Add AI Analysis
  await prisma.aiAnalysis.create({
    data: {
      matchGroupId: matchGroup.id,
      decision: "AVOID",
      reasoning: "Satıcı fiyatı 2 gün önce 80.000 TL'ye çıkarıp bugün 75.000 TL'ye indirerek sahte bir indirim kurgulamış. Ürünün medyan gerçek değeri 68.500 TL civarındadır.",
      riskFactors: ["Sahte İndirim Tespiti", "Fiyat Dalgalanması"],
      trustScore: 45.0,
      marketValue: 68500
    }
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
