import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const platform = searchParams.get('platform') || 'unknown';
  const productId = searchParams.get('pid');

  if (!url) {
    return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });
  }

  // Track click asynchronously (don't block redirect)
  try {
    await prisma.affiliateClick.create({
      data: {
        platform,
        productId: productId ? parseInt(productId) : null,
        url: url.substring(0, 500),
        createdAt: new Date(),
      }
    });
  } catch {
    // Non-blocking - click tracking failure doesn't break redirect
  }

  // Build affiliate URL with partner parameters
  let affiliateUrl = url;
  try {
    const parsed = new URL(url);
    
    if (platform === 'trendyol' && process.env.TRENDYOL_AFFILIATE_ID) {
      parsed.searchParams.set('partnerId', process.env.TRENDYOL_AFFILIATE_ID);
      affiliateUrl = parsed.toString();
    } else if (platform === 'hepsiburada' && process.env.HB_AFFILIATE_ID) {
      parsed.searchParams.set('pid', process.env.HB_AFFILIATE_ID);
      affiliateUrl = parsed.toString();
    } else if (platform === 'amazon' && process.env.AMAZON_AFFILIATE_TAG) {
      parsed.searchParams.set('tag', process.env.AMAZON_AFFILIATE_TAG);
      affiliateUrl = parsed.toString();
    }
  } catch {
    affiliateUrl = url;
  }

  return NextResponse.redirect(affiliateUrl, { status: 302 });
}
