import Database from 'better-sqlite3';

const db = new Database('database.sqlite');
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS booking_kunjungan (
    id_booking TEXT PRIMARY KEY,
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
    jenis_vaksin TEXT,
    status_antrian TEXT,
    waktu_booking TEXT
  );

  CREATE TABLE IF NOT EXISTS stok_vaksin (
    id TEXT PRIMARY KEY,
    nama_vaksin TEXT,
    stok_tersedia INTEGER,
    last_update TEXT
  );

  CREATE TABLE IF NOT EXISTS eicv_stock (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    jumlah_stok INTEGER,
    terakhir_update TEXT
  );

  CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    waktu_error TEXT,
    user_input TEXT,
    data_input TEXT,
    pesan_error TEXT
  );

  CREATE TABLE IF NOT EXISTS poliklinik (
    id_poli TEXT PRIMARY KEY,
    nama_poli TEXT,
    deskripsi TEXT,
    lokasi_ruangan TEXT,
    status_poli TEXT,
    kuota_harian INTEGER
  );

  CREATE TABLE IF NOT EXISTS dokter (
    id_dokter TEXT PRIMARY KEY,
    nama_dokter TEXT,
    spesialis TEXT,
    poli TEXT,
    jadwal_praktek TEXT
  );

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

  CREATE TABLE IF NOT EXISTS jadwal_dokter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_dokter TEXT,
    hari_praktek TEXT,
    jam_mulai TEXT,
    jam_selesai TEXT,
    poli TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_pasien TEXT,
    nik TEXT UNIQUE,
    tanggal_lahir TEXT,
    alamat TEXT,
    no_hp TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    foto_profil TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS layanan_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logo_footer (
    id_logo INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_instansi TEXT NOT NULL,
    gambar_logo TEXT NOT NULL,
    link_instansi TEXT,
    status TEXT DEFAULT 'aktif',
    tanggal_upload DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artikel_portal_rs (
    id_artikel INTEGER PRIMARY KEY AUTOINCREMENT,
    judul_artikel TEXT,
    kategori_artikel TEXT,
    ringkasan_artikel TEXT,
    isi_artikel TEXT,
    gambar_slider TEXT,
    tanggal_publish TEXT,
    status_publish TEXT,
    featured_slider TEXT,
    penulis TEXT,
    tanggal_dibuat TEXT,
    views INTEGER DEFAULT 0
  );
`);

// Add columns if they don't exist
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN file_ktp_kk TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN file_passport TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN tanggal_upload TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN id_jadwal TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN jenis_jaminan TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN nomor_bpjs TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN diagnosis TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN resep TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN keluhan TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN pemeriksaan TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE booking_kunjungan ADD COLUMN tindakan TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE jadwal_layanan ADD COLUMN kuota_terpakai INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE jadwal_layanan ADD COLUMN cuti_mulai TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE jadwal_layanan ADD COLUMN cuti_selesai TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE jadwal_dokter ADD COLUMN status_dokter TEXT DEFAULT 'aktif';"); } catch (e) {}
try { db.exec("ALTER TABLE jadwal_dokter ADD COLUMN tanggal_mulai_cuti TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE jadwal_dokter ADD COLUMN tanggal_selesai_cuti TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE jadwal_dokter ADD COLUMN kuota_harian INTEGER DEFAULT 30;"); } catch (e) {}
try { db.exec("ALTER TABLE users RENAME COLUMN nama TO nama_pasien;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN foto_profil TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE artikel_portal_rs ADD COLUMN views INTEGER DEFAULT 0;"); } catch (e) {}

// Remove no_bpjs from users if it exists
try { db.exec("ALTER TABLE users DROP COLUMN no_bpjs;"); } catch (e) {}

// Migrate stok_vaksin to new schema
try {
  const tableInfo = db.prepare("PRAGMA table_info(stok_vaksin)").all() as any[];
  const hasTanggalUpdate = tableInfo.some(col => col.name === 'tanggal_update');
  if (hasTanggalUpdate) {
    db.exec(`
      CREATE TABLE stok_vaksin_new (
        id TEXT PRIMARY KEY,
        nama_vaksin TEXT,
        stok_tersedia INTEGER,
        last_update TEXT
      );
      INSERT INTO stok_vaksin_new (id, nama_vaksin, stok_tersedia, last_update)
      SELECT id, nama_vaksin, stok_tersedia, tanggal_update FROM stok_vaksin;
      DROP TABLE stok_vaksin;
      ALTER TABLE stok_vaksin_new RENAME TO stok_vaksin;
    `);
  }
} catch (e) {
  console.error("Error migrating stok_vaksin:", e);
}

// Seed initial data if empty
const vaccineCount = db.prepare('SELECT COUNT(*) as count FROM stok_vaksin').get() as { count: number };
if (vaccineCount.count === 0) {
  const insertVaccine = db.prepare('INSERT INTO stok_vaksin (id, nama_vaksin, stok_tersedia, last_update) VALUES (?, ?, ?, ?)');
  insertVaccine.run('1', 'Meningitis', 10, new Date().toISOString().slice(0, 10));
  insertVaccine.run('2', 'Polio', 28, new Date().toISOString().slice(0, 10));
  insertVaccine.run('3', 'Influenza', 13, new Date().toISOString().slice(0, 10));
}

// Seed admin user if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as { count: number };
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, password, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Administrator', '0000000000000000', '1990-01-01', 'RSUD AL-MULK', '08123456789', 'admin@almulk.com', 'RSAlMulk@67', 'admin', new Date().toISOString());
  
  // Also keep the requested legacy admin login
  db.prepare(`
    INSERT INTO users (nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, password, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Admin Utama', '3272075', '1990-01-01', 'RSUD AL-MULK', '08123456789', '3272075', 'RSAlMulk@67', 'admin', new Date().toISOString());
}

// Ensure the requested permanent admin account exists
try {
  const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('rsudalmulk@gmail.com');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, password, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Admin RSUD Al-Mulk', 'admin_rsudalmulk', '1990-01-01', 'RSUD AL-MULK', '-', 'rsudalmulk@gmail.com', 'RSAlMulk@67', 'admin', new Date().toISOString());
  } else {
    db.prepare('UPDATE users SET password = ?, role = ? WHERE email = ?').run('RSAlMulk@67', 'admin', 'rsudalmulk@gmail.com');
  }
} catch (e) {
  console.error("Error ensuring permanent admin account:", e);
}

