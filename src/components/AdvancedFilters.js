'use client';

import { useState } from 'react';

export default function AdvancedFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    platforms: ['trendyol', 'hepsiburada', 'amazon'],
    sortBy: 'price-asc',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handlePlatformToggle = (platform) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    handleFilterChange('platforms', newPlatforms);
  };

  const applyFilters = () => {
    if (onFilterChange) onFilterChange(filters);
  };

  const clearFilters = () => {
    const resetFilters = {
      minPrice: '',
      maxPrice: '',
      platforms: ['trendyol', 'hepsiburada', 'amazon'],
      sortBy: 'price-asc',
    };
    setFilters(resetFilters);
    if (onFilterChange) onFilterChange(resetFilters);
  };

  return (
    <div className="filters-wrapper">
      <div className="filters-header">
        <h3>🔍 Gelişmiş Filtreler</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="clear-filters-btn" onClick={clearFilters}>
            Temizle
          </button>
          <button 
            className="apply-filters-btn" 
            onClick={applyFilters}
            style={{
              padding: '6px 12px',
              background: 'var(--blue-500)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            Uygula
          </button>
        </div>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label className="filter-label">Fiyat Aralığı</label>
          <div className="price-range-inputs">
            <input
              type="number"
              className="filter-input"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
            <span className="price-range-separator">-</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Sıralama</label>
          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
            <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
            <option value="trust-desc">Güven Skoru: Yüksekten Düşüğe</option>
            <option value="date-desc">Son Güncelleme</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Platformlar</label>
          <div className="platform-checkboxes">
            {['trendyol', 'hepsiburada', 'amazon'].map((platform) => (
              <label key={platform} className="platform-checkbox">
                <input
                  type="checkbox"
                  checked={filters.platforms.includes(platform)}
                  onChange={() => handlePlatformToggle(platform)}
                />
                <span style={{ textTransform: 'capitalize' }}>{platform}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
