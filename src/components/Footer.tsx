import React, { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Facebook, Instagram, Video, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FooterData {
  id_footer?: number;
  logo_rsud: string | null;
  logo_pemkot: string | null;
  logo_kemenkes: string | null;
  logo_bpjs: string | null;
  teks_alamat: string | null;
  kontak: string | null;
  sosmed_whatsapp: string | null;
  sosmed_facebook: string | null;
  sosmed_instagram: string | null;
  sosmed_tiktok: string | null;
  sosmed_gmaps: string | null;
}

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData | null>(null);

  useEffect(() => {
    const fetchFooter = async () => {
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
            kontak: '',
            sosmed_whatsapp: null,
            sosmed_facebook: null,
            sosmed_instagram: null,
            sosmed_tiktok: null,
            sosmed_gmaps: null
          };
          
          data.forEach(item => {
            if (item.nama_instansi === 'teks_alamat') newData.teks_alamat = item.link_instansi;
            else if (item.nama_instansi === 'kontak') newData.kontak = item.link_instansi;
            else if (item.nama_instansi === 'logo_rsud') newData.logo_rsud = item.gambar_logo;
            else if (item.nama_instansi === 'logo_pemkot') newData.logo_pemkot = item.gambar_logo;
            else if (item.nama_instansi === 'logo_kemenkes') newData.logo_kemenkes = item.gambar_logo;
            else if (item.nama_instansi === 'logo_bpjs') newData.logo_bpjs = item.gambar_logo;
            else if (item.nama_instansi === 'sosmed_whatsapp') newData.sosmed_whatsapp = item.link_instansi;
            else if (item.nama_instansi === 'sosmed_facebook') newData.sosmed_facebook = item.link_instansi;
            else if (item.nama_instansi === 'sosmed_instagram') newData.sosmed_instagram = item.link_instansi;
            else if (item.nama_instansi === 'sosmed_tiktok') newData.sosmed_tiktok = item.link_instansi;
            else if (item.nama_instansi === 'sosmed_gmaps') newData.sosmed_gmaps = item.link_instansi;
          });
          
          setFooterData(newData);
        }
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
      }
    };

    fetchFooter();
  }, []);

  if (!footerData) return null;

  const logos = [
    { src: footerData.logo_rsud, alt: 'Logo RSUD' },
    { src: footerData.logo_pemkot, alt: 'Logo Pemkot' },
    { src: footerData.logo_kemenkes, alt: 'Logo Kemenkes' },
    { src: footerData.logo_bpjs, alt: 'Logo BPJS' }
  ].filter(logo => logo.src);

  return (
    <>
      {/* Footer Logos Section */}
      {logos.length > 0 && (
        <section className="bg-slate-50 py-10 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              {logos.map((logo, index) => (
                <div 
                  key={index} 
                  className="group transition-transform hover:scale-105 flex items-center justify-center w-full h-20"
                >
                  <img 
                    src={logo.src!} 
                    alt={logo.alt} 
                    className="max-h-[60px] md:max-h-[80px] w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Footer */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-white-600 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden">
                  {footerData.logo_rsud ? (
                    <img src={footerData.logo_rsud} alt="Logo RSUD" className="w-full h-full object-cover" />
                  ) : (
                    <img src="/logo-1.jpg" alt="Logo" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">UOBK RSUD AL-MULK</h2>
                  <p className="text-[8px] uppercase tracking-widest text-emerald-400">Kota Sukabumi</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                Memberikan pelayanan kesehatan yang unggul dan profesional untuk mewujudkan masyarakat Sukabumi yang sehat dan sejahtera.
              </p>

              {/* Social Media Icons */}
              {(footerData.sosmed_whatsapp || footerData.sosmed_facebook || footerData.sosmed_instagram || footerData.sosmed_tiktok || footerData.sosmed_gmaps) && (
                <div>
                  <div className="mb-3">
                    <p className="text-sm text-slate-400 font-medium">Silahkan Kunjungi Sosial Media Kami</p>
                  </div>
                  <div className="flex flex-wrap gap-3 md:gap-4">
                    {footerData.sosmed_whatsapp && (
                    <a 
                      href={footerData.sosmed_whatsapp} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-emerald-500 hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300"
                      title="WhatsApp"
                    >
                      <MessageCircle size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                  {footerData.sosmed_facebook && (
                    <a 
                      href={footerData.sosmed_facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-blue-600 hover:scale-110 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-300"
                      title="Facebook"
                    >
                      <Facebook size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                  {footerData.sosmed_instagram && (
                    <a 
                      href={footerData.sosmed_instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-pink-600 hover:scale-110 hover:shadow-[0_0_15px_rgba(219,39,119,0.5)] transition-all duration-300"
                      title="Instagram"
                    >
                      <Instagram size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                  {footerData.sosmed_tiktok && (
                    <a 
                      href={footerData.sosmed_tiktok} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-800 hover:scale-110 hover:shadow-[0_0_15px_rgba(30,41,59,0.5)] transition-all duration-300"
                      title="TikTok"
                    >
                      <Video size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                  {footerData.sosmed_gmaps && (
                    <a 
                      href={footerData.sosmed_gmaps} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 hover:scale-110 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300"
                      title="Google Maps"
                    >
                      <MapPin size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                </div>
              </div>
              )}
            </div>

            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-6 border-b border-slate-700 pb-2 inline-block">Hubungi Kami</h3>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  {footerData.teks_alamat || 'Jl. Pelabuhan II No.Km 6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43169'}
                </p>
                <p className="whitespace-pre-line">
                  {footerData.kontak || 'Telepon: (0266) 6243216\nEmail: rsud.almulk@sukabumikota.go.id'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} UOBK RSUD Al-Mulk Kota Sukabumi. Hak Cipta Dilindungi.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
