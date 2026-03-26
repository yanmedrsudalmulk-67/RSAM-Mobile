import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface SiteAsset {
  id?: number;
  asset_key: string;
  asset_url: string;
  description?: string;
}

const ASSET_LABELS: Record<string, string> = {
  logo_main: 'Logo Utama',
  welcome_slide1: 'Welcome Slide 1',
  welcome_slide2: 'Welcome Slide 2',
  welcome_slide3: 'Welcome Slide 3',
  welcome_slide4: 'Welcome Slide 4',
  hero_bg: 'Background Hero Section',
  login_bg: 'Background Login Page',
  about_image1: 'Gambar Tentang Kami 1',
  about_image2: 'Gambar Tentang Kami 2',
  footer_logo: 'Logo Footer',
  fasilitas_waiting_room: 'Waiting Room',
  teknologi_medical_device: 'Medical Device',
  fasilitas_hospital_ward: 'Hospital Ward'
};

export function SiteAssetEditor() {
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/site-assets');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assets');
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file terlalu besar. Maksimal 5MB.' });
      return;
    }

    setUploading(key);
    setMessage(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        
        // 1. Upload to storage
        const uploadRes = await fetch('/api/upload-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, asset_key: key })
        });
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Gagal mengunggah gambar');

        // 2. Update database
        const updateRes = await fetch('/api/site-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            asset_key: key, 
            asset_url: uploadData.url,
            description: ASSET_LABELS[key]
          })
        });
        
        const updateData = await updateRes.json();
        if (!updateRes.ok) throw new Error(updateData.error || 'Gagal memperbarui database');

        setMessage({ type: 'success', text: `Berhasil memperbarui ${ASSET_LABELS[key]}` });
        fetchAssets();
      } catch (error: any) {
        console.error('Upload error:', error);
        setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat mengunggah' });
      } finally {
        setUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (key: string) => {
    setConfirmDelete(null);
    setUploading(key);
    setMessage(null);

    try {
      const res = await fetch(`/api/site-assets/${key}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus gambar');

      setMessage({ type: 'success', text: `Berhasil menghapus ${ASSET_LABELS[key]}` });
      fetchAssets();
    } catch (error: any) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menghapus' });
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manajemen Gambar Situs</h2>
          <p className="text-sm text-slate-500">Kelola gambar-gambar utama yang muncul di seluruh aplikasi.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(ASSET_LABELS).map(([key, label]) => {
          const asset = assets.find(a => a.asset_key === key);
          const isUploading = uploading === key;

          return (
            <div key={key} className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-300 transition-all duration-300">
              <div className="aspect-video bg-slate-200 relative">
                {asset?.asset_url ? (
                  <img 
                    src={asset.asset_url} 
                    alt={label} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/rsud-al-mulk.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-12 h-12 opacity-20" />
                  </div>
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <label className="p-2 bg-white rounded-full text-emerald-600 cursor-pointer hover:scale-110 transition-transform shadow-lg" title="Upload Gambar">
                    <Upload className="w-5 h-5" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleUpload(key, e)}
                      disabled={isUploading}
                    />
                  </label>
                  {asset?.asset_url && (
                    <button 
                      onClick={() => setConfirmDelete(key)}
                      disabled={isUploading}
                      className="p-2 bg-white rounded-full text-red-600 cursor-pointer hover:scale-110 transition-transform shadow-lg"
                      title="Hapus Gambar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {confirmDelete === key && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Hapus {label}?</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDelete(key)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                      >
                        Ya, Hapus
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-slate-800">{label}</h3>
                <p className="text-xs text-slate-500 mt-1 truncate">{asset?.asset_url || 'Belum diatur'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
