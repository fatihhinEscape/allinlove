# allinlove

İki kişinin ortak anılarını, listelerini ve planlarını tuttuğu uygulama. Bu aşamada hesap, giriş ve çift kurulumu var. Uygulama bu bilgisayarda çalışır.

## Kurulum

1. Node.js kurulu olsun.
2. Bağımlılıklar:

```bash
npm install
```

3. `.env.example` dosyasını `.env.local` olarak kopyala ve Supabase değerlerini doldur. Gizli anahtarlar bu dosyada kalır, repoya girmez.

4. Supabase SQL Editor’de `supabase/migrations/20261031120000_profiles_and_couples.sql` dosyasının tamamını çalıştır.

5. Supabase Authentication ayarları:
   - Email girişi açık olsun.
   - Deneme için e-posta onayı kapalı kalsın.
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/**`

6. Çalıştır:

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` açılır.

## Güvenlik

- `NEXT_PUBLIC_` ile başlayan değerler tarayıcıya gider. Yalnızca proje adresi ve publishable/anon anahtar bu öneki taşır.
- Secret, service role ve OpenAI anahtarları yalnızca sunucuda durur.
- Tablolarda Row Level Security açıktır. Bir kullanıcı yalnızca kendi çiftinin kaydını okur.