const eicvCount = db.prepare('SELECT COUNT(*) as count FROM eicv_stock').get() as { count: number };
if (eicvCount.count === 0) {
  db.prepare('INSERT INTO eicv_stock (id, jumlah_stok, terakhir_update) VALUES (1, ?, ?)').run(60, new Date().toISOString().slice(0, 10));
}

const poliCount = db.prepare('SELECT COUNT(*) as count FROM poliklinik').get() as { count: number };
if (poliCount.count === 0) {
  const insertPoli = db.prepare('INSERT INTO poliklinik (id_poli, nama_poli, deskripsi, lokasi_ruangan, status_poli, kuota_harian) VALUES (?, ?, ?, ?, ?, ?)');
  insertPoli.run('p1', 'Poli Umum', 'Pelayanan kesehatan umum', 'Lantai 1 Ruang Poli Umum', 'Aktif', 30);
  insertPoli.run('p2', 'Poli Anak', 'Pelayanan kesehatan anak', 'Lantai 1, Ruang Poli Anak', 'Aktif', 25);
  insertPoli.run('p3', 'Poli Obgyn', 'Pelayanan kebidanan dan kandungan', 'Lantai 1, Ruang Poli Obgyn', 'Aktif', 15);
  insertPoli.run('p4', 'Poli Gigi', 'Pelayanan kesehatan gigi dan mulut', 'Lantai 1, Ruang Poli Gigi', 'Aktif', 15);
  insertPoli.run('p5', 'Poli Penyakit Dalam', 'Pelayanan penyakit dalam', 'Lantai 1, Ruang Poli Penyakit Dalam', 'Aktif', 30);
  insertPoli.run('p6', 'Poli Neurologi', 'Pelayanan saraf', 'Lantai 1, Ruang Poli Saraf', 'Aktif', 15);
  insertPoli.run('p7', 'Poli Bedah', 'Pelayanan bedah', 'Lantai 1, Ruang Poli Bedah', 'Aktif', 10);
  insertPoli.run('p8', 'Poli Vaksinasi', 'Pelayanan vaksinasi', 'Lantai 1, Ruang Poli Vaksinasi', 'Aktif', 10);
}

