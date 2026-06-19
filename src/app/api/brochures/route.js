import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brochures = await prisma.brochure.findMany({
      include: {
        items: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Eğer test amaçlı veritabanı boşsa, sahte veri dön
    if (brochures.length === 0) {
      return NextResponse.json([
        {
          id: 1,
          storeName: 'BİM',
          title: '12 Mayıs Aktüel Ürünleri',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          imageUrl: 'https://via.placeholder.com/150x200?text=BIM+Katalog',
          items: [
            { id: 1, name: 'Dijitsu 55 inç TV', price: 9999, category: 'Elektronik' },
            { id: 2, name: 'Fakir Blender Seti', price: 1299, category: 'Mutfak' },
            { id: 3, name: 'Oyuncu Kulaklığı', price: 349, category: 'Aksesuar' }
          ]
        },
        {
          id: 2,
          storeName: 'A101',
          title: 'A101 Aldın Aldın',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          imageUrl: 'https://via.placeholder.com/150x200?text=A101+Katalog',
          items: [
            { id: 4, name: 'Samsung Mikrodalga Fırın', price: 2499, category: 'Mutfak' },
            { id: 5, name: 'Xiaomi Akıllı Saat', price: 899, category: 'Elektronik' }
          ]
        }
      ]);
    }

    return NextResponse.json(brochures);
  } catch (error) {
    console.error('[API /brochures]', error);
    return NextResponse.json({ error: 'Broşürler yüklenemedi' }, { status: 500 });
  }
}
