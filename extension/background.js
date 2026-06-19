// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze_product') {
    const apiUrl = 'http://localhost:3000/api/extension/analyze';
    
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: request.url })
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
