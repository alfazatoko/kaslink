# Setup Firebase CI/CD - Panduan Lengkap

## Langkah 1: Ambil Firebase Token

Token sudah di-generate sebelumnya. Copy token ini (simpan di tempat aman):

```
[MASUKKAN_TOKEN_CI_DARI_LOGIN_CI]
```

> **Catatan**: Token ini hanya muncul sekali saat login. Jika hilang, jalankan `npx firebase-tools login:ci` lagi untuk generate token baru.

## Langkah 2: Tambahkan Secret ke GitHub

1. Buka repository GitHub: `github.com/alfazatoko/kaslink`
2. Klik **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. **Name**: `FIREBASE_TOKEN`
5. **Value**: Paste token dari Langkah 1
6. Klik **Add secret**

## Langkah 3: Enable GitHub Actions

1. Di repository GitHub, klik tab **Actions**
2. Klik **I understand my workflows, go ahead and enable them**

## Langkah 4: Jalankan Deploy Pertama

Setelah setup selesai, push perubahan ini ke main branch:

```bash
git add .
git commit -m "Add Firebase CI/CD workflow"
git push origin main
```

Deploy akan otomatis berjalan dan aplikasi akan live di Firebase Hosting.

## URL Setelah Deploy

- **Hosting**: `https://kaslink-pro.web.app` atau `https://kaslink-pro.firebaseapp.com`
- **Custom domain** (jika sudah setup): sesuai konfigurasi di Firebase Console

## Troubleshooting

### Error: "Authentication Error" atau "Token Invalid"
- Token mungkin sudah expired atau revoked
- Generate token baru dengan: `npx firebase-tools login:ci`
- Update secret `FIREBASE_TOKEN` di GitHub dengan token baru

### Error: "Project not found"
- Pastikan project ID di `.firebaserc` benar: `kaslink-pro`
- Pastikan secret name persis sama: `FIREBASE_TOKEN`

### Cek Status Deploy
- Buka tab **Actions** di GitHub repository
- Lihat log untuk setiap workflow run

### Deploy Manual (jika CI/CD bermasalah)
```bash
npx firebase-tools deploy --token "YOUR_TOKEN_HERE"
```
