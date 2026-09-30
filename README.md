# Hep Yanımda — Bölüm 1: Kayıt, giriş ve öğretmen–veli eşleşmesi

Next.js 16 + Supabase + Tailwind. Vercel'e yayınlanmaya hazır.

## Bu bölümde neler var
| Ekran | Adres | Açıklama |
|---|---|---|
| Giriş | `/giris` | Mail + şifre. Doğrulanmamış hesap → yeni kod gönderilir, doğrulama ekranına gider |
| Kayıt | `/kayit` | Veli / Öğretmen sekmesi, ad soyad, mail, okul (listeden), öğrenci adı (sadece veli), şifre + tekrar. Kayıt olan direkt paneline girer |
| Mail doğrulama | `/dogrula` | **Şu an kapalı.** Supabase'de "Confirm email" açılırsa otomatik devreye girer (kod ekranı) |
| Şifremi unuttum | `/sifremi-unuttum` | Mail → kod gönderilir → kod + yeni şifre + tekrar |
| Öğretmen | `/ogretmen` | Sınıf grubu oluşturma/silme, sınıfa katılan öğrenci–veli listesi, öğrenciyi çıkarma |
| Veli | `/veli` | Okuldaki sınıfları görür, öğrencisinin sınıfına katılır (eşleşme), sınıf değiştirebilir |
| Admin | `/admin` | Özet sayılar, okul ekle/düzenle/sil, kullanıcı ara/rol değiştir/sil, sınıfları gör/sil |

Güvenlik veritabanında (Row Level Security): veli sadece kendi okulunun sınıflarını görür ve katılabilir,
öğretmen sadece kendi sınıfındaki velileri görür, kimse kendini admin yapamaz.

---

## Kurulum (yaklaşık 15 dk)

### 1) Supabase projesi
1. https://supabase.com → **New project** (bölge: *Central EU (Frankfurt)*).
2. **SQL Editor** → `supabase/schema.sql` içeriğini yapıştır → **Run**.

### 2) Mailde link yerine KOD gönderilmesi (önemli)
**Kayıt mail onayı şimdilik KAPALI:** Authentication → Sign In / Providers → Email → *Confirm email* = **kapalı**.
Kullanıcı kayıt olur olmaz giriş yapar. İleride açmak istersen sadece bu ayarı aç ve "Confirm signup"
şablonunu yapıştır; kod değişikliği gerekmez (uygulama doğrulama ekranına kendisi yönlendirir).

**Authentication → Emails → Templates**
- (Onay açılırsa) **Confirm signup** → gövdeye `supabase/email-templates/1-kayit-onay.html` içeriğini yapıştır.
- **Reset Password** → gövdeye `supabase/email-templates/2-sifre-sifirlama.html` içeriğini yapıştır.

Şablonlardaki `{{ .Token }}` kodun kendisidir. Konu satırlarını dosyaların en üstünden alabilirsin.

**Authentication → Sign In / Providers → Email**
- *Confirm email* = **kapalı** (şimdilik)
- *Email OTP Length* = **6** (varsayılan)

### 3) Mail gönderimi (SMTP) — canlı kullanım için şart
Supabase'in hazır mail servisi saatte birkaç mail ile sınırlıdır ve sadece proje ekibindeki adreslere gönderir.
Gerçek kullanıcılar için **Authentication → Emails → SMTP Settings** kısmına kendi SMTP bilgilerini gir:
- **Resend** (ücretsiz: günde 100 mail) — kendi alan adınla en temiz çözüm, veya
- **Gmail**: smtp.gmail.com, port 465, kullanıcı = gmail adresin, şifre = *Uygulama Şifresi* (2 adımlı doğrulama açık olmalı).

Ardından **Authentication → Rate Limits** kısmında mail limitini ihtiyacına göre artır.

### 4) Bilgisayarda çalıştırma
```bash
cp .env.example .env.local     # Supabase > Project Settings > API değerlerini yaz
npm install
npm run dev                    # http://localhost:3000
```

### 5) İlk admin hesabı
1. Uygulamadan normal şekilde kayıt ol (herhangi bir okulu seç).
2. Supabase **SQL Editor**'de çalıştır:
```sql
update public.profiles set role = 'admin' where email = 'senin@mailin.com';
```
3. Çıkış yapıp tekrar gir → `/admin` açılır.

