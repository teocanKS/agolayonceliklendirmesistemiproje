# 🛡️ Ağ Olay Önceliklendirme Sistemi

Modern, Türkçe ve profesyonel bir Karar Destek Sistemi (KDS). CICIDS2017 Network Intrusion Dataset'i için tasarlanmış, ağ güvenliği olaylarını önceliklendiren ve yöneticilerin kritik kararlara hızlıca ulaşmasını sağlayan dashboard uygulaması.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.0+-777BB4?logo=php)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Stack](#-teknoloji-stack)
- [Kurulum](#-kurulum)
- [Veritabanı Kurulumu](#-veritabanı-kurulumu)
- [Dataset İmport](#-dataset-import)
- [Kullanım](#-kullanım)
- [Önceliklendirme Algoritması](#-önceliklendirme-algoritması)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Güvenlik](#-güvenlik)
- [Performans](#-performans)
- [Sorun Giderme](#-sorun-giderme)

## ✨ Özellikler

### 🎯 Ana Özellikler

- ✅ **Modern Dashboard**: Responsive, kullanıcı dostu arayüz
- 🌓 **Dark/Light Mode**: Göz yormaması için karanlık tema desteği
- 📊 **Gerçek Zamanlı İstatistikler**: Canlı veri güncelleme
- 📈 **İnteraktif Grafikler**: Chart.js ile görselleştirme
- 🔍 **Gelişmiş Filtreleme**: Çoklu filtre seçenekleri
- 🎯 **Öncelik Skorlama**: Akıllı algoritma ile otomatik önceliklendirme
- 📥 **Veri Dışa Aktarma**: CSV ve JSON formatlarında export
- 🔔 **Bildirim Sistemi**: Kritik olaylar için anında uyarı
- 🔐 **Güvenlik**: CSRF koruması, SQL injection önleme
- 📱 **Responsive**: Mobil, tablet ve desktop uyumlu

### 📊 Dashboard Bileşenleri

1. **Özet Kartlar**
   - Toplam olay sayısı
   - Kritik, yüksek, orta, düşük öncelikli olaylar
   - Günlük ortalama istatistikleri

2. **Grafikler**
   - Saatlik olay dağılımı (Line chart)
   - Saldırı tipi dağılımı (Doughnut chart)
   - En çok hedef alınan portlar (Bar chart)
   - Trend analizi (Area chart)

3. **Olay Tablosu**
   - Filtrelenebilir ve sıralanabilir
   - Sayfalama (pagination)
   - Detaylı görünüm
   - Manuel işlem özelliği

4. **Filtre Paneli**
   - Tarih aralığı seçimi
   - Saldırı tipi filtreleme
   - Öncelik seviyesi filtreleme
   - IP ve port filtreleme

## 🛠️ Teknoloji Stack

### Backend
- **PHP 8.0+**: Modern PHP standartları
- **MySQL 8.0+**: İlişkisel veritabanı
- **PDO**: Güvenli veritabanı bağlantısı

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern tasarım, CSS Variables
- **JavaScript (ES6+)**: Modern JavaScript
- **Chart.js 4.4.0**: Grafik kütüphanesi
- **Font Awesome 6.4.2**: İkon kütüphanesi

### Veritabanı
- **CICIDS2017 Dataset**: Network intrusion detection dataset
- **Kaynak**: [Kaggle - CICIDS2017](https://www.kaggle.com/datasets/chethuhn/network-intrusion-dataset)

## 🚀 Kurulum

### Gereksinimler

- PHP 8.0 veya üzeri
- MySQL 8.0 veya üzeri
- Apache/Nginx web sunucusu
- Composer (opsiyonel)

### PHP Gereksinimleri

```bash
php -v  # PHP 8.0+ olmalı
```

Gerekli PHP uzantıları:
- `php-pdo`
- `php-mysql`
- `php-json`
- `php-mbstring`

### Adım 1: Projeyi İndirin

```bash
git clone https://github.com/yourusername/network-event-prioritization.git
cd agolayonceliklendirmesistemiproje
```

### Adım 2: Dizin İzinlerini Ayarlayın

```bash
# Linux/Mac
chmod 755 -R assets/
chmod 777 temp/
chmod 777 logs/

# Windows
# Dizinler için yazma izni verin
```

### Adım 3: Web Sunucusu Ayarları

#### Apache (.htaccess)

Proje klasöründe `.htaccess` dosyası oluşturun:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # HTTPS yönlendirmesi (opsiyonel)
    # RewriteCond %{HTTPS} off
    # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# PHP ayarları
php_value upload_max_filesize 128M
php_value post_max_size 128M
php_value max_execution_time 300
php_value max_input_time 300
```

## 💾 Veritabanı Kurulumu

### 1. MySQL'e Bağlanın

```bash
mysql -u root -p
```

### 2. Şemayı İçe Aktarın

```bash
mysql -u root -p < database/schema.sql
```

VEYA MySQL console'dan:

```sql
SOURCE /path/to/project/database/schema.sql;
```

### 3. Test Verilerini Yükleyin (Opsiyonel)

```bash
mysql -u root -p network_event_system < database/sample_data.sql
```

### 4. Veritabanı Kullanıcısı Oluşturun (Güvenlik İçin Önerilen)

```sql
CREATE USER 'network_user'@'localhost' IDENTIFIED BY 'güçlü_şifre';
GRANT ALL PRIVILEGES ON network_event_system.* TO 'network_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Konfigürasyon Dosyasını Düzenleyin

`config/config.php` dosyasını düzenleyin:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'network_event_system');
define('DB_USER', 'network_user');  // Oluşturduğunuz kullanıcı
define('DB_PASS', 'güçlü_şifre');   // Kullanıcı şifresi
```

## 📦 Dataset İmport

### CICIDS2017 Dataset'i İndirin

1. [Kaggle CICIDS2017 Dataset](https://www.kaggle.com/datasets/chethuhn/network-intrusion-dataset) sayfasına gidin
2. Dataset'i indirin (CSV formatında)
3. CSV dosyasını MySQL'e import edin

### CSV'yi MySQL'e İçe Aktarma

#### Yöntem 1: MySQL LOAD DATA (Hızlı)

```sql
USE network_event_system;

LOAD DATA LOCAL INFILE '/path/to/cicids2017.csv'
INTO TABLE network_events
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

#### Yöntem 2: phpMyAdmin

1. phpMyAdmin'e giriş yapın
2. `network_event_system` veritabanını seçin
3. `network_events` tablosunu seçin
4. "İçe Aktar" (Import) sekmesine gidin
5. CSV dosyanızı seçin
6. İçe aktarın

## 📖 Kullanım

### Dashboard'a Erişim

1. Tarayıcınızda projeyi açın: `http://localhost/agolayonceliklendirmesistemiproje`
2. Dashboard otomatik olarak yüklenir
3. Filtreler kullanarak olayları inceleyin

### Temel İşlemler

#### 1. Olayları Filtreleme

- **Tarih Aralığı**: Sol panelden tarih seçin
- **Hızlı Filtreler**: "Bugün", "Bu Hafta", "Bu Ay" butonlarını kullanın
- **Saldırı Tipi**: İlgilendiğiniz saldırı tiplerini seçin
- **Öncelik Seviyesi**: Kritik, Yüksek, Orta, Düşük
- **Filtrele Butonu**: Filtreleri uygulamak için tıklayın

#### 2. Olay Detayını Görüntüleme

- Tablodaki **👁️ Göz İkonu**'na tıklayın
- Modal pencerede tüm detaylar görüntülenir
- Önerilen aksiyonları okuyun

#### 3. Olayı İşlenmiş İşaretleme

- ✅ **İşaretle Butonu**'na tıklayın
- Onay verin
- Olay "İşlenmiş" olarak işaretlenir

#### 4. Veri Dışa Aktarma

- **CSV** veya **JSON** butonuna tıklayın
- Dosya otomatik indirilir
- Mevcut filtreler uygulanır

### Kısayol Tuşları

- `Ctrl+K` veya `Cmd+K`: Arama kutusuna odaklan

## 🧮 Önceliklendirme Algoritması

### Formül

```
Priority_Score = (Attack_Type_Weight × 40%) +
                 (Traffic_Volume_Score × 25%) +
                 (Port_Criticality × 20%) +
                 (Frequency_Score × 10%) +
                 (Time_Factor × 5%)
```

### Faktörler

#### 1. Saldırı Tipi Ağırlığı (40%)
- **DDoS**: 100
- **Infiltration**: 95
- **DoS Variants**: 85-90
- **Web Attacks**: 65-80
- **Port Scan**: 50
- **BENIGN**: 0

#### 2. Trafik Hacmi (25%)
- Yüksek paket sayısı → Yüksek skor
- Yüksek byte sayısı → Yüksek skor
- Logaritmik normalizasyon

#### 3. Port Kritikliği (20%)
- **RDP (3389)**: 95
- **SSH (22)**: 90
- **HTTPS (443)**: 90
- **HTTP (80)**: 85
- Diğer kritik servisler: 65-85

#### 4. Frekans (10%)
- Tekrar eden saldırılar daha tehlikeli
- 1 olay = 20, 10+ olay = 100

#### 5. Zaman Faktörü (5%)
- Mesai dışı: Şüpheli (70-90)
- Hafta sonu: Çok şüpheli (80)
- Gece yarısı: En şüpheli (90)
- Mesai saati: Normal (40)

### Öncelik Seviyeleri

- **80-100**: 🔴 Kritik
- **60-79**: 🟠 Yüksek
- **40-59**: 🔵 Orta
- **0-39**: 🟢 Düşük

## 📡 API Dokümantasyonu

### GET /api/get_events.php

Olayları listele (filtreleme ve sayfalama ile).

**Parametreler:**
- `page` (int): Sayfa numarası (default: 1)
- `per_page` (int): Sayfa başına kayıt (default: 25, max: 100)
- `order_by` (string): Sıralama kolonu (default: priority_score)
- `order_dir` (string): ASC/DESC (default: DESC)
- `start_date` (date): Başlangıç tarihi (YYYY-MM-DD)
- `end_date` (date): Bitiş tarihi (YYYY-MM-DD)
- `attack_types[]` (array): Saldırı tipleri
- `priority_levels[]` (array): Öncelik seviyeleri
- `source_ip` (string): Kaynak IP
- `destination_ip` (string): Hedef IP
- `destination_port` (int): Hedef port
- `search` (string): Genel arama

### GET /api/get_summary.php

Dashboard özet istatistiklerini getir.

### GET /api/get_event_detail.php

Tek bir olayın detaylarını getir.

**Parametreler:**
- `id` (int): Olay ID (required)

### POST /api/process_event.php

Olayı işlenmiş olarak işaretle.

**Parametreler:**
- `id` (int): Olay ID (required)
- `notes` (string): İşlem notları (optional)
- `csrf_token` (string): CSRF token (required)

### POST /api/update_priority.php

Öncelik skorunu manuel güncelle.

### GET /api/export_data.php

Verileri dışa aktar (CSV/JSON).

## 🔒 Güvenlik

### Uygulanan Güvenlik Önlemleri

✅ **SQL Injection Koruması**
- PDO Prepared Statements
- Parameterized queries
- Input validation

✅ **XSS Koruması**
- `htmlspecialchars()` kullanımı
- Output encoding
- Content Security Policy

✅ **CSRF Koruması**
- Token tabanlı koruma
- Session yönetimi
- Token süresi kontrolü

✅ **Güvenli Headers**
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

✅ **Session Güvenliği**
- HttpOnly cookies
- Secure cookies (HTTPS için)
- Session hijacking koruması

### Production Önerileri

1. **HTTPS Kullanın**
2. **Hata Raporlamayı Kapatın**
3. **Güçlü Şifreler Kullanın**
4. **Dosya İzinlerini Sınırlayın**

## ⚡ Performans

### Optimizasyon Teknikleri

1. **Database Indexing**: Tüm sık sorgulanan kolonlarda index var
2. **Caching**: Dashboard istatistikleri 5 dakika cache'lenir
3. **Lazy Loading**: Grafikler gerektiğinde yüklenir
4. **Pagination**: Büyük veri setleri sayfalandırılır
5. **Minification**: Production'da CSS/JS minify edilmeli

## 🔧 Sorun Giderme

### Veritabanı Bağlantı Hatası

**Hata:** `Database connection failed`

**Çözüm:**
1. MySQL servisinin çalıştığını kontrol edin
2. `config/config.php`'de bağlantı bilgilerini kontrol edin
3. Kullanıcı iznini kontrol edin

```bash
mysql -u network_user -p
```

### Grafik Görüntülenmiyor

**Çözüm:**
1. Tarayıcı console'unda hata kontrolü yapın (F12)
2. Chart.js yüklendiğini kontrol edin
3. API'den veri geldiğini kontrol edin

### Export Çalışmıyor

**Çözüm:**
1. `temp/exports` dizininin yazılabilir olduğunu kontrol edin
2. PHP memory_limit'i arttırın
3. Max execution time'ı arttırın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🙏 Teşekkürler

- **CICIDS2017 Dataset**: Canadian Institute for Cybersecurity
- **Chart.js**: Harika grafik kütüphanesi
- **Font Awesome**: İkon kütüphanesi

---

**Not**: Bu proje CICIDS2017 dataset'i için tasarlanmış eğitim ve araştırma amaçlı bir Karar Destek Sistemi'dir.
