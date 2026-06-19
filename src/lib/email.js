import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a price drop notification email.
 */
export async function sendPriceDropEmail({ to, productName, targetPrice, currentPrice, productUrl }) {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-gmail@gmail.com') {
    console.log(`[EMAIL] Skipped (SMTP not configured). Would send to: ${to}`);
    return { skipped: true };
  }

  const discount = Math.round(((targetPrice - currentPrice) / targetPrice) * 100);
  const formattedCurrent = new Intl.NumberFormat('tr-TR').format(currentPrice);
  const formattedTarget = new Intl.NumberFormat('tr-TR').format(targetPrice);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Fiyat Düştü! 🎉</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#161b22;border-radius:16px;overflow:hidden;border:1px solid #30363d;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:32px 32px 24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:24px;">📉</span>
        <span style="font-size:20px;font-weight:800;color:#fff;">FiyatTakip</span>
      </div>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;">Fiyat Hedefine Ulaştı! 🎉</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Takip ettiğiniz ürünün fiyatı düştü.</p>
    </div>

    <!-- Product Info -->
    <div style="padding:24px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#8b949e;line-height:1.6;">${productName}</p>

      <div style="display:flex;gap:20px;background:#0d1117;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="flex:1;text-align:center;">
          <div style="font-size:11px;color:#6e7681;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Güncel Fiyat</div>
          <div style="font-size:28px;font-weight:900;color:#22c55e;">${formattedCurrent} TL</div>
        </div>
        <div style="width:1px;background:#30363d;"></div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:11px;color:#6e7681;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Hedef Fiyat</div>
          <div style="font-size:28px;font-weight:900;color:#8b949e;">${formattedTarget} TL</div>
        </div>
      </div>

      ${discount > 0 ? `
      <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:center;">
        <span style="color:#22c55e;font-weight:700;font-size:16px;">✅ Hedef fiyatın %${Math.abs(discount)} altında!</span>
      </div>` : ''}

      <a href="${productUrl}" 
         style="display:block;background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;text-decoration:none;padding:16px 24px;border-radius:10px;text-align:center;font-weight:700;font-size:16px;letter-spacing:0.3px;">
        Ürüne Git &rarr;
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #30363d;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6e7681;">
        Bu bildirimi <a href="${appUrl}/alerts" style="color:#58a6ff;">alarm ayarlarınızdan</a> kapatabilirsiniz.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'FiyatTakip <noreply@fiyattakip.com>',
      to,
      subject: `💰 Fiyat Düştü! ${productName.slice(0, 40)}...`,
      html,
    });
    console.log(`[EMAIL] ✓ Sent price drop to ${to}`);
    return { success: true };
  } catch (err) {
    console.error(`[EMAIL] ✗ Failed to send to ${to}:`, err.message);
    return { error: err.message };
  }
}
