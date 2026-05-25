# 📱 Panduan Build Native App (Android) via GitHub Actions

Dokumen ini berisi daftar prompt dan langkah-langkah untuk mengubah aplikasi web **KINK** menjadi aplikasi Android native menggunakan GitHub Actions dan Firebase.

---

## 🛠️ Persiapan (Lakukan di GitHub)
Sebelum menjalankan prompt di bawah, pastikan Anda sudah menyiapkan hal berikut di repository GitHub Anda:

1. **GitHub Secrets**: Masukkan data sensitif di `Settings > Secrets and Variables > Actions`:
   - `FIREBASE_CONFIG`: Isi dengan isi file konfigurasi firebase Anda.
   - `ANDROID_KEYSTORE_BASE64`: (Opsional) Jika ingin aplikasi yang sudah ditandatangani (signed).

---

## 💬 Daftar Prompt (Salin & Tempel saat Siap)

### Prompt 1: Inisialisasi Native Wrapper (Capacitor)
> "Tolong siapkan Capacitor di proyek ini agar bisa diubah ke Android. Install dependencies yang diperlukan dan jalankan perintah `npx cap init` dengan nama aplikasi 'ALFAZA KINK'."

### Prompt 2: Konfigurasi Firebase untuk Android
> "Tolong bantu saya integrasikan Firebase Android. Siapkan folder untuk menaruh `google-services.json` dan pastikan konfigurasi web tetap berjalan lancar di versi native."

### Prompt 3: Membuat File GitHub Action
> "Tolong buatkan file `.github/workflows/android-build.yml` untuk build otomatis. Pastikan workflow ini menjalankan build produksi, sinkronisasi Capacitor, dan menghasilkan file APK di bagian Artifacts GitHub."

---

## 📂 Lokasi File Penting
- **Konfigurasi GitHub**: `.github/workflows/android-build.yml`
- **Output App**: Akan muncul di tab **Actions** di halaman GitHub Anda setelah proses build selesai.

---
*Catatan: Anda bisa meminta saya untuk menjelaskan setiap langkah di atas secara lebih mendetail kapan pun Anda mau.*
