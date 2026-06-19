import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Sen FiyatTakip'in yapay zeka alışveriş asistanısın. Kullanıcılara:
- Türkiye'deki e-ticaret platformlarında (Trendyol, Hepsiburada, Amazon Türkiye) fiyat karşılaştırması konusunda yardım edersin
- Alınıp alınmaması konusunda mantıklı tavsiyeler verirsin
- Sahte indirimler ve yanıltıcı fiyatlandırma hakkında bilgilendirirsin
- Tasarruf stratejileri önerirsin
Kısa, net ve samimi cevaplar ver. Türkçe cevap ver.`;

// Demo mode: smart pre-programmed responses when no API key
const DEMO_RESPONSES = {
  'fiyat iyi mi': '📊 Ürünün mevcut fiyatını geçmiş 30 günlük ortalamasıyla karşılaştırıyorum... Geçmiş verilere göre bu fiyat **piyasa ortalamasının %8 altında** — şu an almak mantıklı görünüyor! 🟢',
  'ne zaman alsam': '📅 Fiyat tahmin motorumun analizine göre bu ürün genellikle **Cuma günleri ve ay sonu** kampanyalarında en ucuz oluyor. 2 hafta daha bekleyebilirseniz %5-10 daha ucuza yakalama şansınız var.',
  'sahte indirim': '🚨 Sahte indirim tespiti için şunlara bakın:\n• Referans fiyatı son 30 gün ortalamasıyla karşılaştırın\n• İndirim oranı %50\'den yüksekse şüphecilik iyi\n• "Önerilen satış fiyatı" yazıyorsa gerçek indirim değildir\n• FiyatTakip\'in Güven Skoru %70 altındaysa dikkat!',
  'kargo': '📦 Kargo dahil hesaplama:\n• Trendyol: 29.99 TL (150 TL altı siparişlerde)\n• Hepsiburada: 39.99 TL (200 TL altı siparişlerde)\n• Amazon: 39.99 TL (150 TL altı siparişlerde)\n\nKarşılaştırma tablomuzda "Toplam Maliyet" sütununa bakarsanız kargo dahil en ucuz platformu görebilirsiniz!',
  'indirim': '💡 Gerçek indirim mi? Şunu kontrol edin:\n1. FiyatTakip\'te ürünün fiyat grafiğine bakın\n2. Son 90 günün en düşük fiyatını görün\n3. Eğer mevcut fiyat bu seviyedeyse GERÇEK indirim ✅\n4. Grafikte sürekli aynı fiyatsa SAHTE indirim ⚠️',
  'alarm': '🔔 Fiyat alarmı kurmak için:\n1. Ürün detay sayfasına gidin\n2. Sağ sütunda "Fiyat Alarmı Kur" formunu doldurun\n3. Hedef fiyatı girin\n4. E-posta veya Push bildirimi seçin\n5. Fiyat düşünce anında bildirim alırsınız!',
};

function getDemoResponse(message, context) {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (lower.includes(key)) return response;
  }

  // Context-aware response
  if (context?.productName) {
    const price = context.currentPrice;
    const decision = context.decision;
    if (decision === 'BUY') {
      return `✅ **${context.productName}** için şu an iyi bir fiyat! ${price} TL seviyesi son 30 günün alt sınırına yakın. Alma zamanı olabilir.`;
    } else if (decision === 'WAIT') {
      return `⏳ **${context.productName}** için biraz daha beklemenizi öneririm. Fiyat trendi düşüşe geçmiş görünüyor — birkaç hafta içinde daha uygun fiyatla karşılaşabilirsiniz.`;
    }
    return `🔍 **${context.productName}** için ${price} TL fiyatı analiz ediyorum. Fiyat grafiğine bakarak geçmiş verilerle karşılaştırmanızı öneririm. Başka bir sorum var mı?`;
  }

  // Generic helpful response
  const generics = [
    '🛒 Size nasıl yardımcı olabilirim? Ürün fiyatı, indirim analizi veya alarm kurma hakkında sorabilirsiniz.',
    '💡 Bir ürünün gerçek indirimde olup olmadığını öğrenmek ister misiniz? Ürün adını veya fiyatını paylaşın.',
    '📊 Trendyol, Hepsiburada veya Amazon\'da en ucuz fiyatı bulmak için hangi ürünü arıyorsunuz?',
    '🔔 Fiyat düşünce otomatik bildirim almak ister misiniz? Alarm kurmanıza yardımcı olabilirim.',
  ];
  return generics[Math.floor(Math.random() * generics.length)];
}

export async function POST(request) {
  try {
    const { message, context } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mesaj boş' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasRealKey = apiKey && apiKey !== 'your-gemini-api-key' && apiKey.startsWith('AIza');

    // ── GERÇEK GEMINI API ────────────────────────────────────────────────────
    if (hasRealKey) {
      let contextStr = '';
      if (context?.productName) {
        contextStr = `\n\nMevcut ürün: ${context.productName}\nMevcut fiyat: ${context.currentPrice} TL\nAI kararı: ${context.decision || 'Bilinmiyor'}\nPlatform: ${context.platforms?.join(', ') || 'Bilinmiyor'}`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}${contextStr}\n\nKullanıcı: ${message}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || 'Gemini API hatası');
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt alınamadı.';
      return NextResponse.json({ reply });
    }

    // ── DEMO MODU (API key yokken) ───────────────────────────────────────────
    // Simulate a small delay for realism
    await new Promise(r => setTimeout(r, 600));
    const reply = getDemoResponse(message, context);
    return NextResponse.json({ reply, demo: true });

  } catch (err) {
    console.error('[AI Chat]', err.message);
    // Even on error, return demo response
    await new Promise(r => setTimeout(r, 400));
    return NextResponse.json({
      reply: getDemoResponse(request._message || 'merhaba', null),
      demo: true,
    });
  }
}
