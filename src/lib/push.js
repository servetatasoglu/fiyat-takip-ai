import webpush from 'web-push';
import prisma from './prisma.js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@fiyattakip.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

/**
 * Sends a push notification to all subscribed browsers.
 */
export async function sendPushToAll(payload) {
  const subscriptions = await prisma.webPushSubscription.findMany();
  if (!subscriptions.length) return;

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Expired subscription — remove it
          await prisma.webPushSubscription.delete({ where: { endpoint: sub.endpoint } });
        }
        throw err;
      })
    )
  );

  const ok = results.filter(r => r.status === 'fulfilled').length;
  const fail = results.filter(r => r.status === 'rejected').length;
  console.log(`[PUSH] Sent: ${ok} ok, ${fail} failed`);
}

/**
 * Sends a price drop push notification to all subscribers.
 */
export async function sendPriceDropPush({ productName, currentPrice, productUrl }) {
  const formatted = new Intl.NumberFormat('tr-TR').format(currentPrice);
  return sendPushToAll({
    title: '💰 Fiyat Düştü! — FiyatTakip',
    body: `${productName.slice(0, 60)} → ${formatted} TL`,
    url: productUrl,
    icon: '/icon-192.png',
    badge: '/icon-72.png',
  });
}
