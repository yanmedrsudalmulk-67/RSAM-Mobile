import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Activity, 
  CheckCircle2, 
  QrCode, 
  Search, 
  RefreshCcw, 
  XCircle, 
  ShieldCheck,
  Phone,
  CreditCard,
  MapPin,
  ChevronRight,
  AlertCircle,
  LayoutDashboard,
  FileText,
  LogOut,
  Menu,
  X,
  MonitorPlay,
  Volume,
  Volume2,
  VolumeX,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import Profile from './Profile';
import { FloatingInput } from './FloatingInput';
import ArticleSlider from './ArticleSlider';
import { DOCTORS } from '../constants';
import { 
  getAppointmentsDB, 
  saveAppointmentsDB, 
  updateAppointmentStatusDB,
  getVaccineStocksDB, 
  saveVaccineStocksDB, 
  getEIcvStockDB, 
  saveEIcvStockDB,
  getPoliklinikDB,
  getJadwalDokterDB,
  getDokterDB,
  getMedicalRecordDB
} from '../db';
import { supabase } from '../lib/supabase';
import { checkIsCuti } from '../utils/doctorUtils';
import { formatUIDate, isValidDate, toDBDate } from '../lib/dateUtils';

export const formatScheduleDisplay = (schedules: any[]) => {
  if (!schedules || schedules.length === 0) return [];
  
  const daysOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const groups: { [key: string]: string[] } = {};
  schedules.forEach((s: any) => {
    const key = `${s.jam_mulai}|${s.jam_selesai}|${s.kuota_harian}`;
    if (!groups[key]) groups[key] = [];
    const day = (s.hari_praktek || s.hari || '').toLowerCase();
    if (day) groups[key].push(day);
  });

  return Object.keys(groups).map(key => {
    const [jam_mulai, jam_selesai, kuota_str] = key.split('|');
    let scheduleDays = groups[key];
    scheduleDays.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
    
    let parts = [];
    let i = 0;
    while (i < scheduleDays.length) {
      let start = i;
      while (i + 1 < scheduleDays.length && daysOrder.indexOf(scheduleDays[i + 1]) === daysOrder.indexOf(scheduleDays[i]) + 1) {
        i++;
      }
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      if (i > start) {
        parts.push(`${capitalize(scheduleDays[start])} - ${capitalize(scheduleDays[i])}`);
      } else {
        parts.push(capitalize(scheduleDays[start]));
      }
      i++;
    }

    return {
      daysStr: parts.join(', '),
      jam_mulai,
      jam_selesai,
      kuota_harian: parseInt(kuota_str, 10)
    };
  });
};

