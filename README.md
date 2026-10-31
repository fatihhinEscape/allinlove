# allinlove

İki kişinin ortak anılarını, listelerini ve planlarını tuttuğu uygulama. Uygulama yerelde `http://localhost:3000` ve yayında `https://allinlove.vercel.app` adresinde açılır. Telefonda tarayıcı menüsünden ana ekrana eklenebilir.

## Kurulum

1. Node.js kurulu olsun.
2. Bağımlılıklar:

```bash
npm install
```

3. `.env.example` dosyasını `.env.local` olarak kopyala ve Supabase değerlerini doldur. Gizli anahtarlar bu dosyada kalır, repoya girmez.

4. Supabase SQL Editor’de şu dosyaları sırayla çalıştır:
   - `supabase/migrations/20261031120000_profiles_and_couples.sql`
   - `supabase/migrations/20261031180000_partner_details_and_dates.sql`
   - `supabase/migrations/20261031210000_shared_modules.sql`

5. Supabase Authentication ayarları:
   - Email girişi açık olsun.
   - Deneme için e-posta onayı kapalı kalsın.
   - Site URL: `https://allinlove.vercel.app`
   - Redirect URL listesine ikisini de ekle: `http://localhost:3000/**` ve `https://allinlove.vercel.app/**`

6. Çalıştır:

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` açılır.

## Güvenlik

- `NEXT_PUBLIC_` ile başlayan değerler tarayıcıya gider. Yalnızca proje adresi ve publishable/anon anahtar bu öneki taşır.
- Secret, service role ve OpenAI anahtarları yalnızca sunucuda durur.
- Tablolarda Row Level Security açıktır. Bir kullanıcı yalnızca kendi çiftinin kaydını okur.
