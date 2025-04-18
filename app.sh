#!/bin/bash

echo "================================================"
echo "      INSTALASI APLIKASI KAOS INVENTORY         "
echo "================================================"
echo ""

# Fungsi untuk memeriksa kesalahan
check_error() {
  if [ $? -ne 0 ]; then
    echo "ERROR: $1"
    exit 1
  fi
}

# Pastikan nodejs terinstal
echo "Memeriksa instalasi Node.js..."
if ! command -v node &> /dev/null; then
  echo "Node.js tidak ditemukan. Menginstal Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  check_error "Gagal menginstal Node.js"
else
  echo "Node.js sudah terinstal: $(node -v)"
fi

echo ""
echo "Memeriksa instalasi npm..."
if ! command -v npm &> /dev/null; then
  echo "npm tidak ditemukan. Menginstal npm..."
  sudo apt-get install -y npm
  check_error "Gagal menginstal npm"
else
  echo "npm sudah terinstal: $(npm -v)"
fi

echo ""
echo "Memeriksa instalasi PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo "PostgreSQL tidak ditemukan. Menginstal PostgreSQL..."
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
  check_error "Gagal menginstal PostgreSQL"
  
  # Mulai layanan PostgreSQL
  sudo service postgresql start
  check_error "Gagal memulai layanan PostgreSQL"
  
  # Buat database dan user
  echo "Membuat database dan user..."
  sudo -u postgres psql -c "CREATE USER kaosapp WITH PASSWORD 'kaosapppassword';"
  sudo -u postgres psql -c "CREATE DATABASE kaosinventory;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kaosinventory TO kaosapp;"
  check_error "Gagal membuat database dan user"
  
  # Set environment variable DATABASE_URL
  export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"
  echo 'export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"' >> ~/.bashrc
else
  echo "PostgreSQL sudah terinstal: $(psql --version)"
  
  # Pastikan database ada
  if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw kaosinventory; then
    echo "Membuat database kaosinventory..."
    sudo -u postgres psql -c "CREATE USER kaosapp WITH PASSWORD 'kaosapppassword';"
    sudo -u postgres psql -c "CREATE DATABASE kaosinventory;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kaosinventory TO kaosapp;"
    check_error "Gagal membuat database dan user"
  else
    echo "Database kaosinventory sudah ada"
  fi
  
  # Set environment variable DATABASE_URL
  export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"
  grep -q "DATABASE_URL" ~/.bashrc || echo 'export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"' >> ~/.bashrc
fi

echo ""
echo "Menginstal dependensi aplikasi..."
# Jika belum clone repo, clone dulu
if [ ! -d "node_modules" ]; then
  npm install
  check_error "Gagal menginstal dependensi aplikasi"
fi

echo ""
echo "Menyiapkan database..."
# Push schema ke database
npm run db:push
check_error "Gagal menyiapkan database"

echo ""
echo "Memulai aplikasi..."
npm run dev &
APP_PID=$!

echo ""
echo "================================================"
echo "      APLIKASI KAOS INVENTORY SIAP DIGUNAKAN    "
echo "================================================"
echo ""
echo "URL Aplikasi: http://localhost:5000"
echo "Database URL: $DATABASE_URL"
echo ""
echo "Untuk menghentikan aplikasi, tekan Ctrl+C"
echo ""

# Tangkap sinyal interupsi
trap "kill $APP_PID; echo 'Aplikasi dihentikan.'; exit" INT

# Tunggu sampai proses aplikasi selesai
wait $APP_PID