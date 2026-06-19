import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

// Convert name to SEO-friendly slug
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Extract ID from slug (format: "product-name-123")
function slugToId(slug) {
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  const id = parseInt(lastPart, 10);
  return isNaN(id) ? null : id;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slugToId(slug);
  if (!id) return { title: 'Ürün Bulunamadı' };

  try {
    const mg = await prisma.matchGroup.findUnique({
      where: { id },
      include: {
        listings: { include: { prices: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        aiAnalysis: true,
      },
    });
    if (!mg) return { title: 'Ürün Bulunamadı' };

    let cheapestPrice = null;
    mg.listings.forEach(l => {
      const p = l.prices[0]?.price;
      if (p && (cheapestPrice === null || p < cheapestPrice)) cheapestPrice = p;
    });

    const priceStr = cheapestPrice
      ? ` — ${new Intl.NumberFormat('tr-TR').format(cheapestPrice)} TL`
      : '';

    const platforms = [...new Set(mg.listings.map(l => l.platform))].join(', ');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
      title: `${mg.canonicalName}${priceStr} | FiyatTakip`,
      description: `${mg.canonicalName} ürününün ${platforms} fiyatlarını karşılaştırın. Fiyat geçmişi, sahte indirim tespiti ve yapay zeka analizi ile en iyi fiyatı bulun.`,
      keywords: [mg.canonicalName, 'fiyat karşılaştırma', 'fiyat takip', platforms, 'indirim', 'türkiye'],
      openGraph: {
        title: `${mg.canonicalName}${priceStr}`,
        description: `Gerçek zamanlı fiyat analizi — Sahte indirim tespiti — AI karar desteği`,
        url: `${appUrl}/urun/${slug}`,
        type: 'website',
      },
      alternates: {
        canonical: `${appUrl}/urun/${slug}`,
      },
    };
  } catch {
    return { title: 'FiyatTakip' };
  }
}

export default async function UrunPage({ params }) {
  const { slug } = await params;
  const id = slugToId(slug);
  if (!id) notFound();

  // Verify product exists
  const mg = await prisma.matchGroup.findUnique({ where: { id } });
  if (!mg) notFound();

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: mg.canonicalName,
    description: `${mg.canonicalName} fiyat karşılaştırma ve takip`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient id={id} />
    </>
  );
}
