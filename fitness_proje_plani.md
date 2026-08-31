# Kişisel Akıllı Fitness & PT Platformu (Lumino Re-Platforming)
## Proje Mimari, Gereksinim ve Uygulama Şartnamesi

---

## 1. Yönetici Özeti ve Dönüşüm Kapsamı (Refactoring)
Mevcut canlı ortamda bulunan **Lumino AI** projesinin canlı altyapısı (Vercel deployment, bağlı domain/subdomain, DNS kayıtları ve izole Supabase veritabanı örneği) korunarak içeriği tamamen sıfırlanacaktır.

* **Altyapı Durumu:** Sıfırdan domain/hosting kurulumu yapılmayacak; mevcut Vercel pipeline'ı ve Supabase bağlantı anahtarları korunacaktır.
* **Veritabanı Katmanı:** Supabase üzerindeki eski tablolar temizlenerek fitness ve antrenman takibi odaklı yeni ilişkisel şema kurulacaktır.
* **Uygulama Amacı:** Yalnızca tek bir kullanıcının erişimine açık, yapay zeka destekli, dinamik programlama yeteneğine sahip, mobil ve tablet öncelikli kişisel antrenman (Personal Trainer) ve vücut kompozisyonu takip platformu.

---

## 2. Kullanıcı Profili ve Fiziksel Hedefler

| Parametre | Değer / Durum | Stratejik Anlamı |
| :--- | :--- | :--- |
| **Boy / Kilo** | 1.80 m / 100 kg | Dış görünüş 80 kg algısı; yüksek iskelet ve kas kütlesi altyapısı. |
| **Mevcut Durum** | Son 1.5 yılda sedanterleşme (+20 kg) | "Dirty bulk" etkisi; hızlı kilo alımı ve metabolik adaptasyon. |
| **Spor Geçmişi** | Eski sporcu altyapısı, yazılımcı çalışma düzeni | Kas hafızası (muscle memory) avantajı yüksek. |
| **Hedef Süreç** | **Body Recomposition / Lean Cut** | Saf kilo kaybından ziyade kas kütlesini artırarak yağı yakmak. |
| **Beslenme Durumu** | İştah yüksek, porsiyonlar hacimli | Katı açlık yerine protein ağırlıklı ve tokluk sağlayan makro dengesi. |

---

## 3. Ekipman Envanteri ve Antrenman Stratejisi

### Mevcut Donanım:
1. **Ayarlanabilir Dambıl Çifti:** Her biri maksimum **24.5 kg** (toplam ~50 kg direnç kapasitesi).
2. **Ab-Wheel (Karın Tekeri):** Merkez bölge (core) ve anti-extension kuvveti için birincil araç.
3. **Barfiks Demiri (Zorunlu Öneri):** Evde dambıl ile yatay çekiş (Dumbbell Row) mükemmel yapılsa da, sırt genişliği ve kanat (latissimus dorsi) gelişimi için dikey çekiş (Vertical Pull) vazgeçilmezdir. Kapı veya duvar tipi bir barfiks barı sisteme dahil edilmelidir.

---

## 4. Temel Sistem Özellikleri ve Dinamik Mantık

### 4.1. Dinamik Sarkma Algoritması (Rotating Queue)
Statik gün takvimi ("Pazartesi Göğüs, Çarşamba Sırt") yerine **Döngü Tabanlı Sıralama** uygulanır:
* Antrenmanlar takvim gününe değil, döngü sırasına bağlıdır.
* Çarşamba yapılması planlanan antrenman aksarsa, Perşembe uygulamaya girildiğinde doğrudan o seans karşınıza gelir.
* Ardışık kas grubu çakışmalarını önlemek için sistem kas toparlanma süresini (en az 24-48 saat) denetler ve sonraki günleri otomatik olarak ileri öteler.

### 4.2. Odak Modu Antrenman Ekranı (Workout Player)
* **Tam Ekran Odaklanma:** Egzersiz anında ekranda yalnızca ilgili hareket, hedef ağırlık ve hedef tekrar görünür.
* **Tek Dokunuşla Onay:** Hedeflenen set tamamlandığında tek dokunuşla loglanır.
* **Anlık Sapma Girişi:** Kullanıcı hedef setten fazla ya da az yaptıysa hızlı `+` / `-` butonlarıyla ağırlık ve tekrarı düzeltebilir.
* **Otomatik Dinlenme Sayacı:** Set onaylandığında otomatik geri sayım sayacı başlar ve süre bitiminde sesli/titreşimli uyarı verir.

### 4.3. Ölçüm ve Tartım Rutinleri
* **Kilo Takibi:** Haftada 3-4 gün sabah aç karnına tartım. Günlük su dalgalanmalarını filtrelemek için 7 günlük hareketli ortalama (moving average) baz alınır.
* **Çevre Ölçümleri (Mezura):** Başlangıçta haftalık/iki haftalık periyotlarla bel (göbek deliği hizası), kol (soğuk/sıkılı) ve göğüs ölçümleri kaydedilir. Bel daralırken kilo sabit kalıyorsa recomposition başarısı doğrulanır.

