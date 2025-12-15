# Supabase + Next.js App Router starter

Basit email/password auth akisi ile Supabase + Next.js 14 (App Router, TypeScript, Tailwind) baslangic iskeleti.

## Kurulum
1. Bagimliliklari yukle: `npm install`
2. Ortam degiskenlerini ekle: `.env.example` dosyasini `.env.local` olarak kopyalayip `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` degerlerini gir (Supabase > Project Settings > API).
3. Gelistirme sunucusu: `npm run dev` ve ardindan `http://localhost:3000` adresine git.

## Supabase veritabani kurulumu
1. Supabase Dashboard > SQL Editor ac.
2. `supabase/schema.sql` icerigini calistir (tablolar, indexler, trigger ve fonksiyonlar).
3. Ardindan `supabase/rls.sql` icerigini calistir (RLS acma ve policy kurallari).
4. Hizli test: `select * from groups limit 1;` ve `select * from group_members limit 1;` sorgulari ile tablo erisimini dogrula.

## Grup ve proje UI akisi
- Giris/uye ol: `/login` veya `/signup`.
- Panel `/app`: kendi gruplarini listele, yeni grup olustur (invite_code otomatik), veya invite_code ile katil.
- Grup detayi `/app/groups/[groupId]`: grup bilgisi + invite_code, uyeleri listele, projeleri listele/olustur.
- Proje placeholder `/app/projects/[projectId]`: proje adini ve ID bilgisini gosterir (Kanban sonraki adim).

## Supabase notlari
- Authentication > Providers bolumunde Email provider'i aktif et.
- Auth ekranlari: `/login`, `/signup`, korumali sayfa `/app` (oturum yoksa `/login`e yonlendirir).
- Supabase client: `src/lib/supabase/client.ts` uzerinden `createClient` ile olusturuldu (public URL ve anon key kullanir).
