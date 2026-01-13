# Supabaze

## Overview
Supabase + Next.js 14 App Router starter. Email/password auth ve temel grup/proje akisi icin baslangic iskeleti.

## Features
- Email/password auth
- Grup olusturma ve invite_code akisi
- Proje sayfasi (placeholder)

## Setup
1. `npm install`
2. `.env.example` dosyasini `.env.local` olarak kopyala.
3. `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` degerlerini gir.
4. `npm run dev`

## Database Setup
1. Supabase Dashboard > SQL Editor
2. `supabase/schema.sql` calistir
3. `supabase/rls.sql` calistir

## Usage
- `/login` ve `/signup` ile giris
- `/app` panelinden grup/proje akisi

## Screenshots
- `docs/` altina ekran goruntuleri ekle

## Roadmap
- Proje kanban akisi
- Yetkilendirme iyilestirmeleri

## License
- Secilecek
