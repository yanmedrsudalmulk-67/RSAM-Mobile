import React, { useState, useEffect } from 'react';
import { Save, MessageCircle, Facebook, Instagram, Video, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SosmedData {
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  gmaps: string;
}

export function SosialMediaManagement() {
  const [sosmedData, setSosmedData] = useState<SosmedData>({
    whatsapp: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    gmaps: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSosmedData();
  }, []);

  const fetchSosmedData = async () => {
    try {
      const { data, error } = await supabase.from('logo_footer').select('*');
      if (error) throw error;

      if (data) {
        const newData: SosmedData = {
          whatsapp: '',
          facebook: '',
          instagram: '',
          tiktok: '',
          gmaps: ''
        };
        
        data.forEach(item => {
          if (item.nama_instansi === 'sosmed_whatsapp') newData.whatsapp = item.link_instansi || '';
          else if (item.nama_instansi === 'sosmed_facebook') newData.facebook = item.link_instansi || '';
          else if (item.nama_instansi === 'sosmed_instagram') newData.instagram = item.link_instansi || '';
          else if (item.nama_instansi === 'sosmed_tiktok') newData.tiktok = item.link_instansi || '';
          else if (item.nama_instansi === 'sosmed_gmaps') newData.gmaps = item.link_instansi || '';
        });
        
        setSosmedData(newData);
      }
    } catch (error) {
      console.error('Failed to fetch sosmed data:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const platforms = [
        { key: 'whatsapp', name: 'sosmed_whatsapp' },
        { key: 'facebook', name: 'sosmed_facebook' },
        { key: 'instagram', name: 'sosmed_instagram' },
        { key: 'tiktok', name: 'sosmed_tiktok' },
        { key: 'gmaps', name: 'sosmed_gmaps' }
      ];

      for (const platform of platforms) {
        const link = sosmedData[platform.key as keyof SosmedData];
        
        // Simple URL validation if not empty
        if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
          throw new Error(`Format URL untuk ${platform.key} tidak valid. Harus diawali dengan http:// atau https://`);
        }

        const { data: existing } = await supabase
          .from('logo_footer')
          .select('id_logo')
          .eq('nama_instansi', platform.name)
          .single();

        if (existing) {
          await supabase
            .from('logo_footer')
            .update({ link_instansi: link })
            .eq('id_logo', existing.id_logo);
        } else {
          await supabase
            .from('logo_footer')
            .insert({ 
              nama_instansi: platform.name, 
              gambar_logo: '', 
              link_instansi: link,
              status: 'aktif'
            });
        }
      }

      setMessage({ type: 'success', text: 'Pengaturan sosial media berhasil disimpan.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan Sosial Media</h2>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <p className="text-sm text-slate-500 mb-6">
          Masukkan link lengkap (termasuk https://) untuk masing-masing platform. Kosongkan field jika tidak ingin menampilkan icon tersebut di footer.
        </p>

        <div className="space-y-6">
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <MessageCircle size={18} className="mr-2 text-emerald-500" />
              Link WhatsApp
            </label>
            <input
              type="text"
              value={sosmedData.whatsapp}
              onChange={(e) => setSosmedData({ ...sosmedData, whatsapp: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Contoh: https://wa.me/6281234567890"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <Facebook size={18} className="mr-2 text-blue-600" />
              Link Facebook
            </label>
            <input
              type="text"
              value={sosmedData.facebook}
              onChange={(e) => setSosmedData({ ...sosmedData, facebook: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Contoh: https://facebook.com/rsudalmulk"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <Instagram size={18} className="mr-2 text-pink-600" />
              Link Instagram
            </label>
            <input
              type="text"
              value={sosmedData.instagram}
              onChange={(e) => setSosmedData({ ...sosmedData, instagram: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Contoh: https://instagram.com/rsudalmulk"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <Video size={18} className="mr-2 text-slate-800" />
              Link TikTok
            </label>
            <input
              type="text"
              value={sosmedData.tiktok}
              onChange={(e) => setSosmedData({ ...sosmedData, tiktok: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Contoh: https://tiktok.com/@rsudalmulk"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <MapPin size={18} className="mr-2 text-red-500" />
              Link Google Maps
            </label>
            <input
              type="text"
              value={sosmedData.gmaps}
              onChange={(e) => setSosmedData({ ...sosmedData, gmaps: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Contoh: https://maps.app.goo.gl/..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
            >
              <Save size={18} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
