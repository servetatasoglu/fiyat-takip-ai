const API_BASE_URL = 'https://fiyat-takip-ai.vercel.app'; // TODO: Update during build for Production (e.g. process.env.NEXT_PUBLIC_API_URL)

(async function() {
  let lastAnalyzedUrl = '';

  // MutationObserver to handle SPA navigations (Trendyol, Hepsiburada)
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastAnalyzedUrl) {
      lastAnalyzedUrl = window.location.href;
      initFiyatTakip();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial run
  lastAnalyzedUrl = window.location.href;
  initFiyatTakip();

  async function initFiyatTakip() {
    const currentUrl = window.location.href;

    // Sadece ürün sayfalarında çalış
    if (!currentUrl.includes('-p-') && !currentUrl.includes('/dp/') && !currentUrl.includes('/pm-')) {
      return;
    }

    // Remove existing overlay if present from previous SPA navigation
    const existingHost = document.getElementById('fiyat-takip-ai-host');
    if (existingHost) {
      existingHost.remove();
    }

    try {
      // 1. Ürünü takip et veya bilgilerini güncelle
      const res = await fetch(`${API_BASE_URL}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl })
      });

      if (!res.ok) return;
      const data = await res.json();
      
      if (data.matchGroupId) {
        // 2. Analiz sonuçlarını getir
        const detailRes = await fetch(`${API_BASE_URL}/api/products/${data.matchGroupId}`);
        if (!detailRes.ok) return;
        
        const detailData = await detailRes.json();
        showOverlay(detailData);
      }
    } catch (err) {
      console.error("FiyatTakip AI Error:", err);
    }
  }

  function showOverlay(product) {
    if (document.getElementById('fiyat-takip-ai-host')) return;

    const ai = product.aiAnalysis;
    if (!ai) return;

    let decisionText, color, bg;
    if (ai.decision === 'BUY') {
      decisionText = 'AL - Gerçek İndirim!';
      color = '#4ade80';
      bg = 'rgba(74, 222, 128, 0.1)';
    } else if (ai.decision === 'AVOID') {
      decisionText = 'UZAK DUR - Sahte İndirim!';
      color = '#f87171';
      bg = 'rgba(248, 113, 113, 0.1)';
    } else {
      decisionText = 'BEKLE - Fiyat Normal';
      color = '#facc15';
      bg = 'rgba(250, 204, 21, 0.1)';
    }

    // 1. Create Shadow DOM Host
    const host = document.createElement('div');
    host.id = 'fiyat-takip-ai-host';
    document.body.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: 'closed' });

    // 2. Inject CSS Link into Shadow DOM
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('content.css');
    shadowRoot.appendChild(styleLink);

    // 3. Create the UI
    const overlay = document.createElement('div');
    overlay.id = 'fiyat-takip-ai-overlay';
    
    let cheaperAlternativeHtml = '';
    if (product.cheaperAlternative) {
      cheaperAlternativeHtml = `
        <a href="${product.cheaperAlternative.affiliateUrl}" target="_blank" style="display:block; background: #fbbf24; color: #1e293b; padding: 10px; text-align: center; border-radius: 6px; font-weight: bold; margin-top: 12px; text-decoration: none;">
          💰 Daha Ucuza ${product.cheaperAlternative.platform}'da Bulundu (${product.cheaperAlternative.price} TL) ➔
        </a>
      `;
    }

    overlay.innerHTML = `
      <div class="fiyat-takip-header">
        <span>🤖 FiyatTakip AI</span>
        <span class="fiyat-takip-close">✕</span>
      </div>
      <div class="fiyat-takip-body">
        <div class="fiyat-takip-decision" style="color: ${color}; background: ${bg}; border: 1px solid ${color}">
          ${decisionText}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Gerçek Piyasa Değeri:</strong> <span style="color: #60a5fa">${ai.marketValue ? ai.marketValue.toLocaleString('tr-TR') + ' TL' : 'Hesaplanamadı'}</span>
        </div>
        <div style="color: #94a3b8; font-size: 12px; margin-bottom: 12px; border-left: 2px solid #334155; padding-left: 8px;">
          ${ai.reasoning}
        </div>
        ${cheaperAlternativeHtml}
        <a href="${API_BASE_URL}/product/${product.id}" target="_blank" class="fiyat-takip-btn">Detaylı Analiz Raporu →</a>
      </div>
    `;

    shadowRoot.appendChild(overlay);

    shadowRoot.querySelector('.fiyat-takip-close').addEventListener('click', () => {
      overlay.style.opacity = '0';
      setTimeout(() => host.remove(), 300);
    });
  }
})();
