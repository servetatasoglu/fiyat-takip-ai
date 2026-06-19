import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook hatası: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email;
        if (email) {
          await prisma.user.updateMany({
            where: { email },
            data: {
              isPremium: true,
              premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
              stripeCustomerId: session.customer,
            },
          });
          console.log(`[Stripe] ✅ Premium activated for ${email}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { isPremium: false, premiumUntil: null },
        });
        console.log(`[Stripe] ❌ Premium cancelled for customer ${customerId}`);
        break;
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook]', err.message);
  }

  return NextResponse.json({ received: true });
}
