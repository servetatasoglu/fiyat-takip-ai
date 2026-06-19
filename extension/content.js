// content.js

// Prevent multiple injections
if (!document.getElementById('fiyat-takip-ai-root')) {
  initExtension();
}

function initExtension() {
  // Sadece ürün sayfalarında çalıştığından emin olmak için basit kontroller
  const url = window.location.href;
  const isProductPage = 
    (url.includes('trendyol.com') && url.includes('-p-')) ||
    (url.includes('hepsiburada.com') && url.includes('-p-')) ||
    (url.includes('amazon.com.tr') && url.includes('/dp/'));

  if (!isProductPage) return;

  // Root container oluştur
  const root = document.createElement('div');
  root.id = 'fiyat-takip-ai-root';
  document.body.appendChild(root);

  // Yükleniyor durumunu göster
  renderLoading(root);

  // Background script'e analizi başlatması için mesaj gönder
  chrome.runtime.sendMessage({ action: 'analyze_product', url: url }, (response) => {
    if (chrome.runtime.lastError || !response || response.error) {
      console.error('FiyatTakip AI Error:', chrome.runtime.lastError || response?.error);
      renderError(root);
      return;
    }
    
    if (response.success && response.data) {
      renderResult(root, response.data);
    } else {
      renderError(root);
    }
  });
}

function renderLoading(container) {
  container.innerHTML = `
    <div class="fiyat-takip-card">
      <div class="fiyat-takip-header">
        <div class="fiyat-takip-brand">🔍 Fiyat<span>Takip</span> AI</div>
        <button class="fiyat-takip-close" onclick="document.getElementById('fiyat-takip-ai-root').remove()">×</button>
      </div>
      <div class="fiyat-takip-loading">
        <div class="fiyat-takip-spinner"></div>
        Ürün analiz ediliyor...
      </div>
    </div>
  `;
}

function renderError(container) {
  container.innerHTML = `
    <div class="fiyat-takip-card">
      <div class="fiyat-takip-header">
        <div class="fiyat-takip-brand">🔍 Fiyat<span>Takip</span> AI</div>
        <button class="fiyat-takip-close" onclick="document.getElementById('fiyat-takip-ai-root').remove()">×</button>
      </div>
      <div style="color: #f87171; font-size: 13px; text-align: center; padding: 10px 0;">
        Analiz yapılamadı. Belki de bu bir ürün sayfası değil.
      </div>
    </div>
  `;
}

function renderResult(container, data) {
  let decisionClass = 'wait';
  let decisionText = '⏳ BEKLE';
  
  if (data.decision === 'BUY') { decisionClass = 'buy'; decisionText = '✅ AL'; }
  else if (data.decision === 'AVOID') { decisionClass = 'avoid'; decisionText = '⚠️ KAÇIN'; }

  let alternativesHtml = '';
  if (data.alternatives && data.alternatives.length > 0) {
    const bestAlt = data.alternatives[0];
    alternativesHtml = `
      <div style="margin-top: 15px; padding: 12px; background: rgba(59, 130, 246, 0.15); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
        <div style="color: #60a5fa; font-weight: bold; font-size: 13px; margin-bottom: 5px;">💡 Daha Ucuz Alternatif Var!</div>
        <div style="font-size: 12px; margin-bottom: 8px;">${bestAlt.name.substring(0, 40)}... sadece <b style="color: #4ade80;">${bestAlt.price} TL</b></div>
        <a href="https://fiyat-takip-ai.vercel.app/urun/${bestAlt.id}" target="_blank" style="display: block; text-align: center; background: #3b82f6; color: white; padding: 6px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 12px;">Oraya Git</a>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="fiyat-takip-card">
      <div class="fiyat-takip-header">
        <div class="fiyat-takip-brand">🤖 Fiyat<span>Takip</span> AI</div>
        <button class="fiyat-takip-close" onclick="document.getElementById('fiyat-takip-ai-root').remove()">×</button>
      </div>
      
      <div class="fiyat-takip-row">
        <span class="fiyat-takip-label">Güven Skoru:</span>
        <span class="fiyat-takip-value" style="color: ${data.trustScore >= 70 ? '#4ade80' : data.trustScore >= 40 ? '#facc15' : '#f87171'}">
          %${Math.round(data.trustScore)}
        </span>
      </div>
      
      <div class="fiyat-takip-row">
        <span class="fiyat-takip-label">Yapay Zeka Kararı:</span>
        <span class="fiyat-takip-value ${decisionClass}">${decisionText}</span>
      </div>
      
      <div class="fiyat-takip-reasoning">
        ${data.reasoning}
      </div>

      ${alternativesHtml}

      <a href="https://fiyat-takip-ai.vercel.app/urun/${data.matchGroupId}" target="_blank" class="fiyat-takip-link" style="margin-top: ${alternativesHtml ? '10px' : '15px'};">
        Detaylı Analizi Gör →
      </a>
    </div>
  `;
}
