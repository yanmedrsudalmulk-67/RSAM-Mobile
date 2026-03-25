import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, CheckCircle, XCircle, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface Logo {
  id_logo: number;
  nama_instansi: string;
  gambar_logo: string;
  link_instansi: string | null;
  status: 'aktif' | 'tidak_aktif';
  tanggal_upload: string;
}

export function LogoFooterManagement() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<Logo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nama_instansi: '',
    link_instansi: '',
    status: 'aktif' as 'aktif' | 'tidak_aktif',
    gambar_logo: '' // Base64 string
  });

  const fetchLogos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('logo_footer')
        .select('*')
        .not('nama_instansi', 'in', '("teks_alamat","kontak")')
        .not('nama_instansi', 'ilike', 'sosmed_%')
        .order('id_logo', { ascending: true });
      if (error) throw error;
      setLogos(data || []);
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleOpenModal = (logo?: Logo) => {
    if (logo) {
      setEditingLogo(logo);
      setFormData({
        nama_instansi: logo.nama_instansi,
        link_instansi: logo.link_instansi || '',
        status: logo.status,
        gambar_logo: logo.gambar_logo
      });
    } else {
      setEditingLogo(null);
      setFormData({
        nama_instansi: '',
        link_instansi: '',
        status: 'aktif',
        gambar_logo: ''
      });
    }
    setUploadFile(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLogo(null);
    setUploadFile(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB');
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      setError('Format file harus JPG, PNG, atau SVG');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, gambar_logo: reader.result as string }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogo && !formData.gambar_logo) {
      setError('Silakan pilih gambar logo');
      return;
    }

    // Check if trying to set an active logo to inactive, and there are only 3 active logos
    if (editingLogo && editingLogo.status === 'aktif' && formData.status === 'tidak_aktif') {
      const activeLogosCount = logos.filter(l => l.status === 'aktif').length;
      if (activeLogosCount <= 3) {
        setError('Minimal harus ada 3 logo aktif.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingLogo ? `/api/logos/${editingLogo.id_logo}` : '/api/logos';
      const method = editingLogo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        await fetchLogos();
        handleCloseModal();
      } else {
        setError(data.error || 'Gagal menyimpan logo');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const activeLogosCount = logos.filter(l => l.status === 'aktif').length;
    const logoToDelete = logos.find(l => l.id_logo === id);

    if (logoToDelete?.status === 'aktif' && activeLogosCount <= 3) {
      alert('Minimal harus ada 3 logo aktif. Tidak dapat menghapus logo aktif ini.');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus logo ini?')) {
      try {
        const res = await fetch(`/api/logos/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (res.ok) {
          await fetchLogos();
        } else {
          alert(data.error || 'Gagal menghapus logo');
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Terjadi kesalahan jaringan');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Manajemen Logo Footer</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          <span>Tambah Logo</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-semibold text-slate-600">Logo</th>
                  <th className="p-4 font-semibold text-slate-600">Nama Instansi</th>
                  <th className="p-4 font-semibold text-slate-600">Tautan</th>
                  <th className="p-4 font-semibold text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {logos.map((logo) => (
                  <tr key={logo.id_logo} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="w-20 h-12 bg-slate-100 rounded flex items-center justify-center overflow-hidden p-2">
                        {logo.gambar_logo ? (
                          <img src={logo.gambar_logo} alt={logo.nama_instansi} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <ImageIcon className="text-slate-400" size={24} />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-900">{logo.nama_instansi}</td>
                    <td className="p-4 text-slate-500 text-sm">
                      {logo.link_instansi ? (
                        <a href={logo.link_instansi} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline truncate max-w-[200px] block">
                          {logo.link_instansi}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        logo.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {logo.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(logo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(logo.id_logo)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {logos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Belum ada logo yang ditambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingLogo ? 'Edit Logo' : 'Tambah Logo Baru'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Instansi *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nama_instansi}
                    onChange={(e) => setFormData({...formData, nama_instansi: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Contoh: Kementerian Kesehatan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tautan (Opsional)</label>
                  <input 
                    type="url" 
                    value={formData.link_instansi}
                    onChange={(e) => setFormData({...formData, link_instansi: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'aktif' | 'tidak_aktif'})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="tidak_aktif">Tidak Aktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Logo {editingLogo ? '(Opsional)' : '*'}</label>
                  
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-emerald-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="space-y-1 text-center">
                      {formData.gambar_logo ? (
                        <div className="mb-4 flex justify-center">
                          <img src={formData.gambar_logo} alt="Preview" className="h-20 object-contain" />
                        </div>
                      ) : editingLogo && editingLogo.gambar_logo ? (
                        <div className="mb-4 flex justify-center">
                          <img src={editingLogo.gambar_logo} alt="Current" className="h-20 object-contain opacity-50" />
                        </div>
                      ) : (
                        <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                      )}
                      <div className="flex text-sm text-slate-600 justify-center">
                        <span className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                          <span>Upload file</span>
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            className="sr-only" 
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleFileChange}
                          />
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, SVG up to 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
