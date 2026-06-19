import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bot is initialized only if the token is available
const botToken = process.env.TELEGRAM_BOT_TOKEN;
export const bot = botToken ? new Telegraf(botToken) : null;

if (bot) {
  // Command: /start
  bot.start((ctx) => {
    ctx.reply(
      "👋 FiyatTakip AI Bot'a Hoşgeldiniz!\n\n" +
      "Komutlar:\n" +
      "/fiyat <link> - Ürünün anlık yapay zeka analizini yapar.\n" +
      "/alarm <link> <hedef_fiyat> - Fiyat düşünce bildirim gönderir.\n" +
      "/liste - Kurduğunuz fiyat alarmlarını listeler.\n" +
      "/sil <alarm_id> - Alarmı siler."
    );
  });

  // Command: /fiyat <link>
  bot.command('fiyat', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply("❌ Lütfen bir ürün linki girin. (Örn: /fiyat https://trendyol.com/...)");

    const url = args[1];
    ctx.reply("🤖 Ürün yapay zeka tarafından analiz ediliyor, lütfen bekleyin...");

    try {
      // Direct API fetch to local endpoint to trigger full analysis flow
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const analyzeUrl = `${appUrl}/api/extension/analyze`;
      
      const response = await fetch(analyzeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
         return ctx.reply("❌ Analiz başarısız oldu. Link hatalı veya bot engellemesine takıldık.");
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        return ctx.reply("⚠️ Bu ürün için veri toplanamadı.");
      }

      const ai = result.data;
      let decisionEmoji = ai.decision === 'BUY' ? '✅' : ai.decision === 'AVOID' ? '❌' : '⚠️';
      
      let msg = `Ürün: ${ai.productName}\n\n`;
      msg += `Karar: ${decisionEmoji} ${ai.decision}\n`;
      msg += `Güncel Fiyat: ${ai.price} TL\n\n`;
      msg += `Yapay Zeka Yorumu:\n${ai.reasoning}\n\n`;
      
      if (ai.alternatives && ai.alternatives.length > 0) {
         msg += `💡 Daha ucuz bir alternatif var:\n${ai.alternatives[0].name.substring(0,30)}... (${ai.alternatives[0].price} TL)\n\n`;
      }
      msg += `[Detayları Gör](${appUrl}/urun/${ai.matchGroupId})`;

      ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('[TELEGRAM]', error);
      ctx.reply("❌ Analiz sırasında sunucu tarafında bir hata oluştu.");
    }
  });

  // Command: /alarm <link> <hedef_fiyat>
  bot.command('alarm', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply("❌ Kullanım: /alarm <link> <hedef_fiyat>");

    const url = args[1];
    const targetPrice = parseFloat(args[2]);
    const chatId = ctx.chat.id.toString();

    // Find the listing
    const listing = await prisma.platformListing.findUnique({ where: { url } });
    if (!listing || !listing.matchGroupId) {
      return ctx.reply("⚠️ Ürün bulunamadı, önce /fiyat <link> ile sistemi tetikleyin.");
    }

    await prisma.priceAlert.create({
      data: {
        matchGroupId: listing.matchGroupId,
        targetPrice,
        telegramChatId: chatId,
      }
    });

    ctx.reply(`✅ Alarm kuruldu! Bu ürün ${targetPrice} TL ve altına düştüğünde size mesaj atacağım.`);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
