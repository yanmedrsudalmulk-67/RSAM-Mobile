import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FooterData {
  id_footer?: number;
  logo_rsud: string | null;
  logo_pemkot: string | null;
  logo_kemenkes: string | null;
  logo_bpjs: string | null;
  teks_alamat: string | null;
  kontak: string | null;
}

export default function SettingFooterView() {
  const [footerData, setFooterData] = useState<FooterData>({
    logo_rsud: null,
    logo_pemkot: null,
    logo_kemenkes: null,
    logo_bpjs: null,
    teks_alamat: '',
    kontak: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const { data, error } = await supabase.from('logo_footer').select('*');
      if (error) throw error;

      if (data) {
        const newData: FooterData = {
          logo_rsud: null,
          logo_pemkot: null,
          logo_kemenkes: null,
          logo_bpjs: null,
          teks_alamat: '',
          kontak: ''
        };
        
        data.forEach(item => {
          if (item.nama_instansi === 'teks_alamat') newData.teks_alamat = item.link_instansi;
          else if (item.nama_instansi === 'kontak') newData.kontak = item.link_instansi;
          else if (item.nama_instansi === 'logo_rsud') newData.logo_rsud = item.gambar_logo;
          else if (item.nama_instansi === 'logo_pemkot') newData.logo_pemkot = item.gambar_logo;
          else if (item.nama_instansi === 'logo_kemenkes') newData.logo_kemenkes = item.gambar_logo;
          else if (item.nama_instansi === 'logo_bpjs') newData.logo_bpjs = item.gambar_logo;
        });
        
        setFooterData(newData);
      }
    } catch (error) {
      console.error('Failed to fetch footer data:', error);
    }
  };

  const handleSaveText = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // Save teks_alamat
      const { data: existingAlamat } = await supabase.from('logo_footer').select('id_logo').eq('nama_instansi', 'teks_alamat').single();
      if (existingAlamat) {
        await supabase.from('logo_footer').update({ link_instansi: footerData.teks_alamat }).eq('id_logo', existingAlamat.id_logo);
      } else {
        await supabase.from('logo_footer').insert({ nama_instansi: 'teks_alamat', gambar_logo: '', link_instansi: footerData.teks_alamat });
      }

      // Save kontak
      const { data: existingKontak } = await supabase.from('logo_footer').select('id_logo').eq('nama_instansi', 'kontak').single();
      if (existingKontak) {
        await supabase.from('logo_footer').update({ link_instansi: footerData.kontak }).eq('id_logo', existingKontak.id_logo);
      } else {
        await supabase.from('logo_footer').insert({ nama_instansi: 'kontak', gambar_logo: '', link_instansi: footerData.kontak });
      }

      setMessage({ type: 'success', text: 'Informasi footer berhasil disimpan.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingType) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Format file harus JPG, JPEG, atau PNG' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const response = await fetch('/api/logos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama_instansi: uploadingType,
            gambar_logo: base64String,
            link_instansi: ''
          })
        });

        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Logo berhasil diupload' });
          fetchFooterData();
        } else {
          throw new Error(data.error || 'Gagal mengunggah logo');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal mengupload logo' });
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async (type: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus logo ini?')) return;
    
    try {
      // Get current logo data
      const { data: logoData } = await supabase
        .from('logo_footer')
        .select('id_logo')
        .eq('nama_instansi', type)
        .single();

      if (logoData?.id_logo) {
        const response = await fetch(`/api/logos/${logoData.id_logo}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Logo berhasil dihapus' });
          fetchFooterData();
        } else {
          throw new Error(data.error || 'Gagal menghapus logo');
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal menghapus logo' });
    }
  };

  const triggerUpload = (type: string) => {
    setUploadingType(type);
    fileInputRef.current?.click();
  };

  if (!footerData) return <div className="p-6 text-center">Loading...</div>;

  const logoTypes = [
    { key: 'logo_rsud', label: 'Logo RSUD' },
    { key: 'logo_pemkot', label: 'Logo Pemerintah Kota' },
    { key: 'logo_kemenkes', label: 'Logo Kementerian Kesehatan' },
    { key: 'logo_bpjs', label: 'Logo BPJS Kesehatan' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Setting Footer</h2>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Informasi Kontak & Alamat</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teks Alamat</label>
            <textarea
              value={footerData.teks_alamat || ''}
              onChange={(e) => setFooterData({ ...footerData, teks_alamat: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Masukkan alamat lengkap RSUD..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kontak (Telepon & Email)</label>
            <textarea
              value={footerData.kontak || ''}
              onChange={(e) => setFooterData({ ...footerData, kontak: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Masukkan informasi kontak..."
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveText}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Informasi'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Logo Footer</h3>
        <p className="text-sm text-slate-500 mb-6">Format yang didukung: JPG, JPEG, PNG. Maksimal ukuran: 2MB.</p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {logoTypes.map((type) => {
            const logoUrl = footerData[type.key as keyof FooterData] as string | null;
            return (
              <div key={type.key} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <h4 className="font-medium text-slate-700 mb-4">{type.label}</h4>
                
                {logoUrl ? (
                  <div className="relative group w-full flex flex-col items-center">
                    <div className="h-32 w-full flex items-center justify-center bg-slate-50 rounded-lg mb-4 p-2">
                      <img src={logoUrl} alt={type.label} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => triggerUpload(type.key)}
                        className="flex items-center space-x-1 text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        <Upload size={16} />
                        <span>Ganti</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLogo(type.key)}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <div className="h-32 w-full flex flex-col items-center justify-center bg-slate-50 rounded-lg mb-4 border-2 border-dashed border-slate-300">
                      <ImageIcon className="text-slate-400 mb-2" size={32} />
                      <span className="text-sm text-slate-500">Belum ada logo</span>
                    </div>
                    <button
                      onClick={() => triggerUpload(type.key)}
                      className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Upload size={16} />
                      <span>Upload Logo</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
