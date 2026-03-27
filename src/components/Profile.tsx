import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, CreditCard, Save, X, CheckCircle2, Camera, Calendar } from 'lucide-react';
import { FloatingInput } from './FloatingInput';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  user: any;
  onUpdate: (user: any) => void;
  onBack: () => void;
}

export default function Profile({ user, onUpdate, onBack }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    id: user.id,
    nama_pasien: user.nama_pasien || '',
    nik: user.nik || '',
    tanggal_lahir: user.tanggal_lahir || '',
    alamat: user.alamat || '',
    no_hp: user.no_hp || '',
    email: user.email || '',
    no_bpjs: user.nomor_bpjs || '',
    foto_profil: user.foto_profil || '',
    jenis_kelamin: user.jenis_kelamin || ''
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Format file harus JPG, JPEG, atau PNG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2 MB');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const response = await fetch('/api/auth/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64String,
            userId: user.id
          })
        });

        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({ ...prev, foto_profil: data.url }));
          onUpdate({ ...user, foto_profil: data.url });
          setSuccess('✅ Foto profil berhasil diperbarui');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          throw new Error(data.error || 'Gagal mengunggah foto');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload foto');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui profil');
      
      onUpdate(data.user);
      setSuccess('Profil berhasil diperbarui');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Profil Pasien</h1>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
          >
            Kembali
          </button>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center text-emerald-700"
            >
              <CheckCircle2 className="mr-3" size={20} />
              <span className="font-medium">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-emerald-600 text-white flex flex-col md:flex-row items-center md:space-x-8 space-y-4 md:space-y-0">
            <div className="relative group">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30 overflow-hidden">
                {formData.foto_profil ? (
                  <img src={formData.foto_profil} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <div className="text-center">
                  <Camera size={24} className="mx-auto text-white mb-1" />
                  <span className="text-xs font-medium text-white">{formData.foto_profil ? 'Ganti Foto' : 'Upload Foto'}</span>
                </div>
                <input type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handlePhotoUpload} disabled={loading} />
              </label>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold">{formData.nama_pasien || user.nama_pasien}</h2>
              <p className="text-emerald-100 font-mono mt-2 text-lg">NIK: {user.nik}</p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile fields */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Data Identitas</h3>
                  
                  <FloatingInput
                    label="Nama Lengkap"
                    type="text"
                    required
                    disabled={!isEditing}
                    icon={<User size={18} />}
                    value={formData.nama_pasien}
                    onChange={e => setFormData({...formData, nama_pasien: e.target.value})}
                  />
                  
                  <FloatingInput
                    label="Nomor Induk Kependudukan (NIK)"
                    type="text"
                    required
                    disabled={!isEditing}
                    icon={<CreditCard size={18} />}
                    value={formData.nik}
                    onChange={e => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})}
                  />

                  <FloatingInput
                    label="Tanggal Lahir"
                    type="date"
                    required
                    disabled={!isEditing}
                    icon={<Calendar size={18} />}
                    value={formData.tanggal_lahir}
                    onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})}
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Jenis Kelamin</label>
                    <div className="flex space-x-4">
                      <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        formData.jenis_kelamin === 'Laki-laki' 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <input
                          type="radio"
                          className="hidden"
                          name="jenis_kelamin"
                          value="Laki-laki"
                          disabled={!isEditing}
                          checked={formData.jenis_kelamin === 'Laki-laki'}
                          onChange={e => setFormData({...formData, jenis_kelamin: e.target.value})}
                        />
                        <span className="text-sm font-bold">Laki-laki</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        formData.jenis_kelamin === 'Perempuan' 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <input
                          type="radio"
                          className="hidden"
                          name="jenis_kelamin"
                          value="Perempuan"
                          disabled={!isEditing}
                          checked={formData.jenis_kelamin === 'Perempuan'}
                          onChange={e => setFormData({...formData, jenis_kelamin: e.target.value})}
                        />
                        <span className="text-sm font-bold">Perempuan</span>
                      </label>
                    </div>
                  </div>

                  <FloatingInput
                    label="Nomor BPJS (Opsional)"
                    type="text"
                    disabled={!isEditing}
                    icon={<CreditCard size={18} />}
                    value={formData.no_bpjs}
                    onChange={e => setFormData({...formData, no_bpjs: e.target.value.replace(/\D/g, '')})}
                  />
                </div>

                {/* Account fields */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-lg font-bold text-slate-900">Kontak & Alamat</h3>
                    {!isEditing && (
                      <button 
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Edit Profil
                      </button>
                    )}
                  </div>

                  <div className="pt-2">
                    <FloatingInput
                      label="Email (Opsional)"
                      type="email"
                      disabled={!isEditing}
                      icon={<Mail size={18} />}
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      validationFn={(val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)}
                      errorMessage="Format email salah"
                    />
                  </div>

                  <FloatingInput
                    label="No Telepon"
                    type="tel"
                    required
                    disabled={!isEditing}
                    icon={<Phone size={18} />}
                    value={formData.no_hp}
                    onChange={e => setFormData({...formData, no_hp: e.target.value.replace(/\D/g, '')})}
                    validationFn={(val) => val.length >= 10}
                    errorMessage="No Telepon tidak valid"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                      <textarea
                        required
                        rows={3}
                        disabled={!isEditing}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                        value={formData.alamat}
                        onChange={e => setFormData({...formData, alamat: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        id: user.id,
                        nama_pasien: user.nama_pasien || '',
                        nik: user.nik || '',
                        tanggal_lahir: user.tanggal_lahir || '',
                        alamat: user.alamat || '',
                        no_hp: user.no_hp || '',
                        email: user.email || '',
                        no_bpjs: user.nomor_bpjs || '',
                        foto_profil: user.foto_profil || '',
                        jenis_kelamin: user.jenis_kelamin || ''
                      });
                      setError('');
                    }}
                    className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md flex items-center disabled:opacity-70"
                  >
                    {loading ? 'Menyimpan...' : (
                      <>
                        <Save size={18} className="mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
