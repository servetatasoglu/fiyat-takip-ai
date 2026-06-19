import prisma from './prisma.js';
import { scrapeProduct } from './scrapers/index.js';
import { jobQueue } from './queue.js';

let isScheduling = false;

/**
 * Checks all active PriceAlerts and fires email/push if triggered.
 */
async function checkAlerts() {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: { isTriggered: false },
      include: {
        matchGroup: {
          include: {
            listings: {
              include: {
                prices: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    for (const alert of alerts) {
      const mg = alert.matchGroup;
      if (!mg?.listings?.length) continue;

      // Find cheapest current price across all listings
      let cheapestPrice = null;
      let cheapestUrl = null;
      for (const listing of mg.listings) {
        const latestPrice = listing.prices?.[0]?.price;
        if (latestPrice && (cheapestPrice === null || latestPrice < cheapestPrice)) {
          cheapestPrice = latestPrice;
          cheapestUrl = listing.url;
        }
      }

      if (!cheapestPrice || cheapestPrice > alert.targetPrice) continue;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const productUrl = `${appUrl}/product/${mg.id}`;
      const productName = mg.canonicalName || 'Ürün';

      console.log(`[ALERT] 🎯 Triggered! "${productName}" — ${cheapestPrice} TL (target: ${alert.targetPrice} TL)`);

      // Send email if configured (dynamic import to avoid webpack bundling Node.js modules)
      if (alert.email) {
        const { sendPriceDropEmail } = await import('./email.js');
        await sendPriceDropEmail({
          to: alert.email,
          productName,
          targetPrice: alert.targetPrice,
          currentPrice: cheapestPrice,
          productUrl,
        });
      }

      // Send push to all browser subscribers (dynamic import)
      const { sendPriceDropPush } = await import('./push.js');
      await sendPriceDropPush({ productName, currentPrice: cheapestPrice, productUrl });

      // Send Telegram notification if bot configured
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const alertMessage = `📉 *Fiyat Düştü!*\n\n*${productName}*\n💰 Şu an: *${cheapestPrice.toFixed(2)} TL*\n🎯 Hedef: ${alert.targetPrice} TL\n\n[Ürünü İncele](${productUrl})`;

      if (telegramToken) {
        try {
          if (alert.telegramChatId) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: alert.telegramChatId, text: alertMessage, parse_mode: 'Markdown' }),
            });
          }
        } catch (tgErr) {
          console.warn('[ALERT] Telegram notification failed:', tgErr.message);
        }
      }

      // Send WhatsApp notification via Twilio if configured
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. whatsapp:+14155238886

      if (twilioSid && twilioAuth && twilioPhone && alert.whatsappNumber) {
        try {
          const toWhatsApp = alert.whatsappNumber.startsWith('whatsapp:') ? alert.whatsappNumber : `whatsapp:${alert.whatsappNumber}`;
          const params = new URLSearchParams({
            To: toWhatsApp,
            From: twilioPhone,
            Body: alertMessage.replace(/\*/g, '*') // Twilio WhatsApp uses markdown too
          });

          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')
            },
            body: params.toString()
          });
          console.log(`[ALERT] WhatsApp message sent to ${toWhatsApp}`);
        } catch (waErr) {
          console.warn('[ALERT] WhatsApp notification failed:', waErr.message);
        }
      }

      // Mark as triggered
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { isTriggered: true, notifiedAt: new Date() },
      });

    }
  } catch (err) {
    console.error('[ALERT CHECK] Error:', err.message);
  }
}

/**
 * Pushes all listings to the queue for updating.
 */
export async function scheduleAllPriceUpdates() {
  if (isScheduling) return { skipped: true };
  isScheduling = true;

  try {
    const listings = await prisma.platformListing.findMany({
      where: { isActive: true }
    });
    
    console.log(`[CRON] Scheduling ${listings.length} listings for update.`);

    for (const listing of listings) {
      jobQueue.add(async () => {
        try {
          const scrapedData = await scrapeProduct(listing.url);
          if (scrapedData.success) {
             await prisma.priceHistory.create({
               data: {
                 price: scrapedData.price,
                 oldPrice: scrapedData.oldPrice,
                 listingId: listing.id,
               },
             });
             console.log(`[QUEUE] ✓ Updated: ${listing.rawTitle} (${listing.platform})`);

             // Broadcast SSE real-time update to connected clients
             try {
               const { broadcastPriceUpdate } = await import('@/lib/streamUtils');
               broadcastPriceUpdate({
                 type: 'price_update',
                 productId: listing.matchGroupId,
                 productName: listing.rawTitle,
                 platform: listing.platform,
                 currentPrice: scrapedData.price,
               });
             } catch { /* SSE broadcast is non-critical */ }

          } else {
             console.error(`[QUEUE] ✗ Failed: ${listing.url}`);
          }
        } catch(e) {
          console.error(`[QUEUE] Error processing ${listing.url}:`, e);
        }
      });
    }

    // After all updates, check alerts
    jobQueue.add(async () => {
      console.log('[CRON] Checking price alerts...');
      await checkAlerts();
    });

    return { scheduled: listings.length };
  } catch (err) {
    console.error('[CRON] Fatal error:', err.message);
  } finally {
    isScheduling = false;
  }
}

/**
 * Checks if it's time to run (08:00 Istanbul time) and hasn't run today.
 */
let lastRunDate = null;

function shouldRun() {
  const now = new Date();
  const istanbulTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' })
  );
  const hour = istanbulTime.getHours();
  const todayStr = istanbulTime.toDateString();

  if (hour >= 8 && lastRunDate !== todayStr) {
    lastRunDate = todayStr;
    return true;
  }
  return false;
}

/**
 * Starts a simple interval-based scheduler.
 */
export function initScheduler() {
  console.log('[SCHEDULER] Starting background scheduler.');

  setInterval(() => {
    if (shouldRun()) {
      scheduleAllPriceUpdates();
    }
  }, 30 * 60 * 1000);

  if (shouldRun()) {
    scheduleAllPriceUpdates();
  }
}
