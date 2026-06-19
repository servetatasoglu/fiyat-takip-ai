import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { endpoint, keys } = await request.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Geçersiz subscription verisi.' }, { status: 400 });
    }

    await prisma.webPushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PUSH SUBSCRIBE]', err.message);
    return NextResponse.json({ error: 'Subscription kaydedilemedi.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { endpoint } = await request.json();
    await prisma.webPushSubscription.delete({ where: { endpoint } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Silinemedi.' }, { status: 500 });
  }
}
