'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AdvancedSearch({ onSearch, products }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef(null);

  function nameToSlug(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce API search
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
          setShowSuggestions(true);
        }
      } catch {
        // fallback to local filter
        if (products && Array.isArray(products)) {
          const filtered = products
            .filter(p => p?.name?.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 6);
          setSuggestions(filtered);
          setShowSuggestions(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(debounceRef.current);
  }, [query, products]);

  const handleSelect = (product) => {
    if (!product) return;
    setQuery(product.name || '');
    setShowSuggestions(false);
    if (onSearch) onSearch(product);
  };

  const formatPrice = (p) => p ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(p) : '—';

  return (
    <div className="advanced-search-wrapper" style={{ position: 'relative' }}>
      <div className="search-input-wrapper" style={{ position: 'relative' }}>
        <input
          type="text"
          id="product-search-input"
          className="search-input"
          placeholder="Ürün ara... (örn: iPhone, Samsung, robot süpürge)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoComplete="off"
        />
        <span className="search-icon" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
          {isLoading ? (
            <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--blue-400)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : '🔍'}
        </span>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions" style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--gray-900)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 999,
          overflow: 'hidden',
        }}>
          {suggestions.map((product) => (
            <Link
              key={product.id}
              href={`/urun/${nameToSlug(product.name)}-${product.id}`}
              className="suggestion-item"
              onClick={() => handleSelect(product)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-800)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {product.image ? (
                <img src={product.image} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', background: 'var(--gray-800)', flexShrink: 0 }} />
              ) : (
                <span style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-800)', borderRadius: '6px', fontSize: '18px', flexShrink: 0 }}>🛍️</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {product.platforms?.join(' · ')}
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--green-400)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {formatPrice(product.currentPrice)} TL
              </div>
            </Link>
          ))}
          <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Enter ile tüm sonuçları gör
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !isLoading && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--gray-900)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
          zIndex: 999,
        }}>
          "{query}" için sonuç bulunamadı
        </div>
      )}
    </div>
  );
}
