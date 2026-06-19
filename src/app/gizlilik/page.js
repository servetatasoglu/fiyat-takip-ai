export default function GizlilikPage() {
  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>
        <span style={{ marginRight: '10px' }}>🔒</span>Gizlilik Politikası
      </h1>
      <div className="dashboard-panel" style={{ lineHeight: 2, color: 'var(--text-secondary)', fontSize: '14px' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>1. Toplanan Veriler</h3>
        <p>Platformumuzu kullanırken e-posta adresiniz, tercih ettiğiniz ürünler ve fiyat alarm bilgileriniz toplanır. Kişisel verileriniz üçüncü taraflarla paylaşılmaz.</p>
        
        <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>2. Çerez Kullanımı</h3>
        <p>Sitemiz, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır. Oturum çerezleri ve analitik çerezler kullanılmaktadır.</p>
        
        <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>3. Veri Güvenliği</h3>
        <p>Tüm verileriniz şifreli bağlantılar (SSL/TLS) üzerinden iletilir ve güvenli sunucularda saklanır. KVKK kapsamındaki haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.</p>
        
        <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>4. Üçüncü Taraf Hizmetler</h3>
        <p>Platform, Trendyol, Hepsiburada ve Amazon gibi e-ticaret sitelerinden kamuya açık fiyat bilgilerini toplar. Bu sitelerle doğrudan bir ortaklığımız bulunmamaktadır.</p>
      </div>
    </div>
  );
}
