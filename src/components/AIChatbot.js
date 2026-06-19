'use client';

import { useState, useRef, useEffect } from 'react';

const SUGGESTIONS = [
  'Bu fiyat iyi mi?',
  'Ne zaman alsam en ucuz olur?',
  'Sahte indirim mi?',
  'Kargo dahil en ucuz platform hangisi?',
];

export default function AIChatbot({ context }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Merhaba! Ben FiyatZeka asistanınım. Ürün hakkında sorularınızı yanıtlayabilirim!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Hata oluştu.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ Bağlantı hatası. Lütfen tekrar deneyin.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="AI Asistanı Aç"
        style={{
          position: 'fixed', bottom: '90px', right: '24px', zIndex: 8000,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #1d4ed8)',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '160px', right: '24px', zIndex: 8000,
          width: '360px', maxWidth: 'calc(100vw - 48px)',
          background: 'rgba(15,23,42,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '480px',
          animation: 'slideIn 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>FiyatZeka AI</div>
              <div style={{ fontSize: '11px', color: '#a78bfa' }}>● Çevrimiçi</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)'
                    : 'rgba(30,41,59,0.8)',
                  border: m.role === 'assistant' ? '1px solid rgba(124,58,237,0.15)' : 'none',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: '#fff',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', background: 'rgba(30,41,59,0.8)', borderRadius: '16px 16px 16px 4px', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <span className="loading-dots"><span/><span/><span/></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '8px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid rgba(30,41,59,0.8)' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: '#a78bfa',
                    cursor: 'pointer',
                  }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(30,41,59,0.8)', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Soru sorun..."
              style={{
                flex: 1, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #1d4ed8)',
                border: 'none', borderRadius: '8px', padding: '8px 14px',
                color: '#fff', cursor: 'pointer', fontSize: '16px',
                opacity: !input.trim() || loading ? 0.5 : 1,
              }}
            >↑</button>
          </div>
        </div>
      )}
    </>
  );
}
