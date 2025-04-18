# Aplikasi Manajemen Inventori Kaos

Aplikasi web komprehensif untuk manajemen inventori kaos dengan sistem konsinyansi reseller. Aplikasi ini membantu Anda melacak stok, mengelola konsinyasi ke reseller, dan mencatat penjualan dengan mudah.

## Fitur Utama

- **Dashboard**: Melihat statistik stok, konsinyasi aktif, dan penjualan
- **Inventori**: Mengelola stok kaos dengan berbagai tipe (Dewasa, Dewasa Panjang, Bloombee, Anak, Anak Tanggung) dan ukuran
- **Konsinyasi**: Mengelola pengiriman konsinyasi ke reseller dan memantau status pembayaran
- **Penjualan**: Mencatat penjualan langsung dan penjualan dari konsinyasi reseller
- **Laporan**: Menganalisa data penjualan dan inventori dalam periode tertentu
- **Pengaturan**: Konfigurasi aplikasi dan pengaturan bisnis

## Teknologi

- Frontend: React.js dengan TypeScript
- Backend: Node.js dengan Express
- Database: PostgreSQL
- UI Framework: Shadcn UI dengan Tailwind CSS
- State Management: Tanstack Query

## Cara Instalasi Cepat (One-Click)

Untuk instalasi cepat, gunakan skrip `app.sh`:

```bash
# Unduh skrip instalasi
curl -o app.sh https://raw.githubusercontent.com/Mixharuna180/kaos/main/app.sh

# Beri izin eksekusi
chmod +x app.sh

# Jalankan skrip
./app.sh
```

Skrip ini akan:
1. Menginstal semua dependensi yang diperlukan (Node.js, npm, PostgreSQL)
2. Mengunduh kode sumber dari GitHub
3. Menyiapkan database
4. Memulai aplikasi

## Instalasi Manual

### Prasyarat

- Node.js (v20+)
- npm (v9+)
- PostgreSQL (v14+)

### Langkah-langkah

1. Clone repository:
   ```bash
   git clone https://github.com/Mixharuna180/kaos.git
   cd kaos
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Siapkan database PostgreSQL dan tambahkan URL database ke environment variable:
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/kaosinventory"
   ```

4. Buat skema database:
   ```bash
   npm run db:push
   ```

5. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

6. Buka aplikasi di browser: http://localhost:5000

## Penggunaan

### Login

- Username: admin
- Password: admin123

### Navigasi Dasar

- Gunakan sidebar untuk berpindah antar fitur utama
- Dashboard menampilkan statistik penting tentang bisnis Anda
- Halaman inventori memungkinkan Anda menambah/mengedit stok
- Halaman konsinyasi digunakan untuk mengelola barang ke reseller
- Halaman penjualan mencatat transaksi penjualan langsung dan dari konsinyasi

## Kontributor

- Mixharuna180

## Lisensi

MIT