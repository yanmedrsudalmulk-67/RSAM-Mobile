-- Supabase Schema for RSAM Mobile
-- Run this in your Supabase SQL Editor

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nama_pasien TEXT,
    nik TEXT UNIQUE,
    tanggal_lahir TEXT,
    alamat TEXT,
    no_hp TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'patient',
    nomor_bpjs TEXT,
    no_rekam_medis TEXT,
    foto_profil TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rekam Medis Table
CREATE TABLE IF NOT EXISTS rekam_medis (
    id SERIAL PRIMARY KEY,
    id_booking TEXT UNIQUE,
    id_pasien TEXT,
    keluhan TEXT,
    pemeriksaan TEXT,
    tekanan_darah TEXT,
    nadi INTEGER,
    respirasi INTEGER,
    suhu DECIMAL,
    saturasi INTEGER,
    diagnosa TEXT,
    tindakan TEXT,
    obat TEXT, -- Store as JSON string of array
    dosis TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Diagnosa Table (ICD-10)
CREATE TABLE IF NOT EXISTS diagnosa (
    id SERIAL PRIMARY KEY,
    kode TEXT UNIQUE,
    nama TEXT
);

-- Obat Table
CREATE TABLE IF NOT EXISTS obat (
    id SERIAL PRIMARY KEY,
    nama TEXT UNIQUE,
    satuan TEXT
);

-- Booking Kunjungan Table
CREATE TABLE IF NOT EXISTS booking_kunjungan (
    id_booking TEXT PRIMARY KEY,
    id_jadwal TEXT,
    nama_pasien TEXT,
    nik TEXT,
    tanggal_lahir TEXT,
    jenis_kelamin TEXT,
    nomor_hp TEXT,
    alamat TEXT,
    jenis_jaminan TEXT,
    nomor_bpjs TEXT,
    poli TEXT,
    dokter TEXT,
    tanggal_kunjungan TEXT,
    time TEXT,
    nomor_antrian TEXT,
    jenis_vaksin TEXT, -- Store as JSON string
    status_antrian TEXT DEFAULT 'Belum Check-In',
    waktu_booking TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_ktp_kk TEXT,
    file_passport TEXT,
    tanggal_upload TEXT
);

-- Stok Vaksin Table
CREATE TABLE IF NOT EXISTS stok_vaksin (
    id TEXT PRIMARY KEY,
    nama_vaksin TEXT,
    stok_tersedia INTEGER,
    last_update TEXT
);

-- EICV Stock Table
CREATE TABLE IF NOT EXISTS eicv_stock (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    jumlah_stok INTEGER,
    terakhir_update TEXT
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    waktu_error TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_input TEXT,
    data_input TEXT,
    pesan_error TEXT
);

-- Poliklinik Table
CREATE TABLE IF NOT EXISTS poliklinik (
    id_poli TEXT PRIMARY KEY,
    nama_poli TEXT,
    deskripsi TEXT,
    lokasi_ruangan TEXT,
    status_poli TEXT,
    kuota_harian INTEGER
);

-- Dokter Table
CREATE TABLE IF NOT EXISTS dokter (
    id_dokter TEXT PRIMARY KEY,
    nama_dokter TEXT,
    spesialis TEXT,
    poli TEXT,
    jadwal_praktek TEXT,
    foto_dokter TEXT
);

-- Jadwal Layanan Table
CREATE TABLE IF NOT EXISTS jadwal_layanan (
    id_jadwal TEXT PRIMARY KEY,
    nama_poli TEXT,
    nama_dokter TEXT,
    hari_praktek TEXT,
    jam_mulai TEXT,
    jam_selesai TEXT,
    status_layanan TEXT,
    kuota_terpakai INTEGER DEFAULT 0,
    cuti_mulai TEXT,
    cuti_selesai TEXT
);

-- Jadwal Dokter Table
CREATE TABLE IF NOT EXISTS jadwal_dokter (
    id SERIAL PRIMARY KEY,
    nama_dokter TEXT,
    hari_praktek TEXT,
    jam_mulai TEXT,
    jam_selesai TEXT,
    poli TEXT,
    status_dokter TEXT DEFAULT 'aktif',
    tanggal_mulai_cuti TEXT,
    tanggal_selesai_cuti TEXT,
    kuota_harian INTEGER DEFAULT 30
);

-- Layanan Images Table
CREATE TABLE IF NOT EXISTS layanan_images (
    id SERIAL PRIMARY KEY,
    service_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logo Footer Table
CREATE TABLE IF NOT EXISTS logo_footer (
    id_logo SERIAL PRIMARY KEY,
    nama_instansi TEXT NOT NULL,
    gambar_logo TEXT NOT NULL,
    link_instansi TEXT,
    status TEXT DEFAULT 'aktif',
    tanggal_upload TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Artikel Portal RS Table
CREATE TABLE IF NOT EXISTS artikel_portal_rs (
    id_artikel SERIAL PRIMARY KEY,
    judul_artikel TEXT,
    kategori_artikel TEXT,
    ringkasan_artikel TEXT,
    isi_artikel TEXT,
    gambar_slider TEXT,
    tanggal_publish TEXT,
    status_publish TEXT,
    featured_slider TEXT,
    penulis TEXT,
    tanggal_dibuat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0
);

-- Seed Initial Data
INSERT INTO stok_vaksin (id, nama_vaksin, stok_tersedia, last_update) VALUES 
('1', 'Meningitis', 10, CURRENT_DATE::text),
('2', 'Polio', 28, CURRENT_DATE::text),
('3', 'Influenza', 13, CURRENT_DATE::text)
ON CONFLICT (id) DO NOTHING;

INSERT INTO eicv_stock (id, jumlah_stok, terakhir_update) VALUES 
(1, 60, CURRENT_DATE::text)
ON CONFLICT (id) DO NOTHING;

INSERT INTO poliklinik (id_poli, nama_poli, deskripsi, lokasi_ruangan, status_poli, kuota_harian) VALUES 
('p1', 'Poli Umum', 'Pelayanan kesehatan umum', 'Lantai 1 Ruang Poli Umum', 'Aktif', 30),
('p2', 'Poli Anak', 'Pelayanan kesehatan anak', 'Lantai 1, Ruang Poli Anak', 'Aktif', 25),
('p3', 'Poli Obgyn', 'Pelayanan kebidanan dan kandungan', 'Lantai 1, Ruang Poli Obgyn', 'Aktif', 15),
('p4', 'Poli Gigi', 'Pelayanan kesehatan gigi dan mulut', 'Lantai 1, Ruang Poli Gigi', 'Aktif', 15),
('p5', 'Poli Penyakit Dalam', 'Pelayanan penyakit dalam', 'Lantai 1, Ruang Poli Penyakit Dalam', 'Aktif', 30),
('p6', 'Poli Neurologi', 'Pelayanan saraf', 'Lantai 1, Ruang Poli Saraf', 'Aktif', 15),
('p7', 'Poli Bedah', 'Pelayanan bedah', 'Lantai 1, Ruang Poli Bedah', 'Aktif', 10),
('p8', 'Poli Vaksinasi', 'Pelayanan vaksinasi', 'Lantai 1, Ruang Poli Vaksinasi', 'Aktif', 10)
ON CONFLICT (id_poli) DO NOTHING;

-- Seed Diagnosa (ICD-10)
INSERT INTO diagnosa (kode, nama) VALUES 
('A00', 'Cholera'),
('A01', 'Typhoid and paratyphoid fevers'),
('A09', 'Diarrhoea and gastroenteritis of presumed infectious origin'),
('B00', 'Herpesviral [herpes simplex] infections'),
('B01', 'Varicella [chickenpox]'),
('E11', 'Non-insulin-dependent diabetes mellitus'),
('I10', 'Essential (primary) hypertension'),
('J00', 'Acute nasopharyngitis [common cold]'),
('J01', 'Acute sinusitis'),
('J02', 'Acute pharyngitis'),
('J06', 'Acute upper respiratory infections of multiple and unspecified sites'),
('K29', 'Gastritis and duodenitis'),
('M54', 'Dorsalgia (Back pain)'),
('R50', 'Fever of other and unknown origin'),
('R51', 'Headache')
ON CONFLICT (kode) DO NOTHING;

-- Seed Obat
INSERT INTO obat (nama, satuan) VALUES 
('Amoxicillin 500mg', 'Tablet'),
('Paracetamol 500mg', 'Tablet'),
('Ibuprofen 400mg', 'Tablet'),
('Cetirizine 10mg', 'Tablet'),
('Omeprazole 20mg', 'Kapsul'),
('Antasida Doen', 'Tablet Kunyah'),
('Oralit', 'Sachet'),
('Vitamin C 500mg', 'Tablet'),
('Dexamethasone 0.5mg', 'Tablet'),
('Amlodipine 5mg', 'Tablet')
ON CONFLICT (nama) DO NOTHING;

-- Add more seeds as needed...
