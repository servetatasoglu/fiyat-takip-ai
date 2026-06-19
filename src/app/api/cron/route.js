import { NextResponse } from 'next/server';
import { scheduleAllPriceUpdates } from '@/lib/cron';

export async function GET() {
  try {
    const results = await scheduleAllPriceUpdates();
    return NextResponse.json({
      message: 'Fiyat güncelleme kuyruğa eklendi.',
      results
    });
  } catch (err) {
    console.error('[API /cron]', err.message);
    return NextResponse.json(
      { error: 'Fiyat güncelleme başlatılamadı.' },
      { status: 500 }
    );
  }
}
