import express from 'express';
import { supabase } from './supabase.ts';
import path from 'path';
import bcrypt from 'bcryptjs';

export async function uploadToSupabaseStorage(base64Data: string, folder: string, prefix: string) {
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 format');
  }

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const extension = mimeType.split('/')[1] === 'svg+xml' ? 'svg' : (mimeType.split('/')[1] || 'jpg');
  const fileName = `${prefix}_${Date.now()}.${extension}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    console.error('Supabase upload error:', error);
    if (error.message.includes('Bucket not found')) {
      throw new Error(`Gagal upload ke Supabase: Bucket 'uploads' tidak ditemukan. 
        
        SILAKAN IKUTI LANGKAH INI:
        1. Buka Dashboard Supabase Anda.
        2. Pergi ke menu 'Storage'.
        3. Klik 'New Bucket'.
        4. Beri nama bucket: 'uploads'.
        5. Pastikan centang 'Public bucket'.
        6. Klik 'Save'.`);
    }
    
    if (error.message.includes('row-level security policy')) {
      throw new Error(`Gagal upload ke Supabase: Pelanggaran Kebijakan Keamanan (RLS).
        
        ANDA PUNYA 2 PILIHAN UNTUK MEMPERBAIKI INI:
        
        OPSI A: Tambahkan Service Role Key (REKOMENDASI)
        1. Buka Dashboard Supabase -> Project Settings -> API.
        2. Cari 'service_role' key (BUKAN anon key).
        3. Tambahkan ke AI Studio Secrets dengan nama: 'SUPABASE_SERVICE_ROLE_KEY'.
        4. Ini akan melewati RLS untuk operasi server-side secara otomatis.
        
        OPSI B: Atur Kebijakan RLS Manual
        1. Buka Dashboard Supabase -> Storage -> Buckets -> 'uploads'.
        2. Klik tab 'Policies'.
        3. Klik 'New Policy' -> 'Get started quickly'.
        4. Pilih template 'Enable insert access for anonymous users'.
        5. Pastikan operasi 'INSERT' dicentang, lalu 'Save'.
        6. Ulangi untuk 'SELECT', 'UPDATE', dan 'DELETE'.`);
    }
    
    throw new Error(`Gagal upload ke Supabase: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deleteFromSupabaseStorage(fileUrl: string) {
  try {
    if (!fileUrl) return;
    const urlParts = fileUrl.split('/storage/v1/object/public/uploads/');
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      await supabase.storage.from('uploads').remove([filePath]);
    }
  } catch (error) {
    console.error('Failed to delete old file from Supabase:', error);
  }
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve uploads folder (for local dev if not using Supabase)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.post('/api/upload', async (req, res) => {
    try {
      const { file, type, nik } = req.body;
      if (!file) return res.status(400).json({ error: 'No file provided' });
      
      const fileUrl = await uploadToSupabaseStorage(file, 'dokumen_pasien', `${type}_${nik}`);
      res.json({ success: true, url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, password } = req.body;
      
      if (!nik || nik.length !== 16) {
        return res.status(400).json({ error: 'NIK harus 16 digit' });
      }
      if (!tanggal_lahir) {
        return res.status(400).json({ error: 'Tanggal lahir wajib diisi' });
      }
      if (new Date(tanggal_lahir) > new Date()) {
        return res.status(400).json({ error: 'Tanggal lahir tidak boleh lebih dari hari ini' });
      }
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email tidak valid' });
      }
      if (!no_hp || !/^\d+$/.test(no_hp)) {
        return res.status(400).json({ error: 'Nomor telepon harus angka' });
      }

      // Check existing email or NIK
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},nik.eq.${nik}`)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Email atau NIK sudah terdaftar.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          nama_pasien,
          nik,
          tanggal_lahir,
          alamat,
          no_hp,
          email,
          password: hashedPassword,
          role: 'patient',
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      res.json({ success: true, message: 'Registrasi berhasil. Silakan login menggunakan akun Anda.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { type, email, password, username } = req.body;
      
      if (type === 'admin') {
        const { data: admin } = await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${username},nik.eq.${username}`)
          .eq('role', 'admin')
          .single();

        if (admin) {
          const isMatch = await bcrypt.compare(password, admin.password);
          if (isMatch || password === admin.password) {
            const { password: _, ...adminWithoutPassword } = admin;
            return res.json({ 
              success: true, 
              user: { ...adminWithoutPassword, role: 'admin' }
            });
          }
        }
        
        if (username === '3272075' && password === 'RSAlMulk@67') {
          return res.json({ 
            success: true, 
            user: { role: 'admin', username: '3272075', nama_pasien: 'Admin Utama' }
          });
        }
        if (username === 'rsudalmulk@gmail.com' && password === 'RSAlMulk@67') {
          return res.json({ 
            success: true, 
            user: { role: 'admin', username: 'rsudalmulk@gmail.com', nama_pasien: 'Admin RSUD Al-Mulk' }
          });
        }
        return res.status(401).json({ error: 'Username atau password admin salah' });
      } else {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('role', 'patient')
          .single();

        if (!user) {
          return res.status(401).json({ error: 'Akun tidak ditemukan. Silakan registrasi terlebih dahulu.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch || password === user.password) {
          const { password: _, ...userWithoutPassword } = user;
          return res.json({ 
            success: true, 
            user: { ...userWithoutPassword, role: 'patient' }
          });
        }
        return res.status(401).json({ error: 'Email atau password salah' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/auth/me/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/auth/profile', async (req, res) => {
    try {
      const { id, alamat, no_hp, email, foto_profil } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email tidak valid' });
      }
      if (!no_hp || !/^\d+$/.test(no_hp)) {
        return res.status(400).json({ error: 'Nomor telepon harus angka' });
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          alamat,
          no_hp,
          email,
          foto_profil: foto_profil || undefined
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (!updatedUser) throw new Error('Failed to fetch updated user');
      const { password: _, ...userWithoutPassword } = updatedUser as any;
      
      res.json({ success: true, user: { ...userWithoutPassword } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/upload-photo', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { image, userId } = req.body;
      if (!image || !userId) {
        return res.status(400).json({ error: 'Image and userId are required' });
      }

      const fileUrl = await uploadToSupabaseStorage(image, 'foto_pasien', `profile_${userId}`);
      
      const { error } = await supabase
        .from('users')
        .update({ foto_profil: fileUrl })
        .eq('id', userId);

      if (error) throw error;
      
      res.json({ success: true, url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Patients
  app.get('/api/patients', async (req, res) => {
    try {
      const { data: patients, error } = await supabase
        .from('users')
        .select('id, nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, foto_profil, created_at')
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/patients/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_pasien, nik, tanggal_lahir, alamat, no_hp, email } = req.body;
      
      const { error } = await supabase
        .from('users')
        .update({
          nama_pasien,
          nik,
          tanggal_lahir,
          alamat,
          no_hp,
          email
        })
        .eq('id', id)
        .eq('role', 'patient');

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/patients/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq('role', 'patient');

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Appointments
  app.get('/api/appointments', async (req, res) => {
    try {
      const { data: appointments, error } = await supabase
        .from('booking_kunjungan')
        .select('*')
        .order('waktu_booking', { ascending: false });

      if (error) throw error;
      res.json(appointments.map((a: any) => ({
        ...a,
        jenis_vaksin: a.jenis_vaksin ? (typeof a.jenis_vaksin === 'string' ? JSON.parse(a.jenis_vaksin) : a.jenis_vaksin) : []
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const data = req.body;
      const date = data.tanggal_kunjungan;
      const { count } = await supabase
        .from('booking_kunjungan')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal_kunjungan', date);

      const nomor = (count || 0) + 1;
      const nomor_antrian = `A${nomor.toString().padStart(3, '0')}`;
      
      const { error: insertError } = await supabase
        .from('booking_kunjungan')
        .insert([{
          id_booking: data.id_booking,
          id_jadwal: data.id_jadwal || null,
          nama_pasien: data.nama_pasien,
          nik: data.nik,
          tanggal_lahir: data.tanggal_lahir,
          jenis_kelamin: data.jenis_kelamin,
          nomor_hp: data.nomor_hp,
          alamat: data.alamat,
          jenis_jaminan: data.jenis_jaminan,
          nomor_bpjs: data.nomor_bpjs || null,
          poli: data.poli,
          dokter: data.dokter,
          tanggal_kunjungan: data.tanggal_kunjungan,
          time: data.time || '',
          nomor_antrian: nomor_antrian,
          jenis_vaksin: JSON.stringify(data.jenis_vaksin || []),
          status_antrian: data.status_antrian || 'Belum Check-In',
          waktu_booking: new Date().toISOString(),
          file_ktp_kk: data.file_ktp_kk || null,
          file_passport: data.file_passport || null,
          tanggal_upload: data.tanggal_upload || null
        }]);

      if (insertError) throw insertError;
      
      if (data.jenis_vaksin && data.jenis_vaksin.length > 0) {
        for (const vaksin of data.jenis_vaksin) {
          const { data: stock } = await supabase
            .from('stok_vaksin')
            .select('stok_tersedia')
            .eq('nama_vaksin', vaksin)
            .single();
          
          if (stock) {
            await supabase
              .from('stok_vaksin')
              .update({ stok_tersedia: stock.stok_tersedia - 1 })
              .eq('nama_vaksin', vaksin);
          }

          if (vaksin === 'Meningitis') {
            const { data: eicv } = await supabase
              .from('eicv_stock')
              .select('jumlah_stok')
              .eq('id', 1)
              .single();
            
            if (eicv) {
              await supabase
                .from('eicv_stock')
                .update({ jumlah_stok: eicv.jumlah_stok - 1 })
                .eq('id', 1);
            }
          }
        }
      }
      
      res.json({ success: true, nomor_antrian });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/appointments/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const { data: appointment } = await supabase
        .from('booking_kunjungan')
        .select('*')
        .eq('id_booking', id)
        .single();

      if (appointment && appointment.status_antrian !== 'Dibatalkan' && status === 'Dibatalkan') {
        if (appointment.jenis_vaksin) {
          const vaccines = typeof appointment.jenis_vaksin === 'string' ? JSON.parse(appointment.jenis_vaksin) : appointment.jenis_vaksin;
          for (const vaksin of vaccines) {
            const { data: stock } = await supabase
              .from('stok_vaksin')
              .select('stok_tersedia')
              .eq('nama_vaksin', vaksin)
              .single();
            
            if (stock) {
              await supabase
                .from('stok_vaksin')
                .update({ stok_tersedia: stock.stok_tersedia + 1 })
                .eq('nama_vaksin', vaksin);
            }

            if (vaksin === 'Meningitis') {
              const { data: eicv } = await supabase
                .from('eicv_stock')
                .select('jumlah_stok')
                .eq('id', 1)
                .single();
              
              if (eicv) {
                await supabase
                  .from('eicv_stock')
                  .update({ jumlah_stok: eicv.jumlah_stok + 1 })
                  .eq('id', 1);
              }
            }
          }
        }
      }
      
      const { error: updateError } = await supabase
        .from('booking_kunjungan')
        .update({ status_antrian: status })
        .eq('id_booking', id);

      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/appointments/:id/medical-record', async (req, res) => {
    try {
      const { id } = req.params;
      const recordData = req.body;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`rekam_medis/${id}.json`, JSON.stringify(recordData), {
          contentType: 'application/json',
          upsert: true
        });

      if (uploadError) throw uploadError;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/appointments/:id/medical-record', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(`rekam_medis/${id}.json`);

      if (error) {
        // If file not found, return empty record
        return res.json({
          keluhan: '',
          pemeriksaan: '',
          diagnosis: '',
          tindakan: '',
          resep: ''
        });
      }

      const text = await data.text();
      res.json(JSON.parse(text));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stocks
  app.get('/api/vaccine-stocks', async (req, res) => {
    try {
      const { data: stocks, error } = await supabase.from('stok_vaksin').select('*');
      if (error) throw error;
      res.json(stocks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/vaccine-stocks', async (req, res) => {
    try {
      const stocks = req.body;
      const date = new Date().toISOString().slice(0, 10);
      
      for (const stock of stocks) {
        await supabase
          .from('stok_vaksin')
          .update({ stok_tersedia: stock.stok_tersedia, last_update: date })
          .eq('id', stock.id);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/eicv-stock', async (req, res) => {
    try {
      const { data: stock, error } = await supabase.from('eicv_stock').select('*').eq('id', 1).single();
      if (error) throw error;
      res.json(stock);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/eicv-stock', async (req, res) => {
    try {
      const { jumlah_stok } = req.body;
      const date = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from('eicv_stock')
        .update({ jumlah_stok, terakhir_update: date })
        .eq('id', 1);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Poliklinik
  app.get('/api/poliklinik', async (req, res) => {
    try {
      const { data: poliklinik, error } = await supabase.from('poliklinik').select('*');
      if (error) throw error;
      res.json(poliklinik);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/poliklinik', async (req, res) => {
    try {
      const data = req.body;
      const { error } = await supabase.from('poliklinik').insert([data]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/poliklinik/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const { error } = await supabase.from('poliklinik').update(data).eq('id_poli', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dokter
  app.get('/api/dokter', async (req, res) => {
    try {
      const { data: dokter, error } = await supabase.from('dokter').select('*');
      if (error) {
        if (error.message.includes('Could not find the table')) {
          return res.json([]);
        }
        throw error;
      }
      res.json(dokter);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/dokter', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { nama_dokter, spesialis, poli, jadwal_praktek, foto_dokter } = req.body;
      let imageUrl = foto_dokter;

      if (foto_dokter && foto_dokter.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(foto_dokter, 'dokter', 'dokter');
      }

      const id_dokter = `DOC-${Date.now()}`;
      const { error } = await supabase.from('dokter').insert([{
        id_dokter,
        nama_dokter,
        spesialis,
        poli,
        jadwal_praktek,
        foto_dokter: imageUrl
      }]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/dokter/:id', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_dokter, spesialis, poli, jadwal_praktek, foto_dokter } = req.body;
      let imageUrl = foto_dokter;

      if (foto_dokter && foto_dokter.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(foto_dokter, 'dokter', 'dokter');
      }

      const { error } = await supabase.from('dokter').update({
        nama_dokter,
        spesialis,
        poli,
        jadwal_praktek,
        foto_dokter: imageUrl
      }).eq('id_dokter', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Jadwal Layanan
  app.get('/api/jadwal_layanan', async (req, res) => {
    try {
      const { data: jadwal, error } = await supabase.from('jadwal_layanan').select('*');
      if (error) throw error;
      res.json(jadwal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/jadwal_layanan', async (req, res) => {
    try {
      const data = req.body;
      const { error } = await supabase.from('jadwal_layanan').insert([{
        id_jadwal: data.id_jadwal,
        nama_poli: data.nama_poli,
        nama_dokter: data.nama_dokter,
        hari_praktek: data.hari_praktek,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        status_layanan: data.status_layanan,
        cuti_mulai: data.cuti_mulai || null,
        cuti_selesai: data.cuti_selesai || null
      }]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/jadwal_layanan/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const { error } = await supabase.from('jadwal_layanan').update({
        nama_poli: data.nama_poli,
        nama_dokter: data.nama_dokter,
        hari_praktek: data.hari_praktek,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        status_layanan: data.status_layanan,
        cuti_mulai: data.cuti_mulai || null,
        cuti_selesai: data.cuti_selesai || null
      }).eq('id_jadwal', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Jadwal Dokter
  app.get('/api/jadwal_dokter', async (req, res) => {
    try {
      const { data: jadwal, error } = await supabase.from('jadwal_dokter').select('*');
      if (error) throw error;
      
      const grouped = (jadwal || []).reduce((acc: any, curr: any) => {
        const key = `${curr.nama_dokter}_${curr.poli}`;
        if (!acc[key]) {
          acc[key] = {
            id: curr.id,
            nama_dokter: curr.nama_dokter,
            poli: curr.poli,
            status_dokter: curr.status_dokter,
            tanggal_mulai_cuti: curr.tanggal_mulai_cuti,
            tanggal_selesai_cuti: curr.tanggal_selesai_cuti,
            schedules: [{
              id: curr.id,
              hari_praktek: curr.hari_praktek,
              jam_mulai: curr.jam_mulai,
              jam_selesai: curr.jam_selesai,
              kuota_harian: curr.kuota_harian
            }]
          };
        } else {
          acc[key].schedules.push({
            id: curr.id,
            hari_praktek: curr.hari_praktek,
            jam_mulai: curr.jam_mulai,
            jam_selesai: curr.jam_selesai,
            kuota_harian: curr.kuota_harian
          });
        }
        return acc;
      }, {});
      
      res.json(Object.values(grouped));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/jadwal_dokter', async (req, res) => {
    try {
      const data = req.body;
      const { error } = await supabase.from('jadwal_dokter').insert([data]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/jadwal_dokter/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const { error } = await supabase.from('jadwal_dokter').update(data).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/jadwal_dokter/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('jadwal_dokter').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Logos
  app.get('/api/logos', async (req, res) => {
    try {
      const { status } = req.query;
      let query = supabase.from('logo_footer').select('*');
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('id_logo', { ascending: true });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/logos', async (req, res) => {
    try {
      const { nama_instansi, link_instansi, status, gambar_logo } = req.body;
      let imageUrl = gambar_logo;

      if (gambar_logo && gambar_logo.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(gambar_logo, 'logos', 'logo');
      }

      const { error } = await supabase.from('logo_footer').insert([{
        nama_instansi,
        link_instansi,
        status,
        gambar_logo: imageUrl,
        tanggal_upload: new Date().toISOString()
      }]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/logos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_instansi, link_instansi, status, gambar_logo } = req.body;
      let imageUrl = gambar_logo;

      const { data: oldLogo } = await supabase.from('logo_footer').select('gambar_logo').eq('id_logo', id).single();

      if (gambar_logo && gambar_logo.startsWith('data:image')) {
        if (oldLogo?.gambar_logo) {
          await deleteFromSupabaseStorage(oldLogo.gambar_logo);
        }
        imageUrl = await uploadToSupabaseStorage(gambar_logo, 'logos', 'logo');
      }

      const { error } = await supabase.from('logo_footer').update({
        nama_instansi,
        link_instansi,
        status,
        gambar_logo: imageUrl
      }).eq('id_logo', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/logos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: logo } = await supabase.from('logo_footer').select('gambar_logo').eq('id_logo', id).single();
      
      if (logo?.gambar_logo) {
        await deleteFromSupabaseStorage(logo.gambar_logo);
      }

      const { error } = await supabase.from('logo_footer').delete().eq('id_logo', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Layanan Images
  app.get('/api/layanan-images', async (req, res) => {
    try {
      const { service_id } = req.query;
      let query = supabase.from('layanan_images').select('*');
      if (service_id) {
        query = query.eq('service_id', service_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/services/:id/images', async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('layanan_images').select('*').eq('service_id', id);
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/layanan-images', async (req, res) => {
    try {
      const { service_id, image, caption } = req.body;
      const imageUrl = await uploadToSupabaseStorage(image, 'layanan', `layanan_${service_id}`);
      
      const { error } = await supabase.from('layanan_images').insert([{
        service_id,
        image_url: imageUrl,
        caption
      }]);
      if (error) throw error;
      res.json({ success: true, url: imageUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/layanan-images/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { image, caption, service_id } = req.body;
      let imageUrl = image;

      const { data: oldImg } = await supabase.from('layanan_images').select('image_url').eq('id', id).single();

      if (image && image.startsWith('data:image')) {
        if (oldImg?.image_url) {
          await deleteFromSupabaseStorage(oldImg.image_url);
        }
        imageUrl = await uploadToSupabaseStorage(image, 'layanan', `layanan_${service_id}`);
      }

      const { error } = await supabase.from('layanan_images').update({
        image_url: imageUrl,
        caption
      }).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/layanan-images/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: oldImg } = await supabase.from('layanan_images').select('image_url').eq('id', id).single();
      
      if (oldImg?.image_url) {
        await deleteFromSupabaseStorage(oldImg.image_url);
      }

      const { error } = await supabase.from('layanan_images').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Articles
  app.get('/api/articles', async (req, res) => {
    try {
      const { data, error } = await supabase.from('artikel_portal_rs').select('*').order('tanggal_publish', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/articles/featured', async (req, res) => {
    try {
      const { data, error } = await supabase.from('artikel_portal_rs').select('*').eq('is_featured', true).order('tanggal_publish', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/articles', async (req, res) => {
    try {
      const data = req.body;
      const { error } = await supabase.from('artikel_portal_rs').insert([{
        ...data,
        tanggal_publish: new Date().toISOString()
      }]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const { error } = await supabase.from('artikel_portal_rs').update(data).eq('id_artikel', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: article } = await supabase.from('artikel_portal_rs').select('gambar_slider').eq('id_artikel', id).single();
      
      if (article?.gambar_slider) {
        await deleteFromSupabaseStorage(article.gambar_slider);
      }

      const { error } = await supabase.from('artikel_portal_rs').delete().eq('id_artikel', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/articles/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: article } = await supabase.from('artikel_portal_rs').select('views').eq('id_artikel', id).single();
      if (article) {
        await supabase.from('artikel_portal_rs').update({ views: (article.views || 0) + 1 }).eq('id_artikel', id);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/articles/stats', async (req, res) => {
    try {
      const { data: articles, error } = await supabase.from('artikel_portal_rs').select('*');
      if (error) throw error;
      
      const totalViews = (articles || []).reduce((sum, a) => sum + (a.views || 0), 0);
      const topArticles = [...(articles || [])].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
      
      res.json({
        totalArticles: (articles || []).length,
        totalViews,
        topArticles
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/upload-article-image', async (req, res) => {
    try {
      const { image } = req.body;
      const fileUrl = await uploadToSupabaseStorage(image, 'artikel_slider', 'slider');
      res.json({ success: true, url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Additional routes for DisplayTV and Dashboard
  app.get('/api/booking_kunjungan', async (req, res) => {
    try {
      const { data, error } = await supabase.from('booking_kunjungan').select('*').order('waktu_booking', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/laporan/bulanan', async (req, res) => {
    try {
      const { data: appointments, error } = await supabase.from('booking_kunjungan').select('poli, status_antrian');
      if (error) throw error;
      
      const totalKunjungan = (appointments || []).length;
      const poliStats = (appointments || []).reduce((acc: any, curr: any) => {
        acc[curr.poli] = (acc[curr.poli] || 0) + 1;
        return acc;
      }, {});
      
      const statistikPoli = Object.entries(poliStats).map(([name, value]) => ({ name, value }));
      const topPoli = [...statistikPoli].sort((a: any, b: any) => b.value - a.value).slice(0, 5);
      
      res.json({ totalKunjungan, statistikPoli, topPoli });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}
