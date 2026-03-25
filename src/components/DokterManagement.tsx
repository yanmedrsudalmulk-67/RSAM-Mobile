import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, CheckCircle, XCircle, Upload, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { getDokterDB } from '../db';

interface Dokter {
  id_dokter: string;
  nama_dokter: string;
  spesialis: string;
  poli: string;
  jadwal_praktek: string;
  foto_dokter?: string;
  is_rekomendasi?: boolean;
  urutan_rekomendasi?: number;
}

export function DokterManagement() {
  const [dokters, setDokters] = useState<Dokter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDokter, setEditingDokter] = useState<Dokter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nama_dokter: '',
    spesialis: '',
    poli: '',
    jadwal_praktek: '',
    foto_dokter: '',
    is_rekomendasi: false,
    urutan_rekomendasi: 0
  });

  const fetchDokters = async () => {
    try {
      setIsLoading(true);
      const data = await getDokterDB();
      setDokters(data || []);
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDokters();
  }, []);

  const handleOpenModal = (dokter?: Dokter) => {
    if (dokter) {
      setEditingDokter(dokter);
      setFormData({
        nama_dokter: dokter.nama_dokter,
        spesialis: dokter.spesialis || '',
        poli: dokter.poli || '',
        jadwal_praktek: dokter.jadwal_praktek || '',
        foto_dokter: dokter.foto_dokter || '',
        is_rekomendasi: dokter.is_rekomendasi || false,
        urutan_rekomendasi: dokter.urutan_rekomendasi || 0
      });
    } else {
      setEditingDokter(null);
      setFormData({
        nama_dokter: '',
        spesialis: '',
        poli: '',
        jadwal_praktek: '',
        foto_dokter: '',
        is_rekomendasi: false,
        urutan_rekomendasi: 0
      });
    }
    setUploadFile(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDokter(null);
    setUploadFile(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Format file harus JPG atau PNG');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, foto_dokter: reader.result as string }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_dokter) {
      setError('Nama dokter wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingDokter ? `/api/dokter/${editingDokter.id_dokter}` : '/api/dokter';
      const method = editingDokter ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        await fetchDokters();
        handleCloseModal();
      } else {
        setError(data.error || 'Gagal menyimpan dokter');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokter ini?')) {
      try {
        const res = await fetch(`/api/dokter/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (res.ok) {
          await fetchDokters();
        } else {
          alert(data.error || 'Gagal menghapus dokter');
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
        <h2 className="text-2xl font-bold text-slate-900">Manajemen Dokter</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          <span>Tambah Dokter</span>
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
                  <th className="p-4 font-semibold text-slate-600">Foto</th>
                  <th className="p-4 font-semibold text-slate-600">Nama Dokter</th>
                  <th className="p-4 font-semibold text-slate-600">Spesialis</th>
                  <th className="p-4 font-semibold text-slate-600">Rekomendasi</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dokters.map((dokter) => (
                  <tr key={dokter.id_dokter} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      {dokter.foto_dokter ? (
                        <img src={dokter.foto_dokter} alt={dokter.nama_dokter} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-900">{dokter.nama_dokter}</td>
                    <td className="p-4 text-slate-600">{dokter.spesialis}</td>
                    <td className="p-4">
                      {dokter.is_rekomendasi ? (
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                          <Star size={12} className="fill-current" />
                          <span>Urutan {dokter.urutan_rekomendasi}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Tidak</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(dokter)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(dokter.id_dokter)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {dokters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Belum ada data dokter.
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
                  {editingDokter ? 'Edit Dokter' : 'Tambah Dokter'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Foto Dokter</label>
                  <div className="flex items-center space-x-4">
                    {formData.foto_dokter ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200">
                        <img src={formData.foto_dokter} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png"
                        className="hidden"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors flex items-center space-x-2"
                      >
                        <Upload size={16} />
                        <span>Pilih Foto</span>
                      </button>
                      <p className="text-xs text-slate-500 mt-2">Format: JPG, PNG. Maks: 2MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Dokter</label>
                  <input 
                    type="text" 
                    value={formData.nama_dokter}
                    onChange={e => setFormData({...formData, nama_dokter: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: dr. Budi Santoso, Sp.PD"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Spesialis</label>
                  <input 
                    type="text" 
                    value={formData.spesialis}
                    onChange={e => setFormData({...formData, spesialis: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: Penyakit Dalam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Poli</label>
                  <input 
                    type="text" 
                    value={formData.poli}
                    onChange={e => setFormData({...formData, poli: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: Poli Penyakit Dalam"
                    required
                  />
                </div>

                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_rekomendasi"
                      checked={formData.is_rekomendasi}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_rekomendasi: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="is_rekomendasi" className="text-sm font-medium text-slate-700">
                      Tampilkan di Rekomendasi
                    </label>
                  </div>
                  
                  {formData.is_rekomendasi && (
                    <div className="flex items-center gap-2 ml-auto">
                      <label htmlFor="urutan_rekomendasi" className="text-sm font-medium text-slate-700">
                        Urutan:
                      </label>
                      <input
                        type="number"
                        id="urutan_rekomendasi"
                        value={formData.urutan_rekomendasi}
                        onChange={(e) => setFormData(prev => ({ ...prev, urutan_rekomendasi: parseInt(e.target.value) || 0 }))}
                        className="w-16 px-2 py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan</span>
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
