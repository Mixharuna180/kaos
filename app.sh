#!/bin/bash

echo "================================================"
echo "      INSTALASI APLIKASI KAOS INVENTORY         "
echo "================================================"
echo "          By: Mixharuna180                       "
echo "================================================"
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi untuk memeriksa kesalahan
check_error() {
  if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
  fi
}

# Fungsi untuk menampilkan status
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUKSES]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[PERINGATAN]${NC} $1"
}

print_step() {
  echo ""
  echo -e "${BLUE}=== LANGKAH: $1 ===${NC}"
}

# Direktori instalasi default
INSTALL_DIR="$HOME/kaos-inventory"

# Memeriksa parameter input
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Penggunaan: $0 [DIREKTORI_INSTALASI]"
  echo ""
  echo "Opsi:"
  echo "  --help, -h    Tampilkan bantuan ini"
  echo ""
  echo "Contoh:"
  echo "  $0                    # Instal di $INSTALL_DIR"
  echo "  $0 /path/ke/direktori  # Instal di direktori yang ditentukan"
  exit 0
fi

# Jika ada parameter, gunakan sebagai direktori instalasi
if [ ! -z "$1" ]; then
  INSTALL_DIR="$1"
fi

print_step "PERSIAPAN LINGKUNGAN"

# Pastikan Git terinstal
print_status "Memeriksa instalasi Git..."
if ! command -v git &> /dev/null; then
  print_warning "Git tidak ditemukan. Menginstal Git..."
  sudo apt-get update
  sudo apt-get install -y git
  check_error "Gagal menginstal Git"
else
  print_success "Git sudah terinstal: $(git --version)"
fi

# Pastikan nodejs terinstal
print_status "Memeriksa instalasi Node.js..."
if ! command -v node &> /dev/null; then
  print_warning "Node.js tidak ditemukan. Menginstal Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  check_error "Gagal menginstal Node.js"
else
  print_success "Node.js sudah terinstal: $(node -v)"
fi

print_status "Memeriksa instalasi npm..."
if ! command -v npm &> /dev/null; then
  print_warning "npm tidak ditemukan. Menginstal npm..."
  sudo apt-get install -y npm
  check_error "Gagal menginstal npm"
else
  print_success "npm sudah terinstal: $(npm -v)"
fi

print_step "KONFIGURASI DATABASE"

print_status "Memeriksa instalasi PostgreSQL..."
if ! command -v psql &> /dev/null; then
  print_warning "PostgreSQL tidak ditemukan. Menginstal PostgreSQL..."
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
  check_error "Gagal menginstal PostgreSQL"
  
  # Mulai layanan PostgreSQL
  sudo service postgresql start
  check_error "Gagal memulai layanan PostgreSQL"
  
  # Buat database dan user
  print_status "Membuat database dan user..."
  sudo -u postgres psql -c "CREATE USER kaosapp WITH PASSWORD 'kaosapppassword';"
  sudo -u postgres psql -c "CREATE DATABASE kaosinventory;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kaosinventory TO kaosapp;"
  check_error "Gagal membuat database dan user"
  
  # Set environment variable DATABASE_URL
  export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"
  echo 'export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"' >> ~/.bashrc
  print_success "Database PostgreSQL berhasil dikonfigurasi"
else
  print_success "PostgreSQL sudah terinstal: $(psql --version)"
  
  # Pastikan database ada
  if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw kaosinventory; then
    print_status "Membuat database kaosinventory..."
    sudo -u postgres psql -c "CREATE USER kaosapp WITH PASSWORD 'kaosapppassword';"
    sudo -u postgres psql -c "CREATE DATABASE kaosinventory;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kaosinventory TO kaosapp;"
    check_error "Gagal membuat database dan user"
    print_success "Database berhasil dibuat"
  else
    print_success "Database kaosinventory sudah ada"
  fi
  
  # Set environment variable DATABASE_URL
  export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"
  grep -q "DATABASE_URL" ~/.bashrc || echo 'export DATABASE_URL="postgresql://kaosapp:kaosapppassword@localhost:5432/kaosinventory"' >> ~/.bashrc
fi

print_step "MENGUNDUH APLIKASI"

# Clone repo jika direktori instalasi tidak ada
if [ ! -d "$INSTALL_DIR" ]; then
  print_status "Membuat direktori instalasi di $INSTALL_DIR..."
  mkdir -p "$INSTALL_DIR"
  check_error "Gagal membuat direktori instalasi"
  
  print_status "Mengunduh kode sumber dari GitHub..."
  git clone https://github.com/Mixharuna180/kaos.git "$INSTALL_DIR"
  check_error "Gagal mengunduh kode sumber"
  print_success "Kode sumber berhasil diunduh"
else
  # Jika direktori ada, periksa apakah itu repository git
  if [ -d "$INSTALL_DIR/.git" ]; then
    print_status "Repository sudah ada. Memperbarui kode sumber..."
    cd "$INSTALL_DIR"
    git pull
    check_error "Gagal memperbarui kode sumber"
    print_success "Kode sumber berhasil diperbarui"
  else
    print_warning "Direktori $INSTALL_DIR sudah ada tetapi bukan repository git."
    read -p "Apakah Anda ingin menghapus direktori dan mengunduh ulang? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      print_status "Menghapus direktori dan mengunduh ulang..."
      rm -rf "$INSTALL_DIR"
      mkdir -p "$INSTALL_DIR"
      git clone https://github.com/Mixharuna180/kaos.git "$INSTALL_DIR"
      check_error "Gagal mengunduh kode sumber"
      print_success "Kode sumber berhasil diunduh"
    else
      print_warning "Melanjutkan dengan direktori yang ada."
    fi
  fi
fi

# Pindah ke direktori instalasi
cd "$INSTALL_DIR"
check_error "Gagal pindah ke direktori instalasi"

print_step "INSTALASI DEPENDENSI"

print_status "Menginstal dependensi aplikasi..."
npm install
check_error "Gagal menginstal dependensi aplikasi"
print_success "Dependensi berhasil diinstal"

print_step "KONFIGURASI DATABASE"

print_status "Menyiapkan skema database..."
npm run db:push
check_error "Gagal menyiapkan skema database"
print_success "Skema database berhasil dikonfigurasi"

print_step "MEMULAI APLIKASI"

print_status "Memulai server aplikasi..."
npm run dev &
APP_PID=$!

# Beri waktu untuk server mulai
sleep 3

echo ""
echo "================================================"
echo "      APLIKASI KAOS INVENTORY SIAP DIGUNAKAN    "
echo "================================================"
echo ""
echo -e "${GREEN}URL Aplikasi: http://localhost:5000${NC}"
echo -e "${YELLOW}Database URL: $DATABASE_URL${NC}"
echo ""
echo -e "${BLUE}Informasi Login:${NC}"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo -e "${YELLOW}Untuk menghentikan aplikasi, tekan Ctrl+C${NC}"
echo ""
echo -e "${BLUE}Untuk menjalankan aplikasi lagi di lain waktu:${NC}"
echo "1. Buka terminal"
echo "2. Jalankan: cd $INSTALL_DIR && npm run dev"
echo ""

# Tangkap sinyal interupsi
trap "kill $APP_PID; echo -e '${YELLOW}Aplikasi dihentikan.${NC}'; exit" INT

# Tunggu sampai proses aplikasi selesai
wait $APP_PID