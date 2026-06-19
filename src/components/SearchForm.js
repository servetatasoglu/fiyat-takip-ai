'use client';

import { useState, useEffect } from 'react';

const TYPEWRITER_TEXTS = [
  "Trendyol'dan ürün linkini buraya yapıştırın...",
  "Hepsiburada ürün linkini analiz edin...",
  "Amazon Türkiye linki ile fiyatı doğrulayın...",
  "Sahte indirimleri anında tespit edin..."
];

export default function SearchForm({ onProductAdded }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [placeholder, setPlaceholder] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = TYPEWRITER_TEXTS[textIndex];
    let timeout;
    
    if (isDeleting) {
      if (charIndex > 0) {
        timeout = setTimeout(() => { setCharIndex(c => c - 1); }, 30);
      } else {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % TYPEWRITER_TEXTS.length);
      }
    } else {
      if (charIndex < currentText.length) {
        timeout = setTimeout(() => { setCharIndex(c => c + 1); }, 60);
      } else {
        timeout = setTimeout(() => { setIsDeleting(true); }, 2000);
      }
    }
    setPlaceholder(currentText.substring(0, charIndex));
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Bir hata oluştu.' });
        return;
      }

      setMessage({ type: 'success', text: data.message });
      setUrl('');

      if (onProductAdded) {
        onProductAdded(data.productId);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Bağlantı hatası. Lütfen tekrar deneyin.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-form-wrapper">
      <form className="track-form" onSubmit={handleSubmit}>
        <input
          id="track-url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder || ' '}
          disabled={loading}
          required
          style={{ fontSize: '18px', padding: '24px 32px', borderRadius: '50px' }}
        />
        <button id="track-submit-btn" type="submit" disabled={loading} style={{ borderRadius: '50px', padding: '0 40px', fontSize: '18px' }}>
          {loading ? (
            <>
              <span className="spinner" />
              Analiz Ediliyor...
            </>
          ) : (
            'İstihbarat Topla'
          )}
        </button>
      </form>
      
      <div className="platform-hints">
        <span>Desteklenenler:</span>
        <span>🟠 Trendyol</span>
        <span>🟠 Hepsiburada</span>
        <span>🟡 Amazon TR</span>
      </div>

      {message && (
        <div className={`form-message ${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}
