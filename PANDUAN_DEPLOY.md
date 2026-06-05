# PANDUAN DEPLOY — Vercel + Supabase
## E-Learning SDN 74 Krui | Agung Stiawan | 2026

---

## LANGKAH 1 — Setup Supabase

1. Buka https://supabase.com → Sign up / Login
2. Klik **New Project** → isi nama: `elearning-sdn74` → pilih region: **Southeast Asia**
3. Tunggu project selesai dibuat (~2 menit)
4. Klik **SQL Editor** → paste seluruh isi file `supabase_schema.sql` → klik **Run**
5. Buka **Storage** → klik **New Bucket**:
   - Nama: `materi` → centang **Public** → Create
   - Nama: `foto` → centang **Public** → Create
6. Catat **Project URL** dan **service_role key** dari **Settings → API**

---

## LANGKAH 2 — Upload ke GitHub

1. Buat repository baru di GitHub (nama: `elearning-sdn74`)
2. Upload semua isi folder ini ke repository
3. Pastikan struktur seperti ini:
```
elearning-sdn74/
├── api/
│   ├── login.js
│   ├── logout.js
│   ├── register.js
│   ├── reset_sandi.js
│   ├── materi.js
│   ├── nilai.js
│   └── profil.js
├── lib/
│   └── supabase.js
├── index.html
├── style.css
├── script.js
├── *.jpg / *.png  (foto sekolah, logo)
├── package.json
└── vercel.json
```

---

## LANGKAH 3 — Deploy ke Vercel

1. Buka https://vercel.com → Login dengan GitHub
2. Klik **Add New Project** → pilih repository `elearning-sdn74`
3. Di bagian **Environment Variables**, tambahkan:
   - `SUPABASE_URL` → isi dengan Project URL dari Supabase
   - `SUPABASE_SERVICE_KEY` → isi dengan service_role key dari Supabase
4. Klik **Deploy**
5. Tunggu ~1 menit → website online!

---

## AKUN LOGIN

### Kepala Sekolah
| NIP | Kata Sandi |
|-----|-----------|
| 196501011990031001 | kepsek123 |

### Guru
| NIP | Kata Sandi |
|-----|-----------|
| 198501012010012001 | guru123 |
| 197803152005012002 | mengajar1 |

### Siswa
| NISN | Kata Sandi |
|------|-----------|
| 1234567890 | siswa123 |
| 0987654321 | belajar1 |
| 1122334455 | krui2024 |
| 5544332211 | siswa456 |
| 9988776655 | belajar2 |

---

## FITUR PER PERAN

| Fitur | Siswa | Guru | Kepala Sekolah |
|-------|-------|------|----------------|
| Lihat materi | ✅ | ✅ | ✅ |
| Download materi | ✅ | ✅ | ✅ |
| Upload materi | ❌ | ✅ | ❌ |
| Kuis Kahoot | ✅ | ✅ (kelola) | ❌ |
| Lihat nilai sendiri | ✅ | ❌ | ❌ |
| Download nilai sendiri | ✅ | ❌ | ❌ |
| Input/edit nilai | ❌ | ✅ | ❌ |
| Rekap semua nilai | ❌ | ✅ | ✅ |
| Export CSV semua nilai | ❌ | ✅ | ✅ |
| Data semua siswa | ❌ | ❌ | ✅ |
| Edit profil | ✅ | ✅ | ✅ |
| Daftar akun baru | ✅ | ✅ | ❌ |
| Reset kata sandi | ✅ | ✅ | ✅ |
