import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const alerts = await prisma.priceAlert.findMany({
      include: {
        matchGroup: {
          include: {
            listings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(alerts);
  } catch (err) {
    console.error('[API /alerts GET]', err.message);
    return NextResponse.json(
      { error: 'Alarmlar getirilemedi.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { matchGroupId, targetPrice, email, whatsappNumber } = body;

    if (!matchGroupId || !targetPrice) {
      return NextResponse.json({ error: 'Eksik veri.' }, { status: 400 });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        matchGroupId: parseInt(matchGroupId, 10),
        targetPrice: parseFloat(targetPrice),
        email: email || null,
        whatsappNumber: whatsappNumber || null,
      }
    });

    return NextResponse.json({
      message: 'Fiyat alarmı başarıyla kuruldu!',
      alert
    });
  } catch (err) {
    console.error('[API /alerts POST]', err.message);
    return NextResponse.json(
      { error: 'Fiyat alarmı kurulamadı.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
    await prisma.priceAlert.delete({ where: { id: parseInt(id, 10) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API /alerts DELETE]', err.message);
    return NextResponse.json({ error: 'Alarm silinemedi.' }, { status: 500 });
  }
}
