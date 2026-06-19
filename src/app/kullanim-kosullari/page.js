export default function KullanimKosullariPage() {
  return (
    <div className="container fade-in" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>
        <span style={{ marginRight: '10px' }}>📜</span>Kullanım Koşulları
      </h1>
      <div className="dashboard-panel" style={{ lineHeight: 2, color: 'var(--text-secondary)', fontSize: '14px' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>1. Hizmetin Kapsamı</h3>
        <p>FiyatTakip, internet üzerindeki kamuya açık e-ticaret sitelerinden fiyat verilerini toplayarak karşılaştırma ve yapay zeka destekli analiz hizmeti sunar. Platform üzerinden doğrudan satış yapılmamaktadır.</p>
        
        <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>2. Sorumluluk Reddi</h3>
        <p>Sitemizde yer alan fiyatlar, ürün stok bilgileri ve yapay zeka değerlendirmeleri (AL/BEKLE/KAÇIN) yalnızca bilgilendirme amaçlıdır. Nihai satın alma kararı kullanıcıya aittir ve fiyat değişikliklerinden platformumuz sorumlu tutulamaz.</p>
        
        <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>3. Kullanıcı Yükümlülükleri</h3>
        <p>Kullanıcılar platformu yasalara uygun, platformun işleyişini aksatmayacak ve diğer kullanıcılara zarar vermeyecek şekilde kullanmayı kabul eder. Otomatik veri çekme (scraping) ve bot kullanımı kesinlikle yasaktır.</p>
        
        <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>4. Premium Hizmetler</h3>
        <p>Premium üyelik hizmetlerimiz ücretlidir ve iptal koşulları üyelik sözleşmesinde belirtilmiştir. Abonelik iptali durumunda, ödenmiş fatura döneminin sonuna kadar hizmet devam eder.</p>
      </div>
    </div>
  );
}
