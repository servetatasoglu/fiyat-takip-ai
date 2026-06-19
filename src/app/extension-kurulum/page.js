export default function ExtensionKurulumPage() {
  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px' }}>
        <span style={{ marginRight: '10px' }}>🔌</span>Chrome Eklentisi Kurulumu
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
        Eklentimiz şu anda Geliştirici Modunda (BETA) çalışmaktadır. Aşağıdaki adımları takip ederek saniyeler içinde Chrome'a kurabilirsiniz.
      </p>

      <div className="dashboard-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>Geliştirici Modunu Açın</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', paddingLeft: '48px' }}>
          Chrome'da adres çubuğuna <code>chrome://extensions/</code> yazın ve enter'a basın.<br/>
          Sağ üst köşedeki <strong>"Geliştirici modu"</strong> (Developer mode) anahtarını açık konuma getirin.
        </p>
      </div>

      <div className="dashboard-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>Eklentiyi Yükleyin</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', paddingLeft: '48px' }}>
          Sol üstteki <strong>"Paketlenmemiş öğe yükle"</strong> (Load unpacked) butonuna tıklayın.<br/>
          Proje klasörünüzün içindeki <code>extension</code> klasörünü seçin.
        </p>
      </div>

      <div className="dashboard-panel" style={{ background: 'rgba(74,222,128,0.05)', borderColor: 'rgba(74,222,128,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#4ade80' }}>Hazırsınız! 🎉</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', paddingLeft: '48px' }}>
          Artık Trendyol, Hepsiburada veya Amazon'da herhangi bir ürün sayfasına girdiğinizde sağ alt köşede <strong>FiyatTakip AI</strong> analiz kartı otomatik olarak belirecektir.
        </p>
      </div>
    </div>
  );
}
