import { PrismaClient } from '@prisma/client';
// import { OpenAI } from 'openai'; 
// Assuming OpenAI is installed or will be installed

const prisma = new PrismaClient();
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAiDecision(matchGroupId: number) {
  // 1. Fetch rich data context
  const matchGroup = await prisma.matchGroup.findUnique({
    where: { id: matchGroupId },
    include: {
      listings: {
        include: {
          prices: { orderBy: { createdAt: 'desc' }, take: 90 },
          seller: true,
          reviews: { take: 50, orderBy: { createdAt: 'desc' } }
        }
      }
    }
  });

  if (!matchGroup) throw new Error("MatchGroup not found");

  // 2. Aggregate Data for Prompt Context
  const priceTrends = matchGroup.listings.map(l => ({
    platform: l.platform,
    currentPrice: l.prices[0]?.price,
    oldestPrice: l.prices[l.prices.length - 1]?.price,
    fakeDiscountFlags: l.prices.filter(p => p.isAnomaly).length
  }));

  const trustScore = matchGroup.trustScore;
  const sellerScores = matchGroup.listings.map(l => l.seller?.trustScore || 100);
  
  // Fake aspect sentiment aggregation
  const aspectSentiment = { kargo: "normal", kalite: "iyi", satici: "güvenilir" };

  // 3. Construct System Prompt
  const systemPrompt = `
Sen uzman bir e-ticaret fiyat analisti ve alışveriş asistanısın. 
Kullanıcıya ürünün satın alınıp alınmayacağı konusunda net bir karar ve bu kararın mantıksal sebeplerini sunacaksın.

Veri Özeti:
- Ürün Güven Skoru: ${trustScore}/100
- Fiyat Trendleri: ${JSON.stringify(priceTrends)}
- Satıcı Puanları: ${sellerScores.join(', ')}
- Duygu Analizi (Yorumlar): ${JSON.stringify(aspectSentiment)}

Şu formatta JSON yanıtı üretmelisin:
{
  "decision": "BUY" | "WAIT" | "AVOID",
  "reasoning": "Açıklayıcı kısa bir özet",
  "riskFactors": ["Risk 1", "Risk 2"],
  "marketValue": Tahmini adil piyasa değeri (Number)
}

Eğer ürünün güven skoru 60'ın altındaysa ve fiyatta sürekli dalgalanma (isAnomaly yüksekse) varsa kararın kesinlikle AVOID olmalı.
  `.trim();

  // 4. Call LLM API (Mocked for architecture scaffolding)
  /*
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt }],
    response_format: { type: "json_object" }
  });
  const result = JSON.parse(response.choices[0].message.content);
  */
  
  // Mock LLM Response for demonstration
  const result = {
    decision: trustScore > 70 ? "BUY" : "WAIT",
    reasoning: "Satıcı puanı yüksek ve son 30 günün en iyi fiyat trendi yakalandı.",
    riskFactors: ["Kargo ile ilgili bazı şikayetler var."],
    marketValue: priceTrends[0]?.currentPrice || 0
  };

  // 5. Update Database with AI Result
  await prisma.aiAnalysis.upsert({
    where: { matchGroupId },
    update: {
      decision: result.decision,
      reasoning: result.reasoning,
      riskFactors: result.riskFactors,
      trustScore: trustScore,
      marketValue: result.marketValue
    },
    create: {
      matchGroupId,
      decision: result.decision,
      reasoning: result.reasoning,
      riskFactors: result.riskFactors,
      trustScore: trustScore,
      marketValue: result.marketValue
    }
  });

  return result;
}
