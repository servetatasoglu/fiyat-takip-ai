'use client';

export default function IletisimPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız!');
  };

  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>
        <span style={{ marginRight: '10px' }}>📞</span>İletişim
      </h1>
      
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="dashboard-panel">
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#818cf8' }}>Bize Ulaşın</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
            Sorularınız, işbirliği talepleriniz veya geri bildirimleriniz için formu doldurabilir veya doğrudan e-posta gönderebilirsiniz.
          </p>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>E-posta</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>destek@fiyattakip.ai</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Çalışma Saatleri</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>Pzt - Cum: 09:00 - 18:00</div>
          </div>
        </div>

        <div className="dashboard-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Adınız Soyadınız</label>
              <input type="text" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(15,23,42,0.5)', color: 'var(--text-primary)', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>E-posta Adresiniz</label>
              <input type="email" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(15,23,42,0.5)', color: 'var(--text-primary)', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Mesajınız</label>
              <textarea rows="4" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(15,23,42,0.5)', color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical' }}></textarea>
            </div>
            <button type="submit" style={{ padding: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
              Mesajı Gönder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
