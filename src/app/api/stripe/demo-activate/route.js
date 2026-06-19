import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Demo premium activation — bypasses Stripe for testing.
 * In production, this route should be disabled or protected.
 */
export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email gerekli' }, { status: 400 });
    }

    await prisma.user.updateMany({
      where: { email },
      data: {
        isPremium: true,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
      },
    });

    console.log(`[DEMO] ✅ Premium activated for ${email}`);
    return NextResponse.json({ success: true, message: 'Premium aktif edildi (DEMO)' });
  } catch (err) {
    console.error('[DEMO Activate]', err.message);
    return NextResponse.json({ error: 'Aktivasyon hatası' }, { status: 500 });
  }
}
