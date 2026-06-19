'use client';

import { useState } from 'react';

const categories = [
  { id: 'all', name: 'Tümü', icon: '🏠' },
  { id: 'electronics', name: 'Elektronik', icon: '📱' },
  { id: 'computers', name: 'Bilgisayar', icon: '💻' },
  { id: 'home', name: 'Ev & Yaşam', icon: '🏠' },
  { id: 'fashion', name: 'Moda', icon: '👕' },
  { id: 'sports', name: 'Spor', icon: '⚽' },
  { id: 'beauty', name: 'Kozmetik', icon: '💄' },
  { id: 'books', name: 'Kitap', icon: '📚' },
  { id: 'toys', name: 'Oyuncak', icon: '🧸' },
  { id: 'automotive', name: 'Otomotiv', icon: '🚗' },
];

export default function CategoryNav({ onCategoryChange, selectedCategory = 'all' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="category-nav-wrapper">
      <button 
        className="category-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="category-icon">📂</span>
        <span className="category-label">Kategoriler</span>
        <span className={`category-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="category-dropdown">
          <div className="category-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => {
                  onCategoryChange(category.id);
                  setIsOpen(false);
                }}
              >
                <span className="category-item-icon">{category.icon}</span>
                <span className="category-item-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
