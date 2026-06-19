import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

/**
 * Stripe checkout — gerçek Stripe key varsa gerçek, yoksa demo modu.
 * Canlıya geçerken STRIPE_SECRET_KEY .env'e eklenir, demo kodu devreye girmez.
 */
export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const hasRealStripe = stripeKey && stripeKey.length > 10 && (
    stripeKey.startsWith('sk_live_') || stripeKey.startsWith('sk_test_')
  );

  // ── GERÇEK STRIPE ──────────────────────────────────────────────────────────
  if (hasRealStripe) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
      }
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user?.isPremium) {
        return NextResponse.json({ error: 'Zaten premium üyesiniz.' }, { status: 400 });
      }
      const checkoutSession = await stripe.checkout.sessions.create({
        customer_email: session.user.email,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium`,
      });
      return NextResponse.json({ url: checkoutSession.url });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── DEMO MODU ──────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const demoSessionId = `demo_${Date.now()}`;
  return NextResponse.json({
    url: `${appUrl}/premium/demo-checkout?session=${demoSessionId}&email=${encodeURIComponent(session.user.email)}`,
    demo: true,
  });
}
