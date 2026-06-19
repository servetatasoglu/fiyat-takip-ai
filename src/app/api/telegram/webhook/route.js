/**
 * Telegram Bot webhook endpoint
 * Setup: curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook?url={APP_URL}/api/telegram/webhook"
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, text, options = {}) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...options }),
  });
}

export async function POST(request) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ ok: true }); // Silently ignore if not configured
  }

  const body = await request.json();
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat?.id;
  const text = message.text?.trim() || '';
  const [command, ...args] = text.split(' ');

  try {
    switch (command) {
      case '/start':
      case '/yardim':
        await sendTelegramMessage(chatId,
          `🤖 *FiyatTakip Bot'a Hoş Geldiniz!*\n\n` +
          `Kullanılabilir komutlar:\n` +
          `📋 /listele — Takip edilen ürünleri göster\n` +
          `🔔 /alarmlar — Aktif alarmlarınızı listele\n` +
          `📊 /durum — Sistem durumunu göster\n` +
          `❓ /yardim — Bu yardım mesajını göster`
        );
        break;

      case '/listele': {
        const groups = await prisma.matchGroup.findMany({
          take: 10,
          include: { listings: { include: { prices: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
          orderBy: { id: 'desc' },
        });

        if (!groups.length) {
          await sendTelegramMessage(chatId, '📭 Henüz takip edilen ürün yok.');
          break;
        }

        const lines = groups.map(g => {
          const cheapest = g.listings.reduce((min, l) => {
            const p = l.prices[0]?.price;
            return (!min || (p && p < min.price)) ? { price: p, platform: l.platform } : min;
          }, null);
          return `• *${g.canonicalName?.substring(0, 40)}...*\n  💰 ${cheapest?.price?.toFixed(2) || '—'} TL (${cheapest?.platform || '—'})`;
        });

        await sendTelegramMessage(chatId, `📋 *Son 10 Takip Edilen Ürün:*\n\n${lines.join('\n\n')}`);
        break;
      }

      case '/alarmlar': {
        const alerts = await prisma.priceAlert.findMany({
          take: 10,
          where: { triggered: false },
          include: { matchGroup: true },
          orderBy: { createdAt: 'desc' },
        });

        if (!alerts.length) {
          await sendTelegramMessage(chatId, '🔕 Aktif alarm yok.');
          break;
        }

        const lines = alerts.map(a =>
          `🔔 *${a.matchGroup?.canonicalName?.substring(0, 35)}...*\n  Hedef: ${a.targetPrice} TL`
        );
        await sendTelegramMessage(chatId, `🔔 *Aktif Alarmlar (${alerts.length}):*\n\n${lines.join('\n\n')}`);
        break;
      }

      case '/durum': {
        const [productCount, alertCount] = await Promise.all([
          prisma.matchGroup.count(),
          prisma.priceAlert.count({ where: { triggered: false } }),
        ]);

        await sendTelegramMessage(chatId,
          `📊 *Sistem Durumu:*\n\n` +
          `📦 Takip edilen ürün: *${productCount}*\n` +
          `🔔 Aktif alarm: *${alertCount}*\n` +
          `🟢 Sistem: Çalışıyor`
        );
        break;
      }

      default:
        await sendTelegramMessage(chatId, '❓ Bilinmeyen komut. /yardim yazın.');
    }
  } catch (err) {
    console.error('[Telegram Bot]', err.message);
    await sendTelegramMessage(chatId, '❌ Bir hata oluştu. Lütfen tekrar deneyin.');
  }

  return NextResponse.json({ ok: true });
}