---

## 5. UI/UX Tasarım İlkeleri

* **Koyu / Klişe "AI" Temalarından Kaçınma:** Klasik siyah, neon mor veya agresif temalar kesinlikle kullanılmayacaktır.
* **Renk Paleti:**
  * Arka Plan: Sıcak kırık beyaz / açık buz grisi (`#F8FAFC`, `#F9FBF9`)
  * Kartlar ve Yüzeyler: Temiz beyaz, hafif yumuşak gölgeli modern paneller (`shadow-sm`, `rounded-2xl`)
  * Vurgu ve Enerji: Doğal nane/adaçayı yeşili (`Emerald-500`) ve sıcak kehribar (`Amber-500`)
* **Duyarlılık (Responsive):**
  * **Mobil ve Tablet Öncelikli:** Geniş dokunmatik alanlar, başparmak dostu alt navigasyon çubuğu (Bottom Navigation).
  * Masaüstü desteği temiz ve dengeli grid yapısıyla korunacaktır.
* **Giriş ve Güvenlik:**
  * Karmaşık e-posta aktivasyonları veya SMS onayları yoktur.
  * Kullanıcı adı + 4-6 haneli PIN kodu doğrulaması ile hızlı kilit ekranı.

---

## 6. Kişisel Yapay Zeka Antrenörü (AI PT Entegrasyonu)

AI sadece metin üreten bir sohbet botu değil, **veritabanını aktif olarak yöneten bir karar motorudur**:

```
+-------------------------------------------------------------------------+
|                              GİRDİLER                                   |
| - Son antrenman tamamlama oranları ve RPE / tükeniş verileri           |
| - Kaldırılan ağırlık trendi (Progressive Overload takibi)                |
| - 7 günlük kilo ortalaması ve bel/kol mezura değişimleri               |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                          AI KARAR MOTORU                                |
| - Gelişimi değerlendirir (Kas kazanımı, yağ kaybı, plato tespiti)       |
| - Yapılandırılmış JSON çıktısı üretir                                  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        VERİTABANI AKSİYONU                              |
| - Hedef ağırlıkları ve tekrar aralıklarını otomatik günceller          |
| - Gerekirse egzersiz varyasyonunu veya hacmi revize eder                |
+-------------------------------------------------------------------------+
```

---

## 7. Supabase Veritabanı Şeması

```sql
-- 1. Egzersiz Kütüphanesi
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_muscle text not null, -- 'Chest', 'Back', 'Legs', 'Arms', 'Core'
  equipment text default 'Dumbbell', -- 'Dumbbell', 'Bodyweight', 'Ab-Wheel', 'Pull-up Bar'
  default_rest_seconds int default 90
);

-- 2. Dinamik Rutinler ve Egzersiz Eşleşmeleri
create table workout_routines (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- 'İtiş A', 'Çekiş A', 'Bacak & Core'
  sequence_order int not null,
  is_active boolean default true
);

create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references workout_routines(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  order_in_routine int not null,
  target_sets int not null,
  target_reps text not null,
  target_weight_kg numeric(4,1) default 0
);

-- 3. Antrenman Kayıtları ve Set Logları
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references workout_routines(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  notes text
);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id),
  set_number int not null,
  actual_reps int not null,
  actual_weight_kg numeric(4,1) not null,
  completed boolean default true
);

-- 4. Vücut Kompozisyonu ve Ölçümler
create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  recorded_at date default current_date,
  weight_kg numeric(4,1) not null,
  waist_cm numeric(4,1),
  arm_cm numeric(4,1),
  chest_cm numeric(4,1),
  notes text
);

-- 5. AI Antrenör Geri Bildirimleri ve Program Revizyonları
create table ai_coach_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  evaluation_summary text not null,
  suggested_changes jsonb,
  applied boolean default false
);
```

---

## 8. Uygulama ve Geliştirme Yol Haritası

1. **Adım 1 - Altyapı Hazırlığı:** Supabase SQL Editor üzerinden eski tabloların düşürülmesi ve yeni şemanın uygulanması.
2. **Adım 2 - Arayüz ve Güvenlik Katmanı:** Responsive, açık renkli Tailwind arayüzünün ve PIN kilit sisteminin kurulması.
3. **Adım 3 - Antrenman Motoru & Player:** Dinamik sarkma kuyruğunun ve tam ekran set takip sayacının kodlanması.
4. **Adım 4 - Ölçüm Modülü:** Kilo ve çevre ölçümü giriş formları ile ilerleme grafiklerinin entegrasyonu.
5. **Adım 5 - AI Koç Entegrasyonu:** Prompt yapılandırması, periyodik veri analizi ve veritabanı şablon güncelleme mekanizmasının yayına alınması.