const dokterCount = db.prepare('SELECT COUNT(*) as count FROM dokter').get() as { count: number };
if (dokterCount.count === 0) {
  const insertDokter = db.prepare('INSERT INTO dokter (id_dokter, nama_dokter, spesialis, poli, jadwal_praktek) VALUES (?, ?, ?, ?, ?)');
  insertDokter.run('d1', 'dr. Hijrah Saputra WR, Sp.PD', 'Spesialis Penyakit Dalam', 'Poli Penyakit Dalam', 'Senin dan Rabu, Jumat');
  insertDokter.run('d2', 'dr. Niko Adhi H, Sp.PD, FINASIM', 'Spesialis Penyakit Dalam', 'Poli Penyakit Dalam', 'Selasa');
  insertDokter.run('d3', 'dr. Dhyniek Nurul FLA, Sp.A', 'Spesialis Anak', 'Poli Anak', 'Senin - Jumat');
  insertDokter.run('d4', 'dr. Ferry Sudarsono, Sp.B, FINACS', 'Spesialis Bedah', 'Poli Bedah', 'Senin - Jumat');
  insertDokter.run('d5', 'dr. Billy Nusa Anggara T, Sp.OG', 'Spesialis Obgyn', 'Poli Obgyn', 'Senin, Rabu dan Jumat');
  insertDokter.run('d6', 'dr. Muthiah Nurul I, Sp.OG', 'Spesialis Obgyn', 'Poli Obgyn', 'Senin - Jumat');
  insertDokter.run('d7', 'dr. Haris Nur, Sp.N', 'Spesialis Neurologi', 'Poli Neurologi', 'Senin, Rabu, Jumat');
  insertDokter.run('d8', 'Lelawati', 'Dokter Gigi', 'Poli Gigi', 'Senin - Sabtu');
  insertDokter.run('d9', 'dr. M. Arifin Ramadhani', 'Dokter Umum', 'Poli Umum', 'Senin - Sabtu');
  insertDokter.run('d10', 'dr. M. Arifin Ramadhani', 'Dokter Umum', 'Poli Vaksinasi', 'Senin - Jumat');
}

