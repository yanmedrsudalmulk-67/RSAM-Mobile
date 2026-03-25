# Panduan Integrasi GitHub & Vercel

Aplikasi ini telah dikonfigurasi untuk dapat dideploy ke Vercel melalui GitHub.

## Langkah 1: Export ke GitHub
1. Buka menu **Settings** (ikon gerigi) di pojok kiri bawah AI Studio Build.
2. Klik tombol **Export to GitHub**.
3. Ikuti instruksi untuk menghubungkan akun GitHub Anda dan membuat repositori baru.

## Langkah 2: Hubungkan ke Vercel
1. Masuk ke [Vercel Dashboard](https://vercel.com/dashboard).
2. Klik **Add New...** -> **Project**.
3. Cari repositori GitHub yang baru saja Anda buat dan klik **Import**.
4. Di bagian **Environment Variables**, tambahkan variabel berikut (ambil nilainya dari AI Studio Secrets atau file `.env` Anda):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Opsional, untuk melewati RLS)
   - `GEMINI_API_KEY` (Jika menggunakan fitur AI)
5. Klik **Deploy**.

## Konfigurasi Teknis
- `vercel.json`: Mengatur routing untuk API (Express) dan Frontend (Vite).
- `api/index.ts`: Entry point untuk serverless function Vercel yang menjalankan server Express.
- `server.ts`: Telah direfaktorisasi agar dapat berjalan baik di lingkungan serverless Vercel maupun lokal.

## Catatan Penting
- Vercel akan secara otomatis menjalankan `npm run build` saat Anda melakukan push ke GitHub.
- Routing SPA (Single Page Application) telah dikonfigurasi agar semua request non-API diarahkan ke `index.html`.
