// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze_product') {
    const apiUrl = 'https://fiyat-takip-ai.vercel.app/api/extension/analyze';
    
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: request.url, html: request.html })
    })
    .then(response => response.json())
    .then(data => {
      sendResponse(data);
    })
    .catch(error => {
      console.error('API Error:', error);
      sendResponse({ error: error.message });
    });

    return true; // Asenkron response beklemesi için gerekli
  }
});