> Kayıt ekranında okul seçilebilmesi için en az bir okul olmalı. İlk okulu SQL ile ekleyebilirsin:
> ```sql
> insert into public.schools (name, city) values ('Atatürk İlkokulu', 'Bursa');
> ```
> Sonrasında okulları admin panelinden eklersin.

### 6) Vercel'e yayınlama
1. Projeyi GitHub'a yükle.
2. https://vercel.com → **Add New → Project** → repoyu seç.
3. **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (veya `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. **Deploy**. Sonra Supabase → **Authentication → URL Configuration → Site URL** = Vercel adresin.

---

## Veritabanı
- `schools` — okullar (admin yönetir, kayıt ekranında herkes okuyabilir)
- `profiles` — her kullanıcı: rol (teacher/parent/admin), okul, öğrenci adı. Kayıtta tetikleyici ile otomatik oluşur
- `classes` — öğretmenin oluşturduğu sınıf grupları
- `class_members` — veli ↔ sınıf eşleşmesi (bir öğrenci aynı anda tek sınıfta)

## Klasör yapısı
```
src/
  proxy.ts                 oturum yenileme + korumalı sayfa yönlendirmesi
  lib/                     supabase istemcileri, rol kontrolü, Türkçe hata mesajları
  components/              ortak arayüz parçaları
  app/giris|kayit|dogrula|sifremi-unuttum
  app/ogretmen|veli|admin
supabase/schema.sql        tablolar + tetikleyiciler + RLS
supabase/email-templates/  Türkçe kod mailleri
```

## Bölüm 2 — Kitap takip
Kurulum: Supabase **SQL Editor**'de `supabase/02-kitap-takip.sql` dosyasını bir kez çalıştırın.

Sınıf sayfası (`/sinif/[id]`) → **📚 Kitap Takip** sekmesi:
| Alt sekme | Öğretmen / Admin | Veli |
|---|---|---|
| Kitap Ekleme | Ekler, **düzenler, siler** | Sadece ekler (ad + sayfa sayısı) |
| Öğrenci Kitap Girişi | Sınıftaki tüm öğrencileri seçer; kayıt **direkt onaylı**. Veli kayıtlarını onaylar/reddeder | Sadece kendi öğrencisi; kayıt **öğretmen onayına** düşer |
| Raporlama | Bu hafta / bu ay / tüm zamanlar / tarih aralığı, sıralama grafiği, öğrenci detayı, CSV indir | — |

- Tarih, kaydı yapan telefon/bilgisayarın tarihidir.
- Raporlara ve sıralamaya sadece **onaylı** kayıtlar girer.
- Veli ana ekranı: **Haftanın okuru** (Pzt–Paz) ve **Ayın okuru** — kitap sayısı + toplam sayfa, ilk 5 grafik.
- Aynı öğrenci aynı kitabı iki kez kaydedemez; okuma kaydı olan kitap silinemez.

## Bölüm 3 — Öğrenci onayı, bildirimler, şifre sıfırlama
Kurulum: `supabase/03-bildirimler.sql` → sonra gizli `03b-bildirim-ayari.sql` (repoda yok).
Vercel ortam değişkenleri: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_WEBHOOK_SECRET`.

- Veli sınıfa katılınca istek **onay bekler**; öğretmen Öğrenciler sekmesinden onaylar/reddeder.
  Onaylanmayan öğrenci adına kitap kaydı yapılamaz. Eski üyelikler onaylı sayılır.
- Bildirimler (uygulama içi 🔔 + telefon bildirimi):
  yeni öğrenci isteği → öğretmen · veli kitap kaydı → öğretmen · kitap onay/ret → veli · sınıf onay/ret → veli.
- Telefon bildirimi akışı: `notifications` tablosuna kayıt → pg_net ile `/api/push` → Web Push.
  iPhone'da sadece ana ekrana eklenmiş uygulamada çalışır (iOS 16.4+).
- Aynı kitap adı engeli: büyük/küçük harf, Türkçe karakter, boşluk ve noktalama farkı yok sayılır
  (`book_key`). Eski çift kayıtların sonuna (2), (3) eklenir.
- Şifremi unuttum: Supabase'e SMTP (Resend) tanımlanınca çalışır.
