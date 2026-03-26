import express from 'express';
import { supabase } from './server/supabase.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Dynamic import for vite to avoid issues in production/Vercel
let createViteServer: any;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  import('vite').then(m => {
    createViteServer = m.createServer;
  });
}

async function uploadToSupabaseStorage(base64Data: string, folder: string, prefix: string) {
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

async function deleteFromSupabaseStorage(fileUrl: string) {
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

const app = express();

app.use(express.json({ limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.VERCEL ? 'vercel' : 'local' });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/site-assets', async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_assets').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching site assets:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/site-assets', async (req, res) => {
  try {
    const { asset_key, asset_url, description } = req.body;
    
    // Get old asset to delete its file
    const { data: oldAsset } = await supabase
      .from('site_assets')
      .select('asset_url')
      .eq('asset_key', asset_key)
      .maybeSingle();
      
    if (oldAsset && oldAsset.asset_url && oldAsset.asset_url !== asset_url) {
      await deleteFromSupabaseStorage(oldAsset.asset_url);
    }

    const { data, error } = await supabase
      .from('site_assets')
      .upsert(
        { asset_key, asset_url, description, updated_at: new Date().toISOString() },
        { onConflict: 'asset_key' }
      )
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error updating site asset:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/site-assets/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    // Get the asset URL first to delete from storage
    const { data: assetData } = await supabase
      .from('site_assets')
      .select('asset_url')
      .eq('asset_key', key)
      .maybeSingle();
      
    if (assetData && assetData.asset_url) {
      await deleteFromSupabaseStorage(assetData.asset_url);
    }

    const { error } = await supabase
      .from('site_assets')
      .delete()
      .eq('asset_key', key);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting site asset:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload-asset', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { image, asset_key } = req.body;
    if (!image || !asset_key) {
      return res.status(400).json({ error: 'Image and asset_key are required' });
    }
    
    const fileUrl = await uploadToSupabaseStorage(image, 'site_assets', asset_key);
    res.json({ url: fileUrl });
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ error: error.message });
  }
});

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
      const { data: existingUser, error: checkError } = await supabase
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
        // Check DB first for admin
        const { data: admin, error } = await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${username},nik.eq.${username}`)
          .eq('role', 'admin')
          .single();

        if (admin) {
          const isMatch = await bcrypt.compare(password, admin.password);
          if (isMatch || password === admin.password) { // Fallback for unhashed passwords
            const { password: _, ...adminWithoutPassword } = admin;
            return res.json({ 
              success: true, 
              user: { ...adminWithoutPassword, role: 'admin' }
            });
          }
        }
        
        // Legacy fallback
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
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('role', 'patient')
          .single();

        if (!user) {
          return res.status(401).json({ error: 'Akun tidak ditemukan. Silakan registrasi terlebih dahulu.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch || password === user.password) { // Fallback for unhashed passwords
          // Exclude password from response
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
      const { data: user, error } = await supabase
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
      const { id, nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, no_bpjs, foto_profil, jenis_kelamin } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email tidak valid' });
      }
      if (!no_hp || !/^\d+$/.test(no_hp)) {
        return res.status(400).json({ error: 'Nomor telepon harus angka' });
      }
      if (!nik || nik.length !== 16) {
        return res.status(400).json({ error: 'NIK harus 16 digit' });
      }
      if (!jenis_kelamin) {
        return res.status(400).json({ error: 'Jenis kelamin harus dipilih' });
      }
      if (!alamat) {
        return res.status(400).json({ error: 'Alamat lengkap harus diisi' });
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          nama_pasien,
          nik,
          tanggal_lahir,
          alamat,
          no_hp,
          email,
          nomor_bpjs: no_bpjs,
          foto_profil: foto_profil || undefined,
          jenis_kelamin
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
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
      
      // Get old photo to delete
      const { data: oldUser } = await supabase
        .from('users')
        .select('foto_profil')
        .eq('id', userId)
        .single();
      
      if (oldUser?.foto_profil) {
        await deleteFromSupabaseStorage(oldUser.foto_profil);
      }

      // Update user record
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

  // API Routes
  app.get('/api/patients', async (req, res) => {
    try {
      const { data: patients, error } = await supabase
        .from('users')
        .select('id, nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, foto_profil, created_at, jenis_kelamin, nomor_bpjs')
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
      const { nama_pasien, nik, tanggal_lahir, alamat, no_hp, email, jenis_kelamin, nomor_bpjs } = req.body;
      
      const { error } = await supabase
        .from('users')
        .update({
          nama_pasien,
          nik,
          tanggal_lahir,
          alamat,
          no_hp,
          email,
          jenis_kelamin,
          nomor_bpjs
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

  app.get('/api/obat', async (req, res) => {
    try {
      const { search, limit = 15 } = req.query;
      
      let query = supabase.from('obat_master').select('*');
      
      if (search) {
        query = query.ilike('nama_obat', `%${search}%`);
      }
      
      const { data, error } = await query.limit(Number(limit));
      
      if (error) {
        // Fallback mock data if table doesn't exist yet
        return res.json([
          { id: 'mock-1', nama_obat: 'Paracetamol 500 mg', kategori: 'Tablet', satuan: 'Tablet', stok: 100 },
          { id: 'mock-2', nama_obat: 'Amoxicillin 500 mg', kategori: 'Kapsul', satuan: 'Kapsul', stok: 50 }
        ]);
      }
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching obat:', error);
      res.status(500).json({ error: 'Failed to fetch obat' });
    }
  });

  app.get('/api/icd10', async (req, res) => {
    try {
      const { search = '', limit = 20 } = req.query;
      
      let query = supabase
        .from('icd10_codes')
        .select('*')
        .limit(Number(limit));

      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        // Fallback to mock data if table doesn't exist yet
        if (error.code === '42P01') {
          console.warn('icd10_codes table does not exist yet. Returning mock data.');
          const mockData = [
            { id: '1', code: 'J00', name: 'Acute nasopharyngitis [common cold]' },
            { id: '2', code: 'J01', name: 'Acute sinusitis' },
            { id: '3', code: 'J02', name: 'Acute pharyngitis' },
            { id: '4', code: 'J03', name: 'Acute tonsillitis' },
            { id: '5', code: 'J04', name: 'Acute laryngitis and tracheitis' },
            { id: '6', code: 'A09', name: 'Infectious gastroenteritis and colitis' },
            { id: '7', code: 'E11', name: 'Type 2 diabetes mellitus' },
            { id: '8', code: 'I10', name: 'Essential (primary) hypertension' },
            { id: '9', code: 'K21', name: 'Gastro-esophageal reflux disease' },
            { id: '10', code: 'R50', name: 'Fever of other and unknown origin' }
          ].filter(item => 
            item.code.toLowerCase().includes(String(search).toLowerCase()) || 
            item.name.toLowerCase().includes(String(search).toLowerCase())
          ).slice(0, Number(limit));
          return res.json(mockData);
        }
        throw error;
      }

      res.json(data);
    } catch (error: any) {
      console.error('Error fetching ICD-10 codes:', error);
      res.status(500).json({ error: error.message });
    }
  });

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

  class AsyncLock {
    private promise: Promise<void> | null = null;
    async acquire(): Promise<() => void> {
      let release: () => void;
      const newPromise = new Promise<void>(resolve => { release = resolve; });
      const currentPromise = this.promise;
      this.promise = (this.promise || Promise.resolve()).then(() => newPromise);
      if (currentPromise) await currentPromise;
      return release!;
    }
  }
  const bookingLock = new AsyncLock();

  app.post('/api/appointments', async (req, res) => {
    const release = await bookingLock.acquire();
    try {
      const data = req.body;
      
      // Generate queue number and registration ID based on visit date (tanggal_kunjungan)
      const visitDate = data.tanggal_kunjungan;
      if (!visitDate) {
        throw new Error('Tanggal kunjungan wajib diisi');
      }
      
      // Format visit date for ID (YYYYMMDD)
      const visitDateStr = visitDate.replace(/-/g, '');

      // Get the latest registration for the VISIT DATE to determine the next number
      // This ensures that queue numbers (A001, A002...) reset daily for each visit day
      const { data: latestBooking, error: fetchError } = await supabase
        .from('booking_kunjungan')
        .select('nomor_antrian')
        .eq('tanggal_kunjungan', visitDate)
        .order('nomor_antrian', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }
      
      let nomor = 1;
      if (latestBooking && latestBooking.nomor_antrian) {
        // Extract number from A001, A002, etc.
        const lastNumStr = latestBooking.nomor_antrian.replace(/[^0-9]/g, '');
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) {
          nomor = lastNum + 1;
        }
      }

      const nomor_antrian = `A${nomor.toString().padStart(3, '0')}`;
      const id_booking = `BK-${visitDateStr}-${nomor.toString().padStart(3, '0')}`;
      
      const { error: insertError } = await supabase
        .from('booking_kunjungan')
        .insert([{
          id_booking: id_booking,
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
          // Update stock
          const { data: stock, error: stockFetchError } = await supabase
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
            const { data: eicv, error: eicvFetchError } = await supabase
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
      
      res.json({ success: true, nomor_antrian, id_booking });
    } catch (error: any) {
      await supabase
        .from('error_logs')
        .insert([{
          waktu_error: new Date().toISOString(),
          user_input: 'system',
          data_input: JSON.stringify(req.body),
          pesan_error: error.message
        }]);
      res.status(500).json({ error: error.message });
    } finally {
      release();
    }
  });

  app.put('/api/appointments/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const { data: appointment, error: fetchError } = await supabase
        .from('booking_kunjungan')
        .select('*')
        .eq('id_booking', id)
        .single();

      if (fetchError) throw fetchError;

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
      const data = req.body;
      
      console.log('Saving medical record for booking:', id, data);

      // We'll use a table called 'rekam_medis'
      const { data: rmData, error } = await supabase
        .from('rekam_medis')
        .upsert({
          id_booking: id,
          id_pasien: data.id_pasien,
          keluhan: data.keluhan,
          tekanan_darah: data.tekanan_darah,
          nadi: data.nadi ? parseInt(data.nadi.toString()) : null,
          respirasi: data.respirasi ? parseInt(data.respirasi.toString()) : null,
          suhu: data.suhu ? parseFloat(data.suhu.toString()) : null,
          saturasi: data.saturasi ? parseInt(data.saturasi.toString()) : null,
          diagnosa: Array.isArray(data.diagnosa) ? JSON.stringify(data.diagnosa) : data.diagnosa, // Fallback JSON
          tindakan: data.tindakan,
          obat: Array.isArray(data.resep) ? JSON.stringify(data.resep) : data.resep,
          dosis: data.dosis,
          pemeriksaan: data.pemeriksaan,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id_booking' })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }

      // Initialize arrays to hold inserted data for the response
      let diagnosaToInsert: any[] = [];
      let resepToInsert: any[] = [];

      // Handle ICD-10 relational table if data.diagnosa is an array of objects
      if (rmData && rmData.id && Array.isArray(data.diagnosa)) {
        try {
          // Delete existing relations
          await supabase
            .from('rekam_medis_diagnosa')
            .delete()
            .eq('rekam_medis_id', rmData.id);

          for (const d of data.diagnosa) {
            let icd10_id = d.id;
            
            // If it's a custom diagnosis, insert it into icd10_codes first
            if (d.id === 'custom' || !d.id) {
              const rawName = (d.name || d.code || 'Custom Diagnosis').trim().replace(/\s+/g, ' ');
              const diagName = rawName.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
              
              // Check if exists
              const { data: existingDiag } = await supabase
                .from('icd10_codes')
                .select('id, code, name')
                .ilike('name', diagName)
                .limit(1)
                .maybeSingle();

              if (existingDiag) {
                icd10_id = existingDiag.id;
                d.id = existingDiag.id;
                d.code = existingDiag.code;
                d.name = existingDiag.name;
              } else {
                const customCode = `CUST-${Math.floor(Math.random() * 1000000)}`;
                const { data: newDiag, error: newDiagError } = await supabase
                  .from('icd10_codes')
                  .insert({
                    code: customCode,
                    name: diagName,
                    description: 'Manual input'
                  })
                  .select('id, code, name')
                  .single();
                  
                if (!newDiagError && newDiag) {
                  icd10_id = newDiag.id;
                  d.id = newDiag.id;
                  d.code = newDiag.code;
                  d.name = newDiag.name;
                } else {
                  console.warn('Failed to create custom diagnosis:', newDiagError);
                  continue; // Skip this one if we couldn't create it
                }
              }
            }
            
            if (icd10_id && icd10_id !== 'custom') {
              diagnosaToInsert.push({
                rekam_medis_id: rmData.id,
                icd10_id: icd10_id
              });
            }
          }

          if (diagnosaToInsert.length > 0) {
            const { error: diagError } = await supabase
              .from('rekam_medis_diagnosa')
              .insert(diagnosaToInsert);
            
            if (diagError) {
              console.warn('Could not insert into rekam_medis_diagnosa (table might not exist yet):', diagError.message);
            }
          }
          
          // Update the JSON fallback in rekam_medis with the new IDs
          await supabase
            .from('rekam_medis')
            .update({ diagnosa: JSON.stringify(data.diagnosa) })
            .eq('id', rmData.id);
            
        } catch (err) {
          console.warn('Error handling rekam_medis_diagnosa:', err);
        }
      }

      // Handle resep_obat relational table
      if (rmData && rmData.id && Array.isArray(data.resep)) {
        try {
          // Delete existing relations
          await supabase
            .from('resep_obat')
            .delete()
            .eq('rekam_medis_id', rmData.id);

          for (const r of data.resep) {
            let obat_id = r.obat_id;
            
            // If it's a custom medicine, insert it into obat_master first
            if (!r.obat_id || r.obat_id === 'custom') {
              const rawName = (r.nama_obat || r.obat_id || 'Custom Obat').trim().replace(/\s+/g, ' ');
              const obatName = rawName.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
              
              // Check if exists
              const { data: existingObat } = await supabase
                .from('obat_master')
                .select('id, nama_obat')
                .ilike('nama_obat', obatName)
                .limit(1)
                .maybeSingle();

              if (existingObat) {
                obat_id = existingObat.id;
                r.obat_id = existingObat.id;
                r.nama_obat = existingObat.nama_obat;
              } else {
                const { data: newObat, error: newObatError } = await supabase
                  .from('obat_master')
                  .insert({
                    nama_obat: obatName,
                    kategori: 'Lainnya',
                    satuan: 'pcs',
                    stok: 100 // Default stock for custom medicine
                  })
                  .select('id, nama_obat')
                  .single();
                  
                if (!newObatError && newObat) {
                  obat_id = newObat.id;
                  r.obat_id = newObat.id;
                  r.nama_obat = newObat.nama_obat;
                } else {
                  console.warn('Failed to create custom medicine:', newObatError);
                  continue; // Skip this one if we couldn't create it
                }
              }
            }
            
            if (obat_id && obat_id !== 'custom') {
              resepToInsert.push({
                rekam_medis_id: rmData.id,
                obat_id: obat_id,
                dosis: r.dosis,
                frekuensi: r.frekuensi,
                durasi: r.durasi,
                cara_pakai: r.cara_pakai
              });
            }
          }

          if (resepToInsert.length > 0) {
            const { error: resepError } = await supabase
              .from('resep_obat')
              .insert(resepToInsert);
            
            if (resepError) {
              console.warn('Could not insert into resep_obat:', resepError.message);
            } else {
              // Update stock for each drug
              for (const r of resepToInsert) {
                // Get current stock
                const { data: obatData } = await supabase
                  .from('obat_master')
                  .select('stok')
                  .eq('id', r.obat_id)
                  .single();
                  
                if (obatData && obatData.stok > 0) {
                  await supabase
                    .from('obat_master')
                    .update({ stok: obatData.stok - 1 }) // Simple decrement, ideally based on quantity
                    .eq('id', r.obat_id);
                }
              }
            }
          }
          
          // Update the JSON fallback in rekam_medis with the new IDs
          await supabase
            .from('rekam_medis')
            .update({ resep: JSON.stringify(data.resep) })
            .eq('id', rmData.id);
            
        } catch (err) {
          console.warn('Error handling resep_obat:', err);
        }
      }

      // Update user's no_rekam_medis if provided
      if (data.no_rm && data.id_pasien) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ no_rekam_medis: data.no_rm })
          .eq('nik', data.id_pasien);
          
        if (userUpdateError) {
          console.error('Error updating user no_rekam_medis:', userUpdateError);
        }
      }

      res.json({ success: true, diagnosa: diagnosaToInsert, resep: resepToInsert });
    } catch (error: any) {
      console.error('Medical record save error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/appointments/:id/medical-record', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('rekam_medis')
        .select('*')
        .eq('id_booking', id)
        .single();

      // Get patient's no_rekam_medis from booking -> users
      let no_rm = '';
      const { data: booking } = await supabase
        .from('booking_kunjungan')
        .select('nik')
        .eq('id_booking', id)
        .single();
        
      if (booking) {
        const { data: user } = await supabase
          .from('users')
          .select('no_rekam_medis')
          .eq('nik', booking.nik)
          .single();
          
        if (user && user.no_rekam_medis) {
          no_rm = user.no_rekam_medis;
        }
      }

      if (error || !data) {
        return res.json({
          no_rm,
          keluhan: '',
          pemeriksaan: '',
          tekanan_darah: '',
          nadi: '',
          respirasi: '',
          suhu: '',
          saturasi: '',
          diagnosa: '',
          tindakan: '',
          obat: '',
          dosis: '',
          resep: []
        });
      }

      // Fetch resep_obat
      let resep = [];
      if (data.id) {
        const { data: resepData, error: resepError } = await supabase
          .from('resep_obat')
          .select(`
            id,
            dosis,
            frekuensi,
            durasi,
            cara_pakai,
            obat_id,
            obat_master (
              id,
              nama_obat,
              satuan,
              stok
            )
          `)
          .eq('rekam_medis_id', data.id);
          
        if (!resepError && resepData) {
          resep = resepData.map((r: any) => ({
            id: r.id,
            obat_id: r.obat_id,
            nama_obat: r.obat_master?.nama_obat,
            satuan: r.obat_master?.satuan,
            stok: r.obat_master?.stok,
            dosis: r.dosis,
            frekuensi: r.frekuensi,
            durasi: r.durasi,
            cara_pakai: r.cara_pakai
          }));
        }
      }
      
      // Fallback to data.obat if resep_obat table doesn't exist or is empty
      if (resep.length === 0 && data && data.obat) {
        try {
          if (typeof data.obat === 'string') {
            resep = JSON.parse(data.obat);
          } else if (Array.isArray(data.obat)) {
            resep = data.obat;
          }
        } catch (e) {
          console.warn('Could not parse data.obat as JSON', e);
        }
      }

      if (data && data.diagnosa) {
        try {
          if (typeof data.diagnosa === 'string') {
            const parsed = JSON.parse(data.diagnosa);
            if (Array.isArray(parsed)) {
              data.diagnosa = parsed;
            } else {
              data.diagnosa = [{ id: 'custom', name: data.diagnosa, code: 'Custom' }];
            }
          } else if (!Array.isArray(data.diagnosa)) {
             data.diagnosa = [{ id: 'custom', name: String(data.diagnosa), code: 'Custom' }];
          }
        } catch (e) {
          // It's a plain string (old format), we can convert it to an array of objects or leave it
          // For backward compatibility, let's wrap it in an object if it's not JSON
          data.diagnosa = [{ id: 'custom', name: data.diagnosa, code: 'Custom' }];
        }
      } else if (data) {
        data.diagnosa = [];
      }

      res.json({
        ...data,
        no_rm,
        resep
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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

  app.get('/api/dokter', async (req, res) => {
    try {
      const { data, error } = await supabase.from('dokter').select('*').order('created_at', { ascending: false });
      if (error) {
        // Return empty array if table doesn't exist yet
        return res.json([]);
      }
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/dokter', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { nama_dokter, spesialis, poli, jadwal_praktek, foto_dokter, is_rekomendasi, urutan_rekomendasi } = req.body;
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
        foto_dokter: imageUrl,
        is_rekomendasi,
        urutan_rekomendasi
      }]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error in POST /api/dokter:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/dokter/:id', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_dokter, spesialis, poli, jadwal_praktek, foto_dokter, is_rekomendasi, urutan_rekomendasi } = req.body;
      let imageUrl = foto_dokter;

      if (foto_dokter && foto_dokter.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(foto_dokter, 'dokter', 'dokter');
        
        // Delete old image
        const { data: oldDoc } = await supabase
          .from('dokter')
          .select('foto_dokter')
          .eq('id_dokter', id)
          .single();
        
        if (oldDoc?.foto_dokter) {
          await deleteFromSupabaseStorage(oldDoc.foto_dokter);
        }
      }

      const { error } = await supabase.from('dokter').update({
        nama_dokter,
        spesialis,
        poli,
        jadwal_praktek,
        foto_dokter: imageUrl,
        is_rekomendasi,
        urutan_rekomendasi
      }).eq('id_dokter', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/dokter/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete image from storage
      const { data: oldDoc } = await supabase
        .from('dokter')
        .select('foto_dokter')
        .eq('id_dokter', id)
        .single();
      
      if (oldDoc?.foto_dokter) {
        await deleteFromSupabaseStorage(oldDoc.foto_dokter);
      }

      const { error } = await supabase.from('dokter').delete().eq('id_dokter', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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

  app.get('/api/jadwal_dokter', async (req, res) => {
    try {
      const { data: jadwal, error } = await supabase.from('jadwal_dokter').select('*');
      if (error) throw error;
      
      // Group by nama_dokter and poli
      const grouped = jadwal.reduce((acc: any, curr: any) => {
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
              kuota_harian: curr.kuota_harian,
              status_dokter: curr.status_dokter
            }]
          };
        } else {
          if (curr.status_dokter === 'cuti') {
            acc[key].status_dokter = 'cuti';
            acc[key].tanggal_mulai_cuti = curr.tanggal_mulai_cuti;
            acc[key].tanggal_selesai_cuti = curr.tanggal_selesai_cuti;
          }
          acc[key].schedules.push({
            id: curr.id,
            hari_praktek: curr.hari_praktek,
            jam_mulai: curr.jam_mulai,
            jam_selesai: curr.jam_selesai,
            kuota_harian: curr.kuota_harian,
            status_dokter: curr.status_dokter
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

      // Check if schedule already exists for this doctor and poli
      const { data: existingSchedules, error: checkError } = await supabase
        .from('jadwal_dokter')
        .select('id')
        .eq('nama_dokter', data.nama_dokter)
        .eq('poli', data.poli)
        .limit(1);

      if (checkError) throw checkError;

      if (existingSchedules && existingSchedules.length > 0) {
        return res.status(400).json({ error: 'Jadwal untuk dokter ini di poliklinik ini sudah ada. Silakan gunakan fitur Edit.' });
      }

      const schedules = data.schedules && data.schedules.length > 0 ? data.schedules : [{
        hari_praktek: data.hari_praktek || 'Senin',
        jam_mulai: data.jam_mulai || '08:00',
        jam_selesai: data.jam_selesai || '12:00',
        kuota_harian: data.kuota_harian || 30
      }];

      const rowsToInsert = schedules.map((s: any) => ({
        nama_dokter: data.nama_dokter,
        poli: data.poli,
        status_dokter: data.status_dokter || 'aktif',
        tanggal_mulai_cuti: data.tanggal_mulai_cuti || null,
        tanggal_selesai_cuti: data.tanggal_selesai_cuti || null,
        hari_praktek: s.hari_praktek,
        jam_mulai: s.jam_mulai,
        jam_selesai: s.jam_selesai,
        kuota_harian: s.kuota_harian
      }));

      const { error } = await supabase.from('jadwal_dokter').insert(rowsToInsert);
      
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
      
      // Get existing row to know which doctor/poli to delete
      const { data: existingRow, error: fetchError } = await supabase
        .from('jadwal_dokter')
        .select('nama_dokter, poli')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // If changing doctor or poli, check if the new doctor/poli already has a schedule
      if (existingRow.nama_dokter !== data.nama_dokter || existingRow.poli !== data.poli) {
        const { data: existingSchedules, error: checkError } = await supabase
          .from('jadwal_dokter')
          .select('id')
          .eq('nama_dokter', data.nama_dokter)
          .eq('poli', data.poli)
          .limit(1);

        if (checkError) throw checkError;

        if (existingSchedules && existingSchedules.length > 0) {
          return res.status(400).json({ error: 'Jadwal untuk dokter ini di poliklinik ini sudah ada. Silakan gunakan fitur Edit pada jadwal tersebut.' });
        }
      }

      // Delete all rows for this doctor and poli
      const { error: deleteError } = await supabase
        .from('jadwal_dokter')
        .delete()
        .match({ nama_dokter: existingRow.nama_dokter, poli: existingRow.poli });
        
      if (deleteError) throw deleteError;
      
      const schedules = data.schedules && data.schedules.length > 0 ? data.schedules : [{
        hari_praktek: data.hari_praktek || 'Senin',
        jam_mulai: data.jam_mulai || '08:00',
        jam_selesai: data.jam_selesai || '12:00',
        kuota_harian: data.kuota_harian || 30
      }];

      const rowsToInsert = schedules.map((s: any) => ({
        nama_dokter: data.nama_dokter,
        poli: data.poli,
        status_dokter: data.status_dokter || 'aktif',
        tanggal_mulai_cuti: data.tanggal_mulai_cuti || null,
        tanggal_selesai_cuti: data.tanggal_selesai_cuti || null,
        hari_praktek: s.hari_praktek,
        jam_mulai: s.jam_mulai,
        jam_selesai: s.jam_selesai,
        kuota_harian: s.kuota_harian
      }));

      const { error: insertError } = await supabase.from('jadwal_dokter').insert(rowsToInsert);
      
      if (insertError) throw insertError;
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/jadwal_dokter/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get existing row to know which doctor/poli to delete
      const { data: existingRow, error: fetchError } = await supabase
        .from('jadwal_dokter')
        .select('nama_dokter, poli')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete all rows for this doctor and poli
      const { error: deleteError } = await supabase
        .from('jadwal_dokter')
        .delete()
        .match({ nama_dokter: existingRow.nama_dokter, poli: existingRow.poli });
        
      if (deleteError) throw deleteError;
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/laporan/bulanan', async (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Total Kunjungan Bulanan
      const { count: total, error: countError } = await supabase
        .from('booking_kunjungan')
        .select('*', { count: 'exact', head: true })
        .like('tanggal_kunjungan', `${currentMonth}%`);

      if (countError) throw countError;

      // Statistik Kunjungan Bulanan per Poli
      // Supabase doesn't support GROUP BY directly in the same way as SQL in the client SDK
      // We can use a RPC or fetch all and group in memory if the data is small, 
      // or use a more advanced query if available.
      // For now, let's fetch and group in memory for simplicity, or use a raw SQL if we had that.
      // Actually, we can use a clever select with count.
      
      const { data: visits, error: visitsError } = await supabase
        .from('booking_kunjungan')
        .select('poli')
        .like('tanggal_kunjungan', `${currentMonth}%`);

      if (visitsError) throw visitsError;

      const stats: Record<string, number> = {};
      visits.forEach(v => {
        stats[v.poli] = (stats[v.poli] || 0) + 1;
      });

      const statistikPoli = Object.entries(stats)
        .map(([name, kunjungan]) => ({ name, kunjungan }))
        .sort((a, b) => b.kunjungan - a.kunjungan);

      // Poli Terpadat (Top 3)
      const topPoli = statistikPoli.slice(0, 3);

      res.json({
        totalKunjungan: total || 0,
        statistikPoli,
        topPoli
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- ARTIKEL PORTAL API ---
  app.get('/api/articles', async (req, res) => {
    try {
      const { data: articles, error } = await supabase
        .from('artikel_portal_rs')
        .select('*')
        .order('tanggal_dibuat', { ascending: false });
      if (error) throw error;
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/articles/featured', async (req, res) => {
    try {
      const { data: articles, error } = await supabase
        .from('artikel_portal_rs')
        .select('*')
        .eq('status_publish', 'Publish')
        .eq('featured_slider', 'Yes')
        .order('tanggal_publish', { ascending: false })
        .limit(5);
      if (error) throw error;
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/articles', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const data = req.body;
      let imageUrl = data.gambar_slider;

      if (imageUrl && imageUrl.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(imageUrl, 'artikel_slider', 'slider');
      }

      const { error } = await supabase.from('artikel_portal_rs').insert([{
        judul_artikel: data.judul_artikel,
        kategori_artikel: data.kategori_artikel,
        ringkasan_artikel: data.ringkasan_artikel,
        isi_artikel: data.isi_artikel,
        gambar_slider: imageUrl,
        tanggal_publish: data.tanggal_publish,
        status_publish: data.status_publish,
        featured_slider: data.featured_slider,
        penulis: data.penulis,
        tanggal_dibuat: new Date().toISOString()
      }]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/articles/:id', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      let imageUrl = data.gambar_slider;

      if (imageUrl && imageUrl.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(imageUrl, 'artikel_slider', 'slider');
        
        // Delete old image
        const { data: oldArt } = await supabase
          .from('artikel_portal_rs')
          .select('gambar_slider')
          .eq('id_artikel', id)
          .single();
        
        if (oldArt?.gambar_slider) {
          await deleteFromSupabaseStorage(oldArt.gambar_slider);
        }
      }

      const { error } = await supabase.from('artikel_portal_rs').update({
        judul_artikel: data.judul_artikel,
        kategori_artikel: data.kategori_artikel,
        ringkasan_artikel: data.ringkasan_artikel,
        isi_artikel: data.isi_artikel,
        gambar_slider: imageUrl,
        tanggal_publish: data.tanggal_publish,
        status_publish: data.status_publish,
        featured_slider: data.featured_slider
      }).eq('id_artikel', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get article image URL to delete it from storage
      const { data: article } = await supabase
        .from('artikel_portal_rs')
        .select('gambar_slider')
        .eq('id_artikel', id)
        .single();
      
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
      // We need to fetch current views first or use a RPC for increment
      const { data: article, error: fetchError } = await supabase
        .from('artikel_portal_rs')
        .select('views')
        .eq('id_artikel', id)
        .single();
      
      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('artikel_portal_rs')
        .update({ views: (article.views || 0) + 1 })
        .eq('id_artikel', id);
      
      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/articles/stats', async (req, res) => {
    try {
      const { data: topArticles, error: topError } = await supabase
        .from('artikel_portal_rs')
        .select('id_artikel, judul_artikel, views, kategori_artikel, tanggal_publish')
        .order('views', { ascending: false })
        .limit(5);
      
      if (topError) throw topError;

      const { data: allArticles, error: allError } = await supabase
        .from('artikel_portal_rs')
        .select('views');
      
      if (allError) throw allError;

      const totalViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0);
      const totalArticles = allArticles.length;
      
      res.json({
        topArticles,
        totalViews,
        totalArticles
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/services/:id/images', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: images, error } = await supabase
        .from('layanan_images')
        .select('*')
        .eq('service_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/services/:id/images', express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { id } = req.params;
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'Image is required' });
      }

      // Check image limit (max 5)
      const { count, error: countError } = await supabase
        .from('layanan_images')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', id);
      
      if (countError) throw countError;
      if (count && count >= 5) {
        return res.status(400).json({ error: 'Maksimal 5 gambar per layanan' });
      }

      const imageUrl = await uploadToSupabaseStorage(image, 'fasilitas', `fasilitas-${id}`);
      
      const { data: result, error: insertError } = await supabase
        .from('layanan_images')
        .insert([{ service_id: id, image_url: imageUrl }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      res.json({ 
        success: true, 
        id: result.id,
        imageUrl 
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/services/:id/images/:imageId', express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { id, imageId } = req.params;
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'Image is required' });
      }

      const imageUrl = await uploadToSupabaseStorage(image, 'fasilitas', `fasilitas-${id}`);
      
      // Get old image info to delete file
      const { data: oldImageInfo, error: fetchError } = await supabase
        .from('layanan_images')
        .select('image_url')
        .eq('id', imageId)
        .eq('service_id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (oldImageInfo) {
        // Update database
        const { error: updateError } = await supabase
          .from('layanan_images')
          .update({ image_url: imageUrl })
          .eq('id', imageId)
          .eq('service_id', id);
        
        if (updateError) throw updateError;
        
        // Delete old file
        if (oldImageInfo.image_url) {
          await deleteFromSupabaseStorage(oldImageInfo.image_url);
        }
        res.json({ success: true, imageUrl });
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (error: any) {
      console.error('Update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/services/:id/images/:imageId', async (req, res) => {
    try {
      const { id, imageId } = req.params;
      
      // Check image limit (min 3)
      const { count, error: countError } = await supabase
        .from('layanan_images')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', id);
      
      if (countError) throw countError;
      if (count && count <= 3) {
        return res.status(400).json({ error: 'Minimal 3 gambar per layanan' });
      }

      // Get image info to delete file
      const { data: imageInfo, error: fetchError } = await supabase
        .from('layanan_images')
        .select('image_url')
        .eq('id', imageId)
        .eq('service_id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (imageInfo) {
        // Delete from database
        const { error: deleteError } = await supabase
          .from('layanan_images')
          .delete()
          .eq('id', imageId)
          .eq('service_id', id);
        
        if (deleteError) throw deleteError;
        
        // Delete file
        if (imageInfo.image_url) {
          await deleteFromSupabaseStorage(imageInfo.image_url);
        }
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/logos', async (req, res) => {
    console.log('GET /api/logos hit with query:', req.query);
    try {
      const { status } = req.query;
      let query = supabase.from('logo_footer').select('*').order('id_logo', { ascending: true });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data: logos, error } = await query;
      if (error) throw error;
      res.json(logos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/logos', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { nama_instansi, gambar_logo, link_instansi, status } = req.body;
      
      if (!nama_instansi || !gambar_logo) {
        return res.status(400).json({ error: 'Nama instansi dan gambar logo wajib diisi' });
      }

      let imageUrl = gambar_logo;
      
      // If it's a base64 image, save it to Supabase
      if (gambar_logo.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(gambar_logo, 'logos', 'logo');
      }
      
      const { data: result, error: insertError } = await supabase
        .from('logo_footer')
        .insert([{
          nama_instansi,
          gambar_logo: imageUrl,
          link_instansi: link_instansi || null,
          status: status || 'aktif'
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      res.json({ success: true, id: result.id_logo });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/logos/:id', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_instansi, gambar_logo, link_instansi, status } = req.body;
      
      if (!nama_instansi) {
        return res.status(400).json({ error: 'Nama instansi wajib diisi' });
      }

      // Check if trying to set an active logo to inactive
      if (status === 'tidak_aktif') {
        const { data: currentLogo, error: fetchError } = await supabase
          .from('logo_footer')
          .select('status')
          .eq('id_logo', id)
          .single();
        
        if (fetchError) throw fetchError;

        if (currentLogo && currentLogo.status === 'aktif') {
          const { count, error: countError } = await supabase
            .from('logo_footer')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'aktif');
          
          if (countError) throw countError;
          if (count && count <= 3) {
            return res.status(400).json({ error: 'Minimal harus ada 3 logo aktif' });
          }
        }
      }

      let imageUrl = gambar_logo;
      
      // If it's a base64 image, save it to Supabase
      if (gambar_logo && gambar_logo.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(gambar_logo, 'logos', 'logo');

        // Delete old file if it exists
        const { data: oldLogo, error: oldLogoError } = await supabase
          .from('logo_footer')
          .select('gambar_logo')
          .eq('id_logo', id)
          .single();
        
        if (!oldLogoError && oldLogo && oldLogo.gambar_logo) {
          await deleteFromSupabaseStorage(oldLogo.gambar_logo);
        }
      }

      const { error: updateError } = await supabase
        .from('logo_footer')
        .update({
          nama_instansi,
          gambar_logo: imageUrl,
          link_instansi: link_instansi || null,
          status: status || 'aktif'
        })
        .eq('id_logo', id);
      
      if (updateError) throw updateError;
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/logos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data: logoInfo, error: fetchError } = await supabase
        .from('logo_footer')
        .select('gambar_logo, status')
        .eq('id_logo', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (logoInfo) {
        if (logoInfo.status === 'aktif') {
          const { count, error: countError } = await supabase
            .from('logo_footer')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'aktif');
          
          if (countError) throw countError;
          if (count && count <= 3) {
            return res.status(400).json({ error: 'Minimal harus ada 3 logo aktif' });
          }
        }

        const { error: deleteError } = await supabase
          .from('logo_footer')
          .delete()
          .eq('id_logo', id);
        
        if (deleteError) throw deleteError;
        
        if (logoInfo.gambar_logo) {
          await deleteFromSupabaseStorage(logoInfo.gambar_logo);
        }
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Logo not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/upload-article-image', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image is required' });
      }

      const fileUrl = await uploadToSupabaseStorage(image, 'artikel_slider', 'slider');
      
      res.json({ success: true, url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/layanan-images', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { service_id, image } = req.body;
      if (!service_id || !image) {
        return res.status(400).json({ error: 'service_id and image are required' });
      }

      const fileUrl = await uploadToSupabaseStorage(image, 'layanan', `layanan_${service_id}`);
      
      const { error } = await supabase
        .from('layanan_images')
        .insert([{ service_id, image_url: fileUrl }]);

      if (error) throw error;
      
      res.json({ success: true, url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/layanan-images/:id', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { id } = req.params;
      const { image, service_id } = req.body;
      
      let imageUrl = req.body.image_url;

      if (image && image.startsWith('data:')) {
        imageUrl = await uploadToSupabaseStorage(image, 'layanan', `layanan_${service_id}`);

        // Delete old file
        const { data: oldImg } = await supabase
          .from('layanan_images')
          .select('image_url')
          .eq('id', id)
          .single();
        
        if (oldImg?.image_url) {
          await deleteFromSupabaseStorage(oldImg.image_url);
        }
      }

      const { error } = await supabase
        .from('layanan_images')
        .update({ image_url: imageUrl })
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({ success: true, url: imageUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/layanan-images/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data: oldImg } = await supabase
        .from('layanan_images')
        .select('image_url')
        .eq('id', id)
        .single();
      
      if (oldImg?.image_url) {
        await deleteFromSupabaseStorage(oldImg.image_url);
      }

      const { error } = await supabase
        .from('layanan_images')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({ success: true });
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

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production/Vercel
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      // Handle SPA routing
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }
}

async function setupSiteAssetsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.site_assets (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      asset_key TEXT UNIQUE NOT NULL,
      asset_url TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Enable RLS
    ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'site_assets' AND policyname = 'Allow public read access to site_assets'
      ) THEN
        CREATE POLICY "Allow public read access to site_assets" ON public.site_assets FOR SELECT USING (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'site_assets' AND policyname = 'Allow authenticated users to insert site_assets'
      ) THEN
        CREATE POLICY "Allow authenticated users to insert site_assets" ON public.site_assets FOR INSERT WITH CHECK (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'site_assets' AND policyname = 'Allow authenticated users to update site_assets'
      ) THEN
        CREATE POLICY "Allow authenticated users to update site_assets" ON public.site_assets FOR UPDATE USING (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'site_assets' AND policyname = 'Allow authenticated users to delete site_assets'
      ) THEN
        CREATE POLICY "Allow authenticated users to delete site_assets" ON public.site_assets FOR DELETE USING (true);
      END IF;
    END $$;
  `;

  try {
    // Check if table exists first
    const { error: checkError } = await supabase.from('site_assets').select('id').limit(1);
    
    if (checkError) {
      // Table not found or schema cache issue
      if (checkError.message.includes('Could not find the table') || checkError.code === 'PGRST116') {
        console.log('Table "site_assets" not found or not in cache, attempting to create...');
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql });
        
        if (rpcError) {
          console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Could not create "site_assets" table automatically.');
          console.error('\x1b[33m%s\x1b[0m', 'Please run the following SQL in your Supabase SQL Editor:');
          console.log(sql);
        } else {
          console.log('Table "site_assets" created successfully.');
        }
      } else {
        console.error('Error checking "site_assets" table:', checkError.message);
      }
    } else {
      console.log('Table "site_assets" verified.');
    }
  } catch (err) {
    console.error('Unexpected error during site_assets setup:', err);
  }
}

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  setupVite().then(() => {
    app.listen(PORT, '0.0.0.0', async () => {
      console.log(`Server running on http://localhost:${PORT}`);
      
      // Initialize site_assets table
      await setupSiteAssetsTable();
      
      // Check if Supabase bucket exists
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
          console.error('Error checking Supabase buckets:', error.message);
        } else {
          const bucketExists = buckets.some(b => b.name === 'uploads');
          if (!bucketExists) {
            console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Supabase bucket "uploads" not found!');
            console.error('\x1b[33m%s\x1b[0m', 'Please create a PUBLIC bucket named "uploads" in your Supabase project to enable file uploads.');
          } else {
            console.log('Supabase bucket "uploads" verified.');
            console.log('\x1b[36m%s\x1b[0m', 'REMINDER: Ensure you have set the correct RLS Policies for the "uploads" bucket to allow uploads.');
          }
        }
      } catch (err) {
        console.error('Failed to connect to Supabase storage:', err);
      }
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
