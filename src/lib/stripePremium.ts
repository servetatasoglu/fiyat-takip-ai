import { PrismaClient } from '@prisma/client';
// import Stripe from 'stripe'; 

const prisma = new PrismaClient();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

export async function createCheckoutSession(userId: string, email: string) {
  // Mock logic for Stripe Checkout Session Creation
  /*
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PREMIUM_PRICE_ID,
        quantity: 1,
      },
    ],
    metadata: { userId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });
  return session.url;
  */
  return "https://checkout.stripe.com/mock-session";
}

export async function handleStripeWebhook(event: any) {
  // Mock logic for Stripe Webhooks
  /*
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await prisma.user.update({
        where: { id: session.metadata.userId },
        data: {
          isPremium: true,
          stripeCustomerId: session.customer as string,
          premiumUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)) // 1 month from now
        }
      });
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // In a real app, find user by stripeCustomerId
      await prisma.user.updateMany({
        where: { stripeCustomerId: subscription.customer as string },
        data: { isPremium: false }
      });
      break;
  }
  */
  console.log("Stripe Webhook Handler called with event:", event.type);
}