const jadwalCount = db.prepare('SELECT COUNT(*) as count FROM jadwal_layanan').get() as { count: number };
if (jadwalCount.count === 0) {
  const insertJadwal = db.prepare('INSERT INTO jadwal_layanan (id_jadwal, nama_poli, nama_dokter, hari_praktek, jam_mulai, jam_selesai, status_layanan) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertJadwal.run('j1', 'Poli Penyakit Dalam', 'dr. Hijrah Saputra WR, Sp.PD', 'Senin, Rabu', '07:30', '09:00', 'Aktif');
  insertJadwal.run('j2', 'Poli Penyakit Dalam', 'dr. Hijrah Saputra WR, Sp.PD', 'Jumat', '12:30', '15:00', 'Aktif');
  insertJadwal.run('j3', 'Poli Penyakit Dalam', 'dr. Niko Adhi H, Sp.PD, FINASIM', 'Selasa', '15:00', '18:00', 'Aktif');
  insertJadwal.run('j4', 'Poli Anak', 'dr. Dhyniek Nurul FLA, Sp.A', 'Senin - Jumat', '08:00', '10:00', 'Aktif');
  insertJadwal.run('j5', 'Poli Bedah', 'dr. Ferry Sudarsono, Sp.B, FINACS', 'Senin - Jumat', '07:30', '11:00', 'Aktif');
  insertJadwal.run('j6', 'Poli Obgyn', 'dr. Billy Nusa Anggara T, Sp.OG', 'Senin, Rabu, Jumat', '16:00', '18:00', 'Aktif');
  insertJadwal.run('j7', 'Poli Obgyn', 'dr. Muthiah Nurul I, Sp.OG', 'Senin - Jumat', '07:30', '11:00', 'Aktif');
  insertJadwal.run('j8', 'Poli Neurologi', 'dr. Haris Nur, Sp.N', 'Senin, Rabu, Jumat', '15:30', '18:00', 'Aktif');
  insertJadwal.run('j9', 'Poli Gigi', 'Lelawati', 'Senin - Sabtu', '08:00', '12:00', 'Aktif');
  insertJadwal.run('j10', 'Poli Umum', 'dr. M. Arifin Ramadhani', 'Senin - Sabtu', '08:00', '12:00', 'Aktif');
  insertJadwal.run('j11', 'Poli Vaksinasi', 'dr. M. Arifin Ramadhani', 'Senin - Jumat', '08:00', '14:00', 'Aktif');
}

const jadwalDokterCount = db.prepare('SELECT COUNT(*) as count FROM jadwal_dokter').get() as { count: number };
if (jadwalDokterCount.count === 0) {
  const insertJadwalDokter = db.prepare('INSERT INTO jadwal_dokter (nama_dokter, hari_praktek, jam_mulai, jam_selesai, poli) VALUES (?, ?, ?, ?, ?)');
  insertJadwalDokter.run('dr. Hijrah Saputra WR, Sp.PD', 'Senin', '07:30', '09:00', 'Poli Penyakit Dalam');
  insertJadwalDokter.run('dr. Hijrah Saputra WR, Sp.PD', 'Rabu', '07:30', '09:00', 'Poli Penyakit Dalam');
  insertJadwalDokter.run('dr. Hijrah Saputra WR, Sp.PD', 'Jumat', '12:30', '15:00', 'Poli Penyakit Dalam');
  insertJadwalDokter.run('dr. Niko Adhi H, Sp.PD, FINASIM', 'Selasa', '15:00', '18:00', 'Poli Penyakit Dalam');
  insertJadwalDokter.run('dr. Dhyniek Nurul FLA, Sp.A', 'Senin - Jumat', '08:00', '10:00', 'Poli Anak');
  insertJadwalDokter.run('dr. Ferry Sudarsono, Sp.B, FINACS', 'Senin - Jumat', '07:30', '11:00', 'Poli Bedah');
  insertJadwalDokter.run('dr. Billy Nusa Anggara T, Sp.OG', 'Senin', '16:00', '18:00', 'Poli Obgyn');
  insertJadwalDokter.run('dr. Billy Nusa Anggara T, Sp.OG', 'Rabu', '16:00', '18:00', 'Poli Obgyn');
  insertJadwalDokter.run('dr. Billy Nusa Anggara T, Sp.OG', 'Jumat', '16:00', '18:00', 'Poli Obgyn');
  insertJadwalDokter.run('dr. Muthiah Nurul I, Sp.OG', 'Senin - Jumat', '07:30', '11:00', 'Poli Obgyn');
  insertJadwalDokter.run('dr. Haris Nur, Sp.N', 'Senin', '15:30', '18:00', 'Poli Neurologi');
  insertJadwalDokter.run('dr. Haris Nur, Sp.N', 'Rabu', '15:30', '18:00', 'Poli Neurologi');
  insertJadwalDokter.run('dr. Haris Nur, Sp.N', 'Jumat', '15:30', '18:00', 'Poli Neurologi');
  insertJadwalDokter.run('Lelawati', 'Senin - Sabtu', '08:00', '12:00', 'Poli Gigi');
  insertJadwalDokter.run('dr. M. Arifin Ramadhani', 'Senin - Sabtu', '08:00', '12:00', 'Poli Umum');
  insertJadwalDokter.run('dr. M. Arifin Ramadhani', 'Senin - Jumat', '08:00', '14:00', 'Poli Vaksinasi');
}

const layananImagesCount = db.prepare('SELECT COUNT(*) as count FROM layanan_images').get() as { count: number };
if (layananImagesCount.count === 0) {
  const insertLayananImage = db.prepare('INSERT INTO layanan_images (service_id, image_url) VALUES (?, ?)');
  
  // IGD
  insertLayananImage.run('igd', '/rsud-al-mulk.jpg');
  insertLayananImage.run('igd', '/fasilitas-4.jpg');
  insertLayananImage.run('igd', '/ruang-igd.jpg');
  
  // Poli
  insertLayananImage.run('poli', '/fasilitas-1.jpg');
  insertLayananImage.run('poli', '/fasilitas-2.jpg');
  
  // Radiologi & Laboratorium
  insertLayananImage.run('radio', '/ruang radiologi-2.jpg');
  insertLayananImage.run('radio', '/fasilitas-3.jpg');
  
  // Farmasi
  insertLayananImage.run('farmasi', '/apotek.jpg');
  insertLayananImage.run('farmasi', '/apotek-2.jpg');
  insertLayananImage.run('farmasi', '/fasilitas-3.jpg');
  
  // Vaksinasi
  insertLayananImage.run('vaksinasi', '/doctor-1.jpg');
  insertLayananImage.run('vaksinasi', '/ruang-vaksinasi-2.jpg');
  insertLayananImage.run('vaksinasi', '/tentang-kami.jpg');
}

const logoFooterCount = db.prepare('SELECT COUNT(*) as count FROM logo_footer').get() as { count: number };
if (logoFooterCount.count === 0) {
  const insertLogo = db.prepare('INSERT INTO logo_footer (nama_instansi, gambar_logo, link_instansi, status) VALUES (?, ?, ?, ?)');
  insertLogo.run('RSUD Al-Mulk', '/logo akre-1.jpg', 'https://rsudalmulk.sukabumikota.go.id', 'aktif');
  insertLogo.run('Pemerintah Kota Sukabumi', '/logo pemkot.jpg', 'https://sukabumikota.go.id', 'aktif');
  insertLogo.run('Kementerian Kesehatan', '/logo kemenkes.jpg', 'https://kemkes.go.id', 'aktif');
  insertLogo.run('BPJS Kesehatan', '/logo bpjs.jpg', 'https://bpjs-kesehatan.go.id', 'aktif');
}

export default db;