export default function PendaftaranOnline({ onBack, user, onUpdateUser, initialTab = 'dashboard', initialDoctor }: { onBack: () => void, user?: any, onUpdateUser?: (user: any) => void, initialTab?: 'dashboard' | 'buat-janji' | 'riwayat' | 'cek-antrian' | 'jadwal-dokter' | 'profile', initialDoctor?: any }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'buat-janji' | 'riwayat' | 'rekam-medis' | 'cek-antrian' | 'jadwal-dokter' | 'profile'>(initialTab);
  const [poliklinikList, setPoliklinikList] = useState<any[]>([]);
  const [jadwalDokter, setJadwalDokter] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  useEffect(() => {
    if (user && !user.isProfileComplete) {
      setActiveTab('profile');
    }
  }, [user]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const [poli, jadwal, docs] = await Promise.all([
        getPoliklinikDB(),
        getJadwalDokterDB(),
        getDokterDB()
      ]);
      setPoliklinikList(poli.filter((p: any) => p.status_poli === 'Aktif'));
      setJadwalDokter(jadwal);
      setDoctorsList(docs);
    };
    fetchMasterData();

    const poliSub = supabase.channel('po_poli_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poliklinik' }, fetchMasterData)
      .subscribe();
      
    const jadwalSub = supabase.channel('po_jadwal_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal_dokter' }, fetchMasterData)
      .subscribe();
      
    const dokterSub = supabase.channel('po_dokter_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dokter' }, fetchMasterData)
      .subscribe();

    return () => {
      supabase.removeChannel(poliSub);
      supabase.removeChannel(jadwalSub);
      supabase.removeChannel(dokterSub);
    };
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [callingId, setCallingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAppointmentsDB();
      setAllAppointments(data);
      if (user?.role === 'patient') {
        setAppointments(data.filter((a: any) => a.nik === user.nik));
      } else {
        setAppointments(data);
      }
    };
    fetchData();

    const channel = supabase.channel('realtime-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_kunjungan' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleNewBooking = async (booking: any) => {
    const data = await getAppointmentsDB();
    if (user?.role === 'patient') {
      setAppointments(data.filter((a: any) => a.nik === user.nik));
    } else {
      setAppointments(data);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateAppointmentStatusDB(id, 'Dibatalkan');
      const data = await getAppointmentsDB();
      if (user?.role === 'patient') {
        setAppointments(data.filter((a: any) => a.nik === user.nik));
      } else {
        setAppointments(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (item: any, newStatus: string) => {
    try {
      await updateAppointmentStatusDB(item.id_booking, newStatus);
      
      // Refresh data immediately
      const data = await getAppointmentsDB();
      setAllAppointments(data);
      if (user?.role === 'patient') {
        setAppointments(data.filter((a: any) => a.nik === user.nik));
      } else {
        setAppointments(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePanggilAntrian = (item: any) => {
    if (!('speechSynthesis' in window)) {
      console.log('TTS tidak didukung di device ini');
      if (item.status_antrian !== 'Sedang Dilayani') {
        handleStatusChange(item, 'Sedang Dilayani');
      }
      return;
    }

    try {
      if (callingId === item.id_booking) {
        window.speechSynthesis.cancel();
        setCallingId(null);
        return;
      }

      window.speechSynthesis.cancel();
      
      if (item.status_antrian !== 'Sedang Dilayani') {
        handleStatusChange(item, 'Sedang Dilayani');
      }

      setCallingId(item.id_booking);

      // Format nomor antrian agar dibaca jelas (A001 -> A nol nol satu)
      const formatNomorAntrian = (nomor: string) => {
        if (!nomor) return '';
        const digitMap: { [key: string]: string } = {
          '0': 'nol', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat',
          '5': 'lima', '6': 'enam', '7': 'tujuh', '8': 'delapan', '9': 'sembilan'
        };
        return nomor.replace(/[^a-zA-Z0-9]/g, '').split('').map(char => {
          return digitMap[char] || char;
        }).join(' ');
      };

      const nomorSpelled = formatNomorAntrian(item.nomor_antrian);
      const poliText = item.poli.toLowerCase().includes('poli') ? item.poli : `Poli ${item.poli}`;
      
      // Template Teks Dinamis dengan jeda natural (300-500ms via comma)
      let text = `Nomor Antrian, ${nomorSpelled}, `;
      if (item.nama_pasien) {
        text += `${item.nama_pasien}, `;
      }
      text += `Silakan Menuju, ${poliText}.`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05; // Kecepatan normal/sedikit cepat agar natural
      
      // Pilih suara yang paling natural jika tersedia
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang === 'id-ID' && v.name.toLowerCase().includes('female')) || 
                      voices.find(v => v.lang === 'id-ID');
      if (idVoice) {
        utterance.voice = idVoice;
      }
      
      utterance.onend = () => {
        setCallingId(null);
      };
      
      utterance.onerror = () => {
        setCallingId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS Error:', error);
      setCallingId(null);
    }
  };

  const handleDetailPasien = (item: any) => {
    setSelectedPatient(item);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'buat-janji', label: 'Daftar Online', icon: <Calendar size={20} /> },
    { id: 'riwayat', label: 'Riwayat Pendaftaran', icon: <FileText size={20} /> },
    { id: 'rekam-medis', label: 'Rekam Medis', icon: <FileText size={20} /> },
    { id: 'cek-antrian', label: 'Cek Antrian', icon: <Activity size={20} /> },
    { id: 'jadwal-dokter', label: 'Jadwal Dokter', icon: <Stethoscope size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-emerald-900 text-white flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center space-x-3 border-b border-emerald-800">
          <button onClick={onBack} className="p-2 hover:bg-emerald-800 rounded-full transition-colors -ml-2">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Portal Pasien</h1>
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider">RSUD AL-MULK</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (user && !user.isProfileComplete && item.id !== 'profile') {
                      alert('Silakan lengkapi profil Anda terlebih dahulu.');
                      return;
                    }
                    setActiveTab(item.id as any);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id ? 'bg-emerald-800 text-white font-bold shadow-inner' : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-emerald-800">
          {user?.role === 'patient' && (
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-emerald-800/50">
              {user?.foto_profil ? (
                <img src={user.foto_profil} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-700" />
              ) : (
                <div className="w-10 h-10 bg-emerald-800 rounded-full flex items-center justify-center text-emerald-300">
                  <User size={20} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.nama_pasien}</p>
                <p className="text-xs text-emerald-400 truncate">Pasien</p>
              </div>
            </div>
          )}
          <button onClick={onBack} className="flex items-center space-x-2 text-emerald-300 hover:text-white transition-colors text-sm font-medium w-full">
            <LogOut size={18} />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white text-slate-900 z-30 shadow-sm border-b border-slate-100">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-bold text-lg text-emerald-800">Portal Pasien</h1>
          </div>
          <div className="flex items-center space-x-3">
            {user?.role === 'patient' && (
              <div className="flex items-center space-x-2">
                {user?.foto_profil ? (
                  <img src={user.foto_profil} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-emerald-200" />
                ) : (
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <User size={16} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 relative bg-slate-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <PatientDashboard key="dashboard" onNavigate={setActiveTab} appointments={appointments} user={user} onStatusChange={handleStatusChange} onPanggilAntrian={handlePanggilAntrian} onDetailPasien={handleDetailPasien} callingId={callingId} />
            ) : activeTab === 'buat-janji' ? (
              <FormPendaftaran key="buat-janji" onBookingSuccess={handleNewBooking} poliklinikList={poliklinikList} jadwalDokter={jadwalDokter} user={user} initialDoctor={initialDoctor} doctorsList={doctorsList} />
            ) : activeTab === 'riwayat' ? (
              <RiwayatPendaftaran key="riwayat" appointments={appointments} onCancel={handleCancel} />
            ) : activeTab === 'rekam-medis' ? (
              <RekamMedis key="rekam-medis" appointments={appointments} user={user} />
            ) : activeTab === 'cek-antrian' ? (
              <CekAntrian key="cek-antrian" appointments={appointments} allAppointments={allAppointments} onRefresh={async () => {
                const data = await getAppointmentsDB();
                setAllAppointments(data);
                if (user?.role === 'patient') {
                  setAppointments(data.filter((a: any) => a.nik === user.nik));
                } else {
                  setAppointments(data);
                }
              }} />
            ) : activeTab === 'jadwal-dokter' ? (
              <JadwalDokter key="jadwal-dokter" jadwalDokter={jadwalDokter} poliklinikList={poliklinikList} doctorsList={doctorsList} />
            ) : activeTab === 'profile' ? (
              <Profile key="profile" user={user} onUpdate={(u) => { if(onUpdateUser) onUpdateUser(u); }} onBack={() => setActiveTab('dashboard')} />
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => {
              if (user && !user.isProfileComplete) {
                alert('Silakan lengkapi profil Anda terlebih dahulu.');
                return;
              }
              setActiveTab('dashboard');
            }}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutDashboard size={24} className={activeTab === 'dashboard' ? 'fill-emerald-50' : ''} />
            <span className="text-[10px] font-medium">Beranda</span>
          </button>
          <button 
            onClick={() => {
              if (user && !user.isProfileComplete) {
                alert('Silakan lengkapi profil Anda terlebih dahulu.');
                return;
              }
              setActiveTab('buat-janji');
            }}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${activeTab === 'buat-janji' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Calendar size={24} className={activeTab === 'buat-janji' ? 'fill-emerald-50' : ''} />
            <span className="text-[10px] font-medium">Daftar Online</span>
          </button>
          <button 
            onClick={() => {
              if (user && !user.isProfileComplete) {
                alert('Silakan lengkapi profil Anda terlebih dahulu.');
                return;
              }
              setActiveTab('cek-antrian');
            }}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${activeTab === 'cek-antrian' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Activity size={24} className={activeTab === 'cek-antrian' ? 'fill-emerald-50' : ''} />
            <span className="text-[10px] font-medium">Antrian</span>
          </button>
          <button 
            onClick={() => {
              if (user && !user.isProfileComplete) {
                alert('Silakan lengkapi profil Anda terlebih dahulu.');
                return;
              }
              setActiveTab('rekam-medis');
            }}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${activeTab === 'rekam-medis' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FileText size={24} className={activeTab === 'rekam-medis' ? 'fill-emerald-50' : ''} />
            <span className="text-[10px] font-medium">Rekam Medis</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User size={24} className={activeTab === 'profile' ? 'fill-emerald-50' : ''} />
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </div>
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <User className="mr-3 text-emerald-600" size={24} />
                  Detail Pasien
                </h3>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Nama Lengkap</p>
                      <p className="font-bold text-slate-900 text-lg">{selectedPatient.nama_pasien}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">NIK</p>
                      <p className="font-medium text-slate-900">{selectedPatient.nik}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Nomor HP</p>
                      <p className="font-medium text-slate-900">{selectedPatient.nomor_hp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Alamat</p>
                      <p className="font-medium text-slate-900">{selectedPatient.alamat || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Jenis Jaminan</p>
                      <p className="font-medium text-slate-900">{selectedPatient.jenis_jaminan === 'BPJS' ? 'BPJS Kesehatan' : (selectedPatient.jenis_jaminan || '-')}</p>
                    </div>
                    {selectedPatient.jenis_jaminan === 'BPJS' && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Nomor BPJS</p>
                        <p className="font-medium text-slate-900">{selectedPatient.nomor_bpjs || '-'}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">ID Pendaftaran</p>
                      <p className="font-mono font-bold text-emerald-700">{selectedPatient.id_booking}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Poliklinik & Dokter</p>
                      <p className="font-bold text-slate-900">{selectedPatient.poli}</p>
                      <p className="text-sm text-slate-600">{selectedPatient.dokter}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Jadwal Kunjungan</p>
                      <p className="font-medium text-slate-900">{selectedPatient.tanggal_kunjungan} {selectedPatient.time ? `• ${selectedPatient.time}` : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Status Antrian</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedPatient.status_antrian === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                        selectedPatient.status_antrian === 'Sedang Dilayani' ? 'bg-blue-100 text-blue-700' :
                        selectedPatient.status_antrian === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedPatient.status_antrian}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Tab Components ---

function PatientDashboard({ onNavigate, appointments, user, onStatusChange, onPanggilAntrian, onDetailPasien, callingId }: { onNavigate: (tab: any) => void, appointments: any[], user?: any, onStatusChange?: (item: any, status: string) => void, onPanggilAntrian?: (item: any) => void, onDetailPasien?: (item: any) => void, callingId?: string | null }) {
  // Auto refresh simulation
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter appointments (show all for today by default if needed, or just show all active)
  // Since search and date filter UI are removed, we just show all appointments.
  const filteredAppointments = appointments;

  const activeAppointment = user?.role === 'patient' 
    ? appointments.find(a => a.status_antrian !== 'Selesai' && a.status_antrian !== 'Dibatalkan')
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      {/* Header with User Profile (Patient & Admin) */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Hai, {user?.nama_pasien || (user?.role === 'admin' ? 'Admin' : 'Pasien')}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Selamat datang di Portal {user?.role === 'admin' ? 'Admin' : 'Pasien'} UOBK RSUD AL-MULK</p>
        </div>
        {user?.foto_profil ? (
          <img src={user.foto_profil} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100 shadow-sm" />
        ) : (
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
            <User size={28} />
          </div>
        )}
      </div>

      {/* Antrian Aktif Anda (Patient Only) */}
      {user?.role === 'patient' && activeAppointment && (
        <div className="mb-8 bg-emerald-600 rounded-3xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-emerald-100 mb-4 flex items-center">
              <Activity size={20} className="mr-2" /> Antrian Aktif Anda
            </h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm text-emerald-200 mb-1">Nomor Antrian</p>
                <h4 className="text-5xl font-black tracking-wider mb-2">{activeAppointment.nomor_antrian}</h4>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                  {activeAppointment.status_antrian}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex-1 max-w-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-emerald-200 text-sm">Poli</span>
                    <span className="font-bold">{activeAppointment.poli}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200 text-sm">Dokter</span>
                    <span className="font-bold">{activeAppointment.dokter}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200 text-sm">Jadwal</span>
                    <span className="font-bold">{activeAppointment.tanggal_kunjungan} • {activeAppointment.time}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-emerald-500/50 flex justify-end">
              <button 
                onClick={() => onNavigate('cek-antrian')}
                className="bg-white text-emerald-700 px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-sm"
              >
                Cek Detail Antrian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      <div className="mb-8">
        <ArticleSlider />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Monitoring Kunjungan Pasien</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium tracking-wider text-[10px] uppercase">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">No</th>
                <th className="px-6 py-4">Informasi Pasien</th>
                <th className="px-6 py-4">Poli & Dokter</th>
                <th className="px-6 py-4">Jadwal</th>
                <th className="px-6 py-4 text-center">Antrian</th>
                <th className="px-6 py-4 text-center">Status</th>
                {user?.role === 'admin' && <th className="px-6 py-4 text-center rounded-tr-xl">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((item: any, index: number) => (
                <tr key={item.id_booking} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 text-base">{item.nama_pasien || 'Pasien'}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">NIK: {item.nik || '-'}</p>
                        {item.jenis_jaminan && (
                      <p className="text-[10px] text-slate-500 font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                        {item.jenis_jaminan === 'BPJS' ? 'BPJS Kesehatan' : item.jenis_jaminan} {item.jenis_jaminan === 'BPJS' && item.nomor_bpjs ? `(${item.nomor_bpjs})` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-emerald-700">{item.poli}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.dokter}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-slate-600">
                      <div className="flex items-center font-medium">
                        <Calendar size={14} className="mr-2 text-slate-400" />
                        {item.tanggal_kunjungan}
                      </div>
                      {item.time && (
                        <div className="flex items-center mt-1 text-xs font-medium text-slate-500">
                          <Clock size={12} className="mr-2 text-slate-400" />
                          {item.time}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-800 font-mono font-bold text-lg px-4 py-2 rounded-xl border border-slate-200">
                      {item.nomor_antrian}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user?.role === 'admin' ? (
                      <select 
                        value={item.status_antrian}
                        onChange={(e) => onStatusChange && onStatusChange(item, e.target.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider outline-none cursor-pointer border-r-8 border-transparent shadow-sm ${
                          item.status_antrian === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                          item.status_antrian === 'Sedang Dilayani' ? 'bg-blue-100 text-blue-700' :
                          item.status_antrian === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="Menunggu">🟡 Menunggu</option>
                        <option value="Sedang Dilayani">🔵 Sedang Dilayani</option>
                        <option value="Selesai">🟢 Selesai</option>
                        <option value="Dibatalkan">🔴 Dibatalkan</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status_antrian === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                        item.status_antrian === 'Sedang Dilayani' ? 'bg-blue-100 text-blue-700' :
                        item.status_antrian === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status_antrian}
                      </span>
                    )}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => onPanggilAntrian && onPanggilAntrian(item)}
                          className={`p-2 rounded-lg transition-all relative overflow-hidden group ${
                            callingId === item.id_booking 
                              ? 'bg-emerald-100 text-emerald-600 hover:bg-red-100 hover:text-red-600 shadow-inner' 
                              : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200'
                          }`}
                          title={callingId === item.id_booking ? "Hentikan Panggilan" : "Panggil Antrian"}
                        >
                          {callingId === item.id_booking ? (
                            <>
                              <span className="absolute inset-0 bg-emerald-200 opacity-50 animate-ping rounded-lg group-hover:hidden"></span>
                              <Volume2 size={18} className="relative z-10 group-hover:hidden animate-pulse" />
                              <VolumeX size={18} className="relative z-10 hidden group-hover:block" />
                            </>
                          ) : (
                            <Volume size={18} />
                          )}
                        </button>
                        <button 
                          onClick={() => onDetailPasien && onDetailPasien(item)}
                          className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 7 : 6} className="px-6 py-8 text-center text-slate-500">Tidak ada data ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function CustomDatePicker({ selectedDate, onDateSelect, isDateAllowed }: { selectedDate: string, onDateSelect: (date: string) => void, isDateAllowed: (date: string) => boolean }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className="rotate-180" size={20}/></button>
        <span className="font-bold text-slate-800">
          {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={20}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div key={d} className="text-xs font-bold text-slate-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="p-2"></div>;
          
          // Format date to YYYY-MM-DD local time
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          
          const isPast = date < today;
          const allowed = !isPast && isDateAllowed(dateString);
          const isSelected = selectedDate === dateString;

          return (
            <button
              key={dateString}
              disabled={!allowed}
              onClick={() => onDateSelect(dateString)}
              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                isSelected ? 'bg-emerald-600 text-white shadow-md' :
                allowed ? 'hover:bg-emerald-50 text-slate-700' :
                'text-slate-300 bg-slate-50 cursor-not-allowed'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormPendaftaran({ onBookingSuccess, poliklinikList, jadwalDokter, user, initialDoctor, doctorsList }: { onBookingSuccess: (booking: any) => void, poliklinikList: any[], jadwalDokter: any[], user?: any, initialDoctor?: any, doctorsList?: any[] }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nik: user?.nik || '', 
    name: user?.nama_pasien || '', 
    phone: user?.no_hp || '', 
    dob: formatUIDate(user?.tanggal_lahir || ''), 
    gender: user?.jenis_kelamin || '', 
    address: user?.alamat || '', 
    jaminanKesehatan: user?.nomor_bpjs ? 'BPJS' : '',
    nomor_bpjs: user?.nomor_bpjs || '',
    poli: '', doctorId: '', date: '', timeSlot: '', vaccines: [] as string[],
    file_ktp_kk: '', file_passport: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nik: user.nik || prev.nik,
        name: user.nama_pasien || prev.name,
        phone: user.no_hp || prev.phone,
        dob: formatUIDate(user.tanggal_lahir || prev.dob),
        gender: user.jenis_kelamin || prev.gender,
        address: user.alamat || prev.address,
        jaminanKesehatan: user.nomor_bpjs ? 'BPJS' : prev.jaminanKesehatan,
        nomor_bpjs: user.nomor_bpjs || prev.nomor_bpjs
      }));
    }
  }, [user]);

  useEffect(() => {
    if (initialDoctor && jadwalDokter.length > 0) {
      // Find the doctor in jadwalDokter to get their poli
      const doctorSchedule = jadwalDokter.find(d => d.nama_dokter === initialDoctor.name || d.nama_dokter.includes(initialDoctor.name) || initialDoctor.name.includes(d.nama_dokter));
      if (doctorSchedule) {
        setFormData(prev => ({
          ...prev,
          poli: doctorSchedule.poli,
          doctorId: doctorSchedule.nama_dokter
        }));
      }
    }
  }, [initialDoctor, jadwalDokter]);

  const [bookingResult, setBookingResult] = useState<any>(null);
  const [vaccineStocksDB, setVaccineStocksDB] = useState<any[]>([]);
  const [eIcvStockDB, setEIcvStockDB] = useState<any>({ jumlah_stok: 0 });
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp_kk' | 'passport') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Format file tidak sesuai atau ukuran melebihi 5 MB');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Format file tidak sesuai atau ukuran melebihi 5 MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64String,
            type,
            nik: formData.nik || 'unknown'
          })
        });

        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            [type === 'ktp_kk' ? 'file_ktp_kk' : 'file_passport']: data.url
          }));
          setUploadSuccess(type);
          setTimeout(() => setUploadSuccess(null), 3000);
        } else {
          throw new Error(data.error || 'Gagal mengunggah file');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMsg(error.message || 'Gagal mengunggah file.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const vData = await getVaccineStocksDB();
      const eData = await getEIcvStockDB();
      setVaccineStocksDB(vData);
      setEIcvStockDB(eData);
    };
    fetchData();
    
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 1 && !isValidDate(formData.dob)) {
      setErrorMsg('Tanggal lahir tidak valid. Gunakan format DD/MM/YYYY yang benar.');
      return;
    }
    setErrorMsg('');
    setStep(s => s + 1);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBooking = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (formData.poli === 'Poli Vaksinasi') {
        const currentVaccines = await getVaccineStocksDB();
        const currentEIcv = await getEIcvStockDB();
        
        for (const vName of formData.vaccines) {
          const stock = currentVaccines.find((v: any) => v.nama_vaksin === vName);
          if (!stock || stock.stok_tersedia <= 0) {
            setErrorMsg(`Maaf, stok Vaksin ${vName} tidak mencukupi.`);
            setIsSubmitting(false);
            return;
          }
          if (vName === 'Meningitis') {
            if (!currentEIcv || currentEIcv.jumlah_stok <= 0) {
              setErrorMsg('Maaf, stok e-ICV untuk Meningitis tidak mencukupi.');
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      const specificSchedule = getSpecificScheduleForDate(formData.date);
      const result = {
        id_booking: `BK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        id_jadwal: specificSchedule?.id,
        poli: formData.poli,
        dokter: formData.doctorId,
        tanggal_kunjungan: formData.date,
        time: formData.timeSlot,
        nama_pasien: formData.name,
        nik: formData.nik,
        tanggal_lahir: toDBDate(formData.dob),
        jenis_kelamin: formData.gender,
        nomor_hp: formData.phone,
        alamat: formData.address,
        jenis_jaminan: formData.jaminanKesehatan,
        nomor_bpjs: formData.jaminanKesehatan === 'BPJS' ? formData.nomor_bpjs : null,
        jenis_vaksin: formData.poli === 'Poli Vaksinasi' ? formData.vaccines : undefined,
        file_ktp_kk: formData.file_ktp_kk,
        file_passport: formData.file_passport,
        tanggal_upload: formData.file_ktp_kk || formData.file_passport ? new Date().toISOString() : undefined
      };
      
      const savedBooking = await saveAppointmentsDB(result);
      
      const finalResult = {
        ...result,
        id_booking: savedBooking.id_booking || result.id_booking,
      };
      
      setBookingResult({
        ...finalResult,
        noAntrian: savedBooking.nomor_antrian,
        noBooking: finalResult.id_booking,
        doctor: finalResult.dokter,
        date: finalResult.tanggal_kunjungan,
        patientName: finalResult.nama_pasien,
        bookingTime: new Date().toISOString().slice(0,10)
      });
      onBookingSuccess(finalResult);
      setStep(4);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] User: Guest | Error saving booking:`, error.message, formData);
      setErrorMsg('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDoctorSchedules = () => {
    return jadwalDokter.filter(d => d.nama_dokter === formData.doctorId && d.poli === formData.poli);
  };

  const getSpecificScheduleForDate = (dateString: string) => {
    const docs = getDoctorSchedules();
    if (docs.length === 0) return null;
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const daysMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const dayName = daysMap[dayOfWeek];

    for (const doc of docs) {
      if (doc.schedules && Array.isArray(doc.schedules) && doc.schedules.length > 0) {
        const schedule = doc.schedules.find((s: any) => s.hari_praktek.toLowerCase() === dayName);
        if (schedule) {
          return { ...doc, specific_schedule: schedule };
        }
      } else {
        const hariPraktek = (doc.hari_praktek || '').toLowerCase();
        if (hariPraktek.includes('-')) {
          const parts = hariPraktek.split('-').map((p: string) => p.trim());
          const startIdx = daysMap.findIndex(d => d === parts[0]);
          const endIdx = daysMap.findIndex(d => d === parts[1]);
          if (startIdx !== -1 && endIdx !== -1) {
            if (dayOfWeek >= startIdx && dayOfWeek <= endIdx) {
              return { ...doc, specific_schedule: { hari_praktek: dayName, jam_mulai: doc.jam_mulai, jam_selesai: doc.jam_selesai, kuota_harian: doc.kuota_harian || 30 } };
            }
          }
        } else {
          const days = hariPraktek.split(/,|dan/).map((p: string) => p.trim());
          if (days.some((d: string) => d === dayName)) {
            return { ...doc, specific_schedule: { hari_praktek: dayName, jam_mulai: doc.jam_mulai, jam_selesai: doc.jam_selesai, kuota_harian: doc.kuota_harian || 30 } };
          }
        }
      }
    }
    return null;
  };

  const isDateAllowed = (dateString: string) => {
    if (!dateString) return false;
    const docs = getDoctorSchedules();
    if (docs.length === 0) return true;

    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const dayName = daysMap[dayOfWeek];

    // Check if doctor is on leave
    const isOnLeave = docs.some(doc => {
      if (doc.status_dokter?.toLowerCase() === 'cuti') {
        if (doc.tanggal_mulai_cuti && doc.tanggal_selesai_cuti) {
          const leaveStart = new Date(doc.tanggal_mulai_cuti);
          const leaveEnd = new Date(doc.tanggal_selesai_cuti);
          leaveStart.setHours(0, 0, 0, 0);
          leaveEnd.setHours(23, 59, 59, 999);
          const checkDate = new Date(dateString);
          checkDate.setHours(12, 0, 0, 0);
          return checkDate >= leaveStart && checkDate <= leaveEnd;
        }
        return true; // Cuti without dates means always on leave
      }
      return false;
    });

    if (isOnLeave) return false;

    return docs.some(doc => {
      if (doc.schedules && Array.isArray(doc.schedules) && doc.schedules.length > 0) {
        return doc.schedules.some((s: any) => s.hari_praktek.toLowerCase() === dayName);
      }
      
      const hariPraktek = (doc.hari_praktek || '').toLowerCase();
      if (hariPraktek.includes('-')) {
        const parts = hariPraktek.split('-').map((p: string) => p.trim());
        const startIdx = daysMap.findIndex(d => d === parts[0]);
        const endIdx = daysMap.findIndex(d => d === parts[1]);
        if (startIdx !== -1 && endIdx !== -1) {
          return dayOfWeek >= startIdx && dayOfWeek <= endIdx;
        }
      } else {
        const days = hariPraktek.split(/,|dan/).map((p: string) => p.trim());
        return days.some((d: string) => d === dayName);
      }
      return false;
    });
  };

  const handleDateSelect = (selectedDate: string) => {
    if (selectedDate && !isDateAllowed(selectedDate)) {
      const docs = getDoctorSchedules();
      const isOnLeave = docs.some(doc => {
        if (doc.status_dokter?.toLowerCase() === 'cuti') {
          if (doc.tanggal_mulai_cuti && doc.tanggal_selesai_cuti) {
            const leaveStart = new Date(doc.tanggal_mulai_cuti);
            const leaveEnd = new Date(doc.tanggal_selesai_cuti);
            leaveStart.setHours(0, 0, 0, 0);
            leaveEnd.setHours(23, 59, 59, 999);
            const checkDate = new Date(selectedDate);
            checkDate.setHours(12, 0, 0, 0);
            return checkDate >= leaveStart && checkDate <= leaveEnd;
          }
          return true;
        }
        return false;
      });

      if (isOnLeave) {
        const leaveDoc = docs.find(doc => doc.status_dokter?.toLowerCase() === 'cuti');
        if (leaveDoc?.tanggal_selesai_cuti) {
          setErrorMsg(`Dokter sedang cuti sampai tanggal ${leaveDoc.tanggal_selesai_cuti}.`);
        } else {
          setErrorMsg(`Dokter saat ini sedang cuti.`);
        }
      } else {
        setErrorMsg(`Dokter tidak praktek pada hari tersebut.`);
      }
      setFormData({...formData, date: ''});
    } else {
      setFormData({...formData, date: selectedDate, timeSlot: ''});
    }
  };

  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [showFullToast, setShowFullToast] = useState(false);
  const MAX_BOOKING_PER_SLOT = 3;

  useEffect(() => {
    const fetchExisting = async () => {
      if (formData.doctorId && formData.date) {
        const specificSchedule = getSpecificScheduleForDate(formData.date);
        if (specificSchedule) {
          const all = await getAppointmentsDB();
          const filtered = all.filter((a: any) => 
            a.dokter === formData.doctorId && 
            a.poli === formData.poli &&
            a.tanggal_kunjungan === formData.date &&
            a.status_antrian !== 'Dibatalkan'
          );
          setExistingAppointments(filtered);
        }
      }
    };
    fetchExisting();
  }, [formData.doctorId, formData.date]);

  const generateTimeSlots = () => {
    if (!formData.date) return [];
    const docWithSchedule = getSpecificScheduleForDate(formData.date);
    if (!docWithSchedule || !docWithSchedule.specific_schedule) return [];
    
    const schedule = docWithSchedule.specific_schedule;
    if (!schedule.jam_mulai || !schedule.jam_selesai) return [];

    const slots = [];
    let current = new Date(`2000-01-01T${schedule.jam_mulai}:00`);
    const end = new Date(`2000-01-01T${schedule.jam_selesai}:00`);
    
    // Batas daftar = jam selesai - 1 jam
    const limit = new Date(end.getTime() - 60 * 60 * 1000);

    while (current <= limit) {
      const timeString = current.toTimeString().slice(0, 5);
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const docWithSchedule = getSpecificScheduleForDate(formData.date);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white p-4 px-6 rounded-2xl shadow-2xl z-50 flex items-center space-x-3 border border-emerald-100"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <span className="font-bold text-slate-900">Dokumen berhasil diupload</span>
          </motion.div>
        )}
        {showFullToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white p-4 px-6 rounded-2xl shadow-2xl z-50 flex items-center space-x-3 border border-red-100"
          >
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <span className="font-bold text-slate-900">Jadwal sudah penuh</span>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Daftar Online</h2>
      
      {step < 4 && (
        <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between mb-2">
            <span className={`text-xs font-bold ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>Data Pasien</span>
            <span className={`text-xs font-bold ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>Pilih Poli</span>
            <span className={`text-xs font-bold ${step >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>Jadwal</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleNext} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FloatingInput
                label="Nama Lengkap *"
                type="text"
                required
                icon={<User size={18} />}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                validationFn={(val) => val.length >= 3}
                errorMessage="Nama minimal 3 karakter"
              />
            </div>
            <div>
              <FloatingInput
                label="Nomor NIK (KTP) *"
                type="text"
                required
                icon={<CreditCard size={18} />}
                value={formData.nik}
                onChange={e => setFormData({...formData, nik: e.target.value})}
                validationFn={(val) => val.length === 16}
                errorMessage="NIK harus 16 digit"
              />
            </div>
            <div>
              <FloatingInput
                label="Tanggal Lahir *"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                required
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: formatUIDate(e.target.value)})}
                validationFn={(val) => isValidDate(val)}
                errorMessage="Tanggal tidak valid"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin *</label>
              <select required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm transition-all" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <FloatingInput
                label="Nomor HP *"
                type="tel"
                required
                icon={<Phone size={18} />}
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                validationFn={(val) => val.length >= 10}
                errorMessage="No Telepon tidak valid"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Jaminan Kesehatan *</label>
              <select required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm transition-all" value={formData.jaminanKesehatan} onChange={e => setFormData({...formData, jaminanKesehatan: e.target.value})}>
                <option value="">Pilih Jaminan Kesehatan</option>
                <option value="BPJS">BPJS Kesehatan</option>
                <option value="KTP/KK">KTP/KK</option>
                <option value="Umum/Pribadi">Umum/Pribadi</option>
                <option value="Asuransi Lainnya">Asuransi Lainnya</option>
              </select>
            </div>
            {formData.jaminanKesehatan === 'BPJS' && (
              <div className="sm:col-span-2">
                <FloatingInput
                  label="Nomor BPJS *"
                  type="text"
                  required
                  icon={<CreditCard size={18} />}
                  value={formData.nomor_bpjs}
                  onChange={e => setFormData({...formData, nomor_bpjs: e.target.value.replace(/\D/g, '')})}
                  validationFn={(val) => val.length === 13}
                  errorMessage="Nomor BPJS harus terdiri dari 13 digit angka."
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap *</label>
              <textarea required rows={2} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md mt-6">
            Lanjutkan
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Poliklinik Tujuan</label>
            
            {/* Poliklinik Utama */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Poliklinik Utama</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {poliklinikList
                  .filter(p => jadwalDokter.some(d => d.poli === p.nama_poli))
                  .filter(p => !p.nama_poli.toLowerCase().includes('patologi') && !p.nama_poli.toLowerCase().includes('radiologi'))
                  .map(poli => {
                  const isSelected = formData.poli === poli.nama_poli;
                  return (
                    <button 
                      key={poli.id_poli}
                      onClick={() => setFormData({...formData, poli: poli.nama_poli, doctorId: ''})}
                      className={`p-4 rounded-2xl text-sm font-bold text-left flex items-center justify-between transition-all duration-300 ${
                        isSelected 
                          ? 'text-emerald-800 shadow-lg ring-2 ring-emerald-500/50' 
                          : 'text-slate-700 hover:shadow-md'
                      }`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {poli.nama_poli}
                      {isSelected && <CheckCircle2 size={16} className="text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spesialis Penunjang */}
            {poliklinikList.some(p => jadwalDokter.some(d => d.poli === p.nama_poli) && (p.nama_poli.toLowerCase().includes('patologi') || p.nama_poli.toLowerCase().includes('radiologi'))) && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Spesialis Penunjang</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {poliklinikList
                    .filter(p => jadwalDokter.some(d => d.poli === p.nama_poli))
                    .filter(p => p.nama_poli.toLowerCase().includes('patologi') || p.nama_poli.toLowerCase().includes('radiologi'))
                    .map(poli => {
                    const isSelected = formData.poli === poli.nama_poli;
                    return (
                      <button 
                        key={poli.id_poli}
                        onClick={() => setFormData({...formData, poli: poli.nama_poli, doctorId: ''})}
                        className={`p-4 rounded-2xl text-sm font-bold text-left flex items-center justify-between transition-all duration-300 ${
                          isSelected 
                            ? 'text-emerald-800 shadow-lg ring-2 ring-emerald-500/50' 
                            : 'text-slate-700 hover:shadow-md'
                        }`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {poli.nama_poli}
                        {isSelected && <CheckCircle2 size={16} className="text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {formData.poli && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-bold text-slate-700 mb-3 mt-6">Pilih Dokter</label>
              <div className="space-y-3">
                {jadwalDokter.filter(d => d.poli === formData.poli).reduce((acc: any[], curr: any) => {
                  const existing = acc.find(item => item.nama_dokter === curr.nama_dokter);
                  
                  const getSchedules = (curr: any) => {
                    if (curr.schedules && Array.isArray(curr.schedules) && curr.schedules.length > 0) {
                      return curr.schedules.map((s: any) => ({
                        hari: s.hari_praktek,
                        jam_mulai: s.jam_mulai,
                        jam_selesai: s.jam_selesai,
                        kuota_harian: s.kuota_harian
                      }));
                    }
                    
                    const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    const result: { hari: string, jam_mulai: string, jam_selesai: string, kuota_harian: number }[] = [];
                    const hp = (curr.hari_praktek || '').toLowerCase();
                    const jam_mulai = curr.jam_mulai;
                    const jam_selesai = curr.jam_selesai;
                    const kuota_harian = curr.kuota_harian || 30;
                    
                    if (hp.includes('-')) {
                      const parts = hp.split('-').map((p: string) => p.trim());
                      const startIdx = daysMap.findIndex(d => d.toLowerCase() === parts[0]);
                      const endIdx = daysMap.findIndex(d => d.toLowerCase() === parts[1]);
                      if (startIdx !== -1 && endIdx !== -1) {
                        for (let i = startIdx; i <= endIdx; i++) {
                          result.push({ hari: daysMap[i], jam_mulai, jam_selesai, kuota_harian });
                        }
                      }
                    } else {
                      const days = hp.split(/,|dan/).map((p: string) => p.trim());
                      days.forEach((d: string) => {
                        const found = daysMap.find(dm => dm.toLowerCase() === d);
                        if (found) {
                          result.push({ hari: found, jam_mulai, jam_selesai, kuota_harian });
                        }
                      });
                    }
                    return result;
                  };

                  const parsedSchedules = getSchedules(curr);

                  if (existing) {
                    existing.rawSchedules.push(curr);
                    existing.displaySchedules.push(...parsedSchedules);
                  } else {
                    acc.push({ 
                      ...curr, 
                      rawSchedules: [curr],
                      displaySchedules: parsedSchedules
                    });
                  }
                  return acc;
                }, []).map(doc => {
                  const daysOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
                  doc.displaySchedules.sort((a: any, b: any) => daysOrder.indexOf((a.hari || '').toLowerCase()) - daysOrder.indexOf((b.hari || '').toLowerCase()));

                  const poliInfo = poliklinikList.find(p => p.nama_poli === doc.poli);
                  const isCuti = checkIsCuti(doc.rawSchedules);
                  const isAvailable = !isCuti;
                  
                  let doctorInfo = doctorsList && doctorsList.length > 0 ? doctorsList.find(d => d.nama_dokter === doc.nama_dokter || d.nama_dokter.split(',')[0].trim() === doc.nama_dokter.split(',')[0].trim()) : undefined;
                  if (!doctorInfo) {
                    doctorInfo = DOCTORS.find(d => d.name === doc.nama_dokter || d.name.split(',')[0].trim() === doc.nama_dokter.split(',')[0].trim());
                  }
                  
                  // Hide inactive doctors
                  if (doctorInfo?.status_aktif === 'Tidak Aktif') {
                    return null;
                  }
                  
                  const imageUrl = doctorInfo?.foto_dokter || doctorInfo?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.nama_dokter)}&background=10b981&color=fff`;
                  const formattedSchedules = formatScheduleDisplay(doc.displaySchedules);
                  
                  return (
                  <div 
                    key={doc.nama_dokter}
                    onClick={() => isAvailable && setFormData({...formData, doctorId: doc.nama_dokter, date: '', timeSlot: ''})}
                    className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all ${
                      !isAvailable ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' :
                      formData.doctorId === doc.nama_dokter ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 cursor-pointer' : 'border-slate-200 bg-white hover:border-emerald-300 cursor-pointer'
                    }`}
                  >
                    <img src={imageUrl} alt={doc.nama_dokter} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{doc.nama_dokter}</h4>
                      <div className="text-xs text-slate-500 mb-2 space-y-1 mt-1">
                        {formattedSchedules.map((s: any, idx: number) => (
                          <div key={idx} className="flex justify-between w-48">
                            <span>{s.daysStr}</span>
                            <span>{s.jam_mulai} - {s.jam_selesai}</span>
                          </div>
                        ))}
                      </div>
                      {isAvailable ? (
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                          Tersedia
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                          Sedang Cuti
                        </span>
                      )}
                    </div>
                    {formData.doctorId === doc.nama_dokter && <CheckCircle2 size={24} className="text-emerald-500" />}
                  </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {formData.poli === 'Poli Vaksinasi' && formData.doctorId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-slate-100 pt-6">
              <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Jenis Vaksin</label>
              <div className="space-y-3 mb-4">
                {vaccineStocksDB.map((v: any) => {
                  const isMeningitis = v.nama_vaksin === 'Meningitis';
                  const isOutOfStock = v.stok_tersedia <= 0 || (isMeningitis && eIcvStockDB.jumlah_stok <= 0);
                  const isSelected = formData.vaccines.includes(v.nama_vaksin);

                  return (
                    <label key={v.id} className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all ${
                      isOutOfStock ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed' :
                      isSelected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 disabled:opacity-50"
                        disabled={isOutOfStock}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, vaccines: [...formData.vaccines, v.nama_vaksin]});
                          } else {
                            setFormData({...formData, vaccines: formData.vaccines.filter(name => name !== v.nama_vaksin)});
                          }
                        }}
                      />
                      <div className="ml-3 flex-1">
                        <span className="block text-sm font-bold text-slate-900">Vaksin {v.nama_vaksin}</span>
                        <span className="block text-xs text-slate-500">{v.stok_tersedia} dosis tersedia</span>
                      </div>
                      {isOutOfStock && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">Stok Habis</span>
                      )}
                    </label>
                  );
                })}
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-1">Stok e-ICV Saat Ini</p>
                <p className="text-xs text-blue-700">{eIcvStockDB.jumlah_stok} tersedia</p>
                {eIcvStockDB.jumlah_stok <= 0 && (
                  <p className="text-xs text-red-600 font-bold mt-1">e-ICV: Tidak tersedia. Booking vaksin meningitis tidak dapat dilanjutkan.</p>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">Upload Dokumen Identitas (Wajib)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <p className="text-sm font-bold text-slate-700 mb-2">Upload KTP / KK</p>
                    <input type="file" accept=".jpg,.jpeg,.pdf" onChange={(e) => handleFileUpload(e, 'ktp_kk')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    <p className="text-xs text-slate-500 mt-2">Format: JPG / PDF<br/>Maksimal 5 MB</p>
                    {formData.file_ktp_kk && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center"><CheckCircle2 size={14} className="mr-1" /> File terunggah</p>}
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <p className="text-sm font-bold text-slate-700 mb-2">Upload Passport</p>
                    <input type="file" accept=".jpg,.jpeg,.pdf" onChange={(e) => handleFileUpload(e, 'passport')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    <p className="text-xs text-slate-500 mt-2">Format: JPG / PDF<br/>Maksimal 5 MB</p>
                    {formData.file_passport && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center"><CheckCircle2 size={14} className="mr-1" /> File terunggah</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex space-x-3 pt-6">
            <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">Kembali</button>
            <button 
              onClick={(e) => {
                if (formData.poli === 'Poli Vaksinasi' && (!formData.file_ktp_kk || !formData.file_passport)) {
                  setErrorMsg('Harap unggah dokumen KTP/KK dan Passport sebelum melanjutkan booking');
                  return;
                }
                handleNext(e);
              }} 
              disabled={!formData.poli || !formData.doctorId || (formData.poli === 'Poli Vaksinasi' && formData.vaccines.length === 0)} 
              className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Tanggal Berobat</label>
            <CustomDatePicker 
              selectedDate={formData.date} 
              onDateSelect={handleDateSelect} 
              isDateAllowed={isDateAllowed} 
            />
            {getDoctorSchedules().length > 0 && (
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                <p className="font-bold">Jadwal Praktek:</p>
                {formatScheduleDisplay(getDoctorSchedules().flatMap((doc: any) => {
                  if (doc.schedules && Array.isArray(doc.schedules) && doc.schedules.length > 0) {
                    return doc.schedules;
                  }
                  return [{
                    hari_praktek: doc.hari_praktek,
                    jam_mulai: doc.jam_mulai,
                    jam_selesai: doc.jam_selesai,
                    kuota_harian: doc.kuota_harian
                  }];
                })).map((s: any, idx: number) => (
                  <p key={idx}>• {s.daysStr} ({s.jam_mulai} - {s.jam_selesai})</p>
                ))}
              </div>
            )}
          </div>

          {formData.date && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Waktu</label>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map(time => {
                  const count = existingAppointments.filter(a => a.time === time).length;
                  const isFull = count >= MAX_BOOKING_PER_SLOT;
                  return (
                    <motion.button 
                      key={time} 
                      whileHover={!isFull ? { scale: 1.02 } : {}}
                      whileTap={!isFull ? { scale: 0.98 } : {}}
                      onClick={() => {
                        if (isFull) {
                          setShowFullToast(true);
                          setTimeout(() => setShowFullToast(false), 3000);
                        } else {
                          setFormData({...formData, timeSlot: time});
                        }
                      }} 
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all text-center flex flex-col items-center justify-center min-h-[60px] ${
                        isFull ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed' :
                        formData.timeSlot === time ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20' : 
                        'border-slate-200 bg-white hover:bg-green-50 text-slate-600'
                      }`}
                    >
                      <span>{time}</span>
                      {isFull && <span className="text-[10px] mt-1">Sudah Penuh</span>}
                    </motion.button>
                  );
                })}
                {timeSlots.length === 0 && (
                  <p className="text-sm text-slate-500 col-span-2">Tidak ada slot waktu tersedia untuk dokter ini.</p>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex space-x-3 pt-6">
            <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">Kembali</button>
            <button onClick={handleBooking} disabled={!formData.date || !formData.timeSlot || isSubmitting} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Memproses...' : 'Daftar Online Sekarang'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && bookingResult && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-slate-500 text-sm mb-8">Data telah disimpan ke Riwayat Pendaftaran.</p>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg max-w-sm mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Antrian</p>
            <h3 className="text-5xl font-black text-emerald-600 mb-6">{bookingResult.noAntrian}</h3>
            
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                <QRCodeSVG value={bookingResult.noBooking} size={120} level="H" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mb-6">Scan QR Code ini di mesin antrian rumah sakit untuk Check-In.</p>

            <div className="text-left space-y-3 border-t border-slate-100 pt-6">
              <div>
                <p className="text-xs text-slate-500">Poliklinik & Dokter</p>
                <p className="font-bold text-slate-900">{bookingResult.poli}</p>
                <p className="text-sm text-slate-700">{bookingResult.doctor}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Jadwal Berobat</p>
                <p className="font-bold text-slate-900">{bookingResult.date} • {bookingResult.time}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nomor Pendaftaran</p>
                <p className="font-mono font-bold text-slate-900">{bookingResult.noBooking}</p>
              </div>
            </div>
          </div>
          <button onClick={() => { setStep(1); setFormData({...formData, poli: '', doctorId: '', date: '', timeSlot: ''}); }} className="mt-8 text-emerald-600 font-bold hover:underline">
            Buat Pendaftaran Baru
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function RiwayatPendaftaran({ appointments, onCancel }: { appointments: any[], onCancel: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, type: string} | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Riwayat Antrian Pendaftaran</h2>
      
      <div className="space-y-4">
        {appointments.map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => setExpandedId(expandedId === item.id_booking ? null : item.id_booking)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status_antrian === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                    item.status_antrian === 'Sedang Dilayani' ? 'bg-blue-100 text-blue-700' :
                    item.status_antrian === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.status_antrian}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{item.id_booking}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Antrian: {item.nomor_antrian}</span>
                </div>
                <h4 className="font-bold text-slate-900">{item.poli}</h4>
                <p className="text-sm text-slate-600 font-medium">{item.nama_pasien || 'Pasien'}</p>
                <p className="text-sm text-slate-500">{item.dokter}</p>
                {item.jenis_vaksin && item.jenis_vaksin.length > 0 && (
                  <p className="text-xs text-slate-700 font-medium mt-1">Vaksin: {item.jenis_vaksin.join(', ')}</p>
                )}
                <p className="text-xs text-slate-500 mt-2 flex items-center">
                  <Calendar size={12} className="mr-1" /> {item.tanggal_kunjungan} <span className="mx-2">•</span> <Clock size={12} className="mr-1" /> {item.time}
                </p>
              </div>
              
              {item.status_antrian === 'Menunggu' && (
                <div className="flex space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); onCancel(item.id_booking); }} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors text-center">
                    Batalkan
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {expandedId === item.id_booking && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-slate-100 pt-4 mt-2"
                >
                  <h5 className="font-bold text-slate-800 mb-3 text-sm">Detail Pendaftaran</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div><span className="text-slate-500">Nama Pasien:</span> <span className="font-medium text-slate-900">{item.nama_pasien}</span></div>
                    <div><span className="text-slate-500">NIK:</span> <span className="font-medium text-slate-900">{item.nik}</span></div>
                    <div><span className="text-slate-500">Tanggal Lahir:</span> <span className="font-medium text-slate-900">{item.tanggal_lahir}</span></div>
                    <div><span className="text-slate-500">Jenis Kelamin:</span> <span className="font-medium text-slate-900">{item.jenis_kelamin}</span></div>
                    <div><span className="text-slate-500">Nomor Telepon:</span> <span className="font-medium text-slate-900">{item.nomor_hp}</span></div>
                    <div><span className="text-slate-500">Alamat:</span> <span className="font-medium text-slate-900">{item.alamat}</span></div>
                    <div><span className="text-slate-500">Jenis Jaminan:</span> <span className="font-medium text-slate-900">{item.jenis_jaminan}</span></div>
                    <div><span className="text-slate-500">Poli Tujuan:</span> <span className="font-medium text-slate-900">{item.poli}</span></div>
                    <div><span className="text-slate-500">Dokter:</span> <span className="font-medium text-slate-900">{item.dokter}</span></div>
                    <div><span className="text-slate-500">Tanggal Kunjungan:</span> <span className="font-medium text-slate-900">{item.tanggal_kunjungan}</span></div>
                    <div><span className="text-slate-500">Nomor Antrian:</span> <span className="font-medium text-slate-900">{item.nomor_antrian}</span></div>
                    {item.jenis_vaksin && item.jenis_vaksin.length > 0 && (
                      <div><span className="text-slate-500">Jenis Vaksin:</span> <span className="font-medium text-slate-900">{item.jenis_vaksin.join(', ')}</span></div>
                    )}
                    <div><span className="text-slate-500">Status:</span> <span className="font-medium text-slate-900">{item.status_antrian}</span></div>
                    <div><span className="text-slate-500">Waktu Pendaftaran:</span> <span className="font-medium text-slate-900">{item.waktu_booking}</span></div>
                  </div>
                  
                  {(item.file_ktp_kk || item.file_passport) && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <h6 className="font-bold text-slate-800 mb-3 text-sm">Dokumen Identitas Pasien</h6>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {item.file_ktp_kk && (
                          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1">
                            <span className="text-sm font-medium text-slate-700">KTP / KK</span>
                            <button onClick={(e) => { e.stopPropagation(); setPreviewFile({url: item.file_ktp_kk, type: 'KTP / KK'}); }} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200">Lihat File</button>
                          </div>
                        )}
                        {item.file_passport && (
                          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1">
                            <span className="text-sm font-medium text-slate-700">Passport</span>
                            <button onClick={(e) => { e.stopPropagation(); setPreviewFile({url: item.file_passport, type: 'Passport'}); }} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200">Lihat File</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {appointments.length === 0 && (
          <div className="text-center py-12 text-slate-500">Belum ada riwayat pendaftaran.</div>
        )}
      </div>

      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Preview Dokumen: {previewFile.type}</h3>
                <button onClick={() => setPreviewFile(null)} className="text-slate-500 hover:text-slate-700"><X size={24} /></button>
              </div>
              <div className="p-4 flex-1 overflow-auto bg-slate-100 flex justify-center items-center min-h-[50vh]">
                {previewFile.url.endsWith('.pdf') ? (
                  <iframe src={previewFile.url} className="w-full h-[70vh] rounded-lg border border-slate-200" title="PDF Preview" />
                ) : (
                  <img src={previewFile.url} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RekamMedis({ appointments, user }: { appointments: any[], user?: any }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<Record<string, any>>({});
  const [loadingRecords, setLoadingRecords] = useState<Record<string, boolean>>({});
  
  const completedAppointments = appointments.filter(a => a.status_antrian === 'Selesai');

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    
    if (!medicalRecords[id] && !loadingRecords[id]) {
      setLoadingRecords(prev => ({ ...prev, [id]: true }));
      try {
        const record = await getMedicalRecordDB(id);
        setMedicalRecords(prev => ({ ...prev, [id]: record }));
      } catch (error) {
        console.error('Error fetching medical record:', error);
      } finally {
        setLoadingRecords(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  // Get biodata from user or the most recent appointment
  const biodata = {
    nama: user?.nama_pasien || appointments[0]?.nama_pasien || '-',
    nik: user?.nik || appointments[0]?.nik || '-',
    tanggal_lahir: user?.tanggal_lahir || appointments[0]?.tanggal_lahir || '-',
    jenis_kelamin: user?.jenis_kelamin || appointments[0]?.jenis_kelamin || '-',
    nomor_bpjs: user?.nomor_bpjs || appointments[0]?.nomor_bpjs || '-',
    no_rm: user?.no_rekam_medis || '-',
    no_hp: user?.nomor_hp || appointments[0]?.nomor_hp || '-',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Rekam Medis</h2>
      
      {/* A. BIODATA (AUTO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">A. BIODATA PASIEN</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div><span className="text-slate-500 block mb-1">Nama Lengkap</span> <span className="font-semibold text-slate-900">{biodata.nama}</span></div>
          <div><span className="text-slate-500 block mb-1">NIK</span> <span className="font-semibold text-slate-900">{biodata.nik}</span></div>
          <div><span className="text-slate-500 block mb-1">Tanggal Lahir</span> <span className="font-semibold text-slate-900">{biodata.tanggal_lahir}</span></div>
          <div><span className="text-slate-500 block mb-1">Jenis Kelamin</span> <span className="font-semibold text-slate-900">{biodata.jenis_kelamin}</span></div>
          <div><span className="text-slate-500 block mb-1">Nomor BPJS</span> <span className="font-semibold text-slate-900">{biodata.nomor_bpjs}</span></div>
          <div><span className="text-slate-500 block mb-1">No. Rekam Medis (RM)</span> <span className="font-semibold text-slate-900">{biodata.no_rm}</span></div>
          <div><span className="text-slate-500 block mb-1">No. HP</span> <span className="font-semibold text-slate-900">{biodata.no_hp}</span></div>
        </div>
      </div>

      {/* B. RIWAYAT MEDIS (TIMELINE) */}
      <h3 className="text-lg font-bold text-slate-800 mb-4">B. RIWAYAT MEDIS</h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {completedAppointments.map((item, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <Activity size={16} />
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-200 transition-colors cursor-pointer" onClick={() => handleExpand(item.id_booking)}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                  <Calendar size={12} className="mr-1" /> {item.tanggal_kunjungan}
                </div>
                <span className="text-xs font-mono text-slate-400">{item.id_booking}</span>
              </div>
              
              <h4 className="font-bold text-slate-900 text-base">{item.poli}</h4>
              <p className="text-sm text-slate-600 font-medium flex items-center mt-1">
                <Stethoscope size={14} className="mr-1.5 text-slate-400" /> {item.dokter}
              </p>

              <AnimatePresence>
                {expandedId === item.id_booking && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100 pt-4 mt-4 space-y-4"
                  >
                    <div>
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Keluhan</h6>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {loadingRecords[item.id_booking] ? 'Memuat...' : (medicalRecords[item.id_booking]?.keluhan || '-')}
                      </p>
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pemeriksaan</h6>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {loadingRecords[item.id_booking] ? 'Memuat...' : (medicalRecords[item.id_booking]?.pemeriksaan || '-')}
                      </p>
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Diagnosa</h6>
                      <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {loadingRecords[item.id_booking] ? 'Memuat...' : (
                          medicalRecords[item.id_booking]?.diagnosa ? (
                            Array.isArray(medicalRecords[item.id_booking].diagnosa) ? (
                              <div className="flex flex-wrap gap-2">
                                {medicalRecords[item.id_booking].diagnosa.map((d: any, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">
                                    {d.code === 'Custom' ? d.name : `${d.code} - ${d.name}`}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              medicalRecords[item.id_booking].diagnosa
                            )
                          ) : '-'
                        )}
                      </div>
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tindakan</h6>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {loadingRecords[item.id_booking] ? 'Memuat...' : (medicalRecords[item.id_booking]?.tindakan || '-')}
                      </p>
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Obat / Resep</h6>
                      <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {loadingRecords[item.id_booking] ? 'Memuat...' : (
                          medicalRecords[item.id_booking]?.resep && medicalRecords[item.id_booking].resep.length > 0 ? (
                            <div className="space-y-2">
                              {medicalRecords[item.id_booking].resep.map((r: any, i: number) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                                  <div className="font-medium text-slate-900">{r.nama_obat}</div>
                                  <div className="text-xs text-slate-500 mt-1 sm:mt-0 flex flex-wrap gap-2">
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">{r.dosis}</span>
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{r.frekuensi}</span>
                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">{r.durasi}</span>
                                    <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md">{r.cara_pakai}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : '-'
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {expandedId !== item.id_booking && (
                <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center">
                  Lihat Detail <ChevronRight size={14} className="ml-0.5" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {completedAppointments.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-2xl border-dashed">
            Belum ada riwayat medis.
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CekAntrian({ appointments, allAppointments, onRefresh }: { appointments: any[], allAppointments: any[], onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<any>(null);

  const prevServingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (appointments.length > 0 && !result) {
      setResult(appointments[0]);
    }
  }, [appointments]);

  useEffect(() => {
    // Automatic TTS trigger removed to comply with WebView autoplay restrictions
    // and prevent blank screen issues.
    prevServingRef.current = new Set(allAppointments.filter(a => a.status_antrian === 'Sedang Dilayani').map(a => a.id_booking));
  }, []); // Only run once on mount to initialize the ref


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search) {
      const found = allAppointments.find((a: any) => 
        a.id_booking === search || 
        a.nik === search || 
        a.nomor_antrian === search || 
        a.nama_pasien?.toLowerCase().includes(search.toLowerCase())
      );
      if (found) {
        setResult(found);
      } else {
        setErrorMsg('Data tidak ditemukan');
      }
    }
  };

  let sedangDilayani = '-';
  let sisaAntrian = 0;
  
  if (result) {
    const poliAppointments = allAppointments.filter(a => a.poli === result.poli && a.tanggal_kunjungan === result.tanggal_kunjungan);
    const serving = poliAppointments.find(a => a.status_antrian === 'Sedang Dilayani');
    if (serving) {
      sedangDilayani = serving.nomor_antrian;
    }
    
    // Sisa antrian: count of 'Menunggu' before this user's appointment
    // Assuming appointments are sorted by time or ID
    const waiting = poliAppointments.filter(a => a.status_antrian === 'Menunggu');
    const myIndex = waiting.findIndex(a => a.id_booking === result.id_booking);
    sisaAntrian = myIndex >= 0 ? myIndex : 0;
  }

  const getStatusColor = (status: string) => {
    if (status === 'Sedang Dilayani') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status === 'Selesai') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Dibatalkan') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'Belum Check-In') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-amber-100 text-amber-700 border-amber-200'; // Menunggu
  };

  const getStatusColorDot = (status: string) => {
    if (status === 'Sedang Dilayani') return 'bg-blue-500';
    if (status === 'Selesai') return 'bg-emerald-500';
    if (status === 'Dibatalkan') return 'bg-red-500';
    if (status === 'Belum Check-In') return 'bg-slate-500';
    return 'bg-amber-500'; // Menunggu
  };

  const handleSimulateCheckIn = async () => {
    if (result) {
      try {
        await updateAppointmentStatusDB(result.id_booking, 'Menunggu');
        setResult({ ...result, status_antrian: 'Menunggu' });
        // Refresh all appointments
        onRefresh();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handlePlaySound = (item: any) => {
    if (!('speechSynthesis' in window)) {
      console.log('TTS tidak didukung di device ini');
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      
      const formatNomorAntrian = (nomor: string) => {
        if (!nomor) return '';
        const digitMap: { [key: string]: string } = {
          '0': 'nol', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat',
          '5': 'lima', '6': 'enam', '7': 'tujuh', '8': 'delapan', '9': 'sembilan'
        };
        return nomor.replace(/[^a-zA-Z0-9]/g, '').split('').map(char => {
          return digitMap[char] || char;
        }).join(' ');
      };

      const nomorSpelled = formatNomorAntrian(item.nomor_antrian);
      const poliText = item.poli.toLowerCase().includes('poli') ? item.poli : `Poli ${item.poli}`;
      
      let text = `Nomor Antrian, ${nomorSpelled}, `;
      if (item.nama_pasien) {
        text += `${item.nama_pasien}, `;
      }
      text += `Silakan Menuju, ${poliText}.`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang === 'id-ID' && v.name.toLowerCase().includes('female')) || 
                      voices.find(v => v.lang === 'id-ID');
      if (idVoice) {
        utterance.voice = idVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing TTS:', error);
    }
  };

  const currentlyServingAll = allAppointments.filter(a => a.status_antrian === 'Sedang Dilayani');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 space-y-8">
      {errorMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Pemberitahuan</h3>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-medium hover:bg-emerald-700">Tutup</button>
          </div>
        </div>
      )}

      {/* Display Antrian Digital */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10">
          <h3 className="text-xl md:text-2xl font-bold mb-6 flex items-center">
            <MonitorPlay className="mr-3 text-blue-400" />
            Display Antrian Digital Rumah Sakit
          </h3>
          
          {currentlyServingAll.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyServingAll.map(app => (
                <div key={app.id_booking} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">Nomor Antrian</p>
                      <h4 className="text-4xl font-bold text-white tracking-wider">{app.nomor_antrian}</h4>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold animate-pulse">
                      Sedang Dilayani
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-slate-300">
                      <Stethoscope size={16} className="mr-2 text-emerald-400" />
                      <span className="text-sm">{app.poli}</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <User size={16} className="mr-2 text-emerald-400" />
                      <span className="text-sm">{app.dokter}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-slate-400">Belum ada antrian yang sedang dilayani saat ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cek Status Antrian Saya */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Cek Status Antrian Saya</h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <FloatingInput
              label="Nomor Antrian atau Kode Pendaftaran"
              type="text"
              icon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="px-6 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center h-[52px]">
            <Search size={20} className="mr-2" /> Cari
          </button>
        </form>

        {result && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-slate-100">
              <div>
                <p className="text-sm text-slate-500 mb-1">Nomor Antrian Anda</p>
                <div className="flex items-center gap-4">
                  <h3 className="text-4xl md:text-5xl font-bold text-emerald-600 tracking-wider">{result.nomor_antrian}</h3>
                  {result.status_antrian === 'Sedang Dilayani' && (
                    <button 
                      onClick={() => handlePlaySound(result)}
                      className="p-3 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors"
                      title="Putar Suara Panggilan"
                    >
                      <Volume2 size={24} />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm text-slate-500 mb-2">Status Saat Ini</p>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(result.status_antrian)}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColorDot(result.status_antrian)}`}></span>
                  {result.status_antrian}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Antrian Saat Ini</p>
                <p className="text-2xl font-bold text-slate-900">{sedangDilayani}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Sisa Antrian</p>
                <p className="text-2xl font-bold text-slate-900">{sisaAntrian} <span className="text-sm font-normal text-slate-500">Orang</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Estimasi Waktu</p>
                <p className="text-2xl font-bold text-slate-900">{sisaAntrian * 10} <span className="text-sm font-normal text-slate-500">Menit</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-slate-500">Poliklinik</span>
                <span className="font-bold text-slate-900">{result.poli}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-slate-500">Dokter</span>
                <span className="font-bold text-slate-900">{result.dokter}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-slate-500">Waktu Kunjungan</span>
                <span className="font-bold text-slate-900">{result.tanggal_kunjungan} • {result.time}</span>
              </div>
            </div>

            {result.status_antrian === 'Belum Check-In' && (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                  <p className="text-sm text-emerald-800 mb-4">Silakan lakukan Check-In saat tiba di rumah sakit untuk mengaktifkan antrian Anda.</p>
                  <button 
                    onClick={handleSimulateCheckIn}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Simulasi Scan QR (Check-In)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function JadwalDokter({ jadwalDokter, poliklinikList, doctorsList }: { jadwalDokter: any[], poliklinikList: any[], doctorsList?: any[] }) {
  const [selectedPoli, setSelectedPoli] = useState<string>('Semua');

  const getSchedules = (curr: any) => {
    if (curr.schedules && Array.isArray(curr.schedules) && curr.schedules.length > 0) {
      return curr.schedules.map((s: any) => ({
        hari: s.hari_praktek,
        jam_mulai: s.jam_mulai,
        jam_selesai: s.jam_selesai,
        kuota_harian: s.kuota_harian
      }));
    }
    
    const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const result: { hari: string, jam_mulai: string, jam_selesai: string, kuota_harian: number }[] = [];
    const hp = (curr.hari_praktek || '').toLowerCase();
    const jam_mulai = curr.jam_mulai;
    const jam_selesai = curr.jam_selesai;
    const kuota_harian = curr.kuota_harian || 30;
    
    if (hp.includes('-')) {
      const parts = hp.split('-').map((p: string) => p.trim());
      const startIdx = daysMap.findIndex(d => d.toLowerCase() === parts[0]);
      const endIdx = daysMap.findIndex(d => d.toLowerCase() === parts[1]);
      if (startIdx !== -1 && endIdx !== -1) {
        for (let i = startIdx; i <= endIdx; i++) {
          result.push({ hari: daysMap[i], jam_mulai, jam_selesai, kuota_harian });
        }
      }
    } else {
      const days = hp.split(/,|dan/).map((p: string) => p.trim());
      days.forEach((d: string) => {
        const found = daysMap.find(dm => dm.toLowerCase() === d);
        if (found) {
          result.push({ hari: found, jam_mulai, jam_selesai, kuota_harian });
        }
      });
    }
    return result;
  };

  // Consolidate schedules by doctor
  const consolidatedSchedules = jadwalDokter.reduce((acc: any[], curr: any) => {
    const existing = acc.find(item => item.nama_dokter === curr.nama_dokter && item.poli === curr.poli);
    const parsedSchedules = getSchedules(curr);
    
    if (existing) {
      existing.schedules.push(...parsedSchedules);
    } else {
      acc.push({
        ...curr,
        schedules: parsedSchedules
      });
    }
    return acc;
  }, []);

  const filteredSchedules = selectedPoli === 'Semua' 
    ? consolidatedSchedules 
    : consolidatedSchedules.filter(doc => doc.poli === selectedPoli);

  const availablePolis = ['Semua', ...poliklinikList
    .filter(p => jadwalDokter.some(d => d.poli === p.nama_poli))
    .sort((a, b) => {
      const aIsPenunjang = a.nama_poli.toLowerCase().includes('patologi') || a.nama_poli.toLowerCase().includes('radiologi');
      const bIsPenunjang = b.nama_poli.toLowerCase().includes('patologi') || b.nama_poli.toLowerCase().includes('radiologi');
      if (aIsPenunjang && !bIsPenunjang) return 1;
      if (!aIsPenunjang && bIsPenunjang) return -1;
      return 0;
    })
    .map(p => p.nama_poli)];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Jadwal Dokter</h2>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {availablePolis.map(poli => (
            <button
              key={poli}
              onClick={() => setSelectedPoli(poli)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedPoli === poli
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-500'
              }`}
            >
              {poli}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map(doc => {
            let doctorInfo = doctorsList && doctorsList.length > 0 ? doctorsList.find(d => d.nama_dokter === doc.nama_dokter || d.nama_dokter.split(',')[0].trim() === doc.nama_dokter.split(',')[0].trim()) : undefined;
            if (!doctorInfo) {
              doctorInfo = DOCTORS.find(d => d.name === doc.nama_dokter || d.name.split(',')[0].trim() === doc.nama_dokter.split(',')[0].trim());
            }
            
            if (doctorInfo?.status_aktif === 'Tidak Aktif') {
              return null;
            }
            
            const imageUrl = doctorInfo?.foto_dokter || doctorInfo?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.nama_dokter || 'Doctor')}&background=10b981&color=fff`;
            const formattedSchedules = formatScheduleDisplay(doc.schedules);
            
            return (
            <div key={`${doc.id}-${doc.poli}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-4">
              <img src={imageUrl} alt={doc.nama_dokter} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div>
                <h4 className="font-bold text-slate-900">{doc.nama_dokter}</h4>
                <p className="text-sm text-emerald-600 font-medium mb-3">{doc.poli}</p>
                
                {checkIsCuti([doc]) ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-amber-800 font-medium">Dokter sedang cuti</p>
                    {doc.tanggal_mulai_cuti && doc.tanggal_selesai_cuti && (
                      <p className="text-xs text-amber-700 mt-1">
                        {new Date(doc.tanggal_mulai_cuti).toLocaleDateString('id-ID')} s/d {new Date(doc.tanggal_selesai_cuti).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 space-y-2">
                    {formattedSchedules.map((s: any, idx: number) => (
                      <div key={idx} className="flex flex-col">
                        <span className="font-bold text-slate-700">{s.daysStr}</span>
                        <div className="flex items-center text-slate-500 text-xs mt-0.5">
                          <Clock size={12} className="mr-1" />
                          {s.jam_mulai} - {s.jam_selesai}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">Tidak ada jadwal dokter untuk poliklinik ini.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
