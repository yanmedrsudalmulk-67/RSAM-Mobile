import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Calendar, 
  Clock, 
  History, 
  FileText, 
  User, 
  ChevronRight, 
  Bell, 
  Search,
  Activity,
  LogOut,
  CreditCard,
  MapPin,
  Phone,
  Stethoscope,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PatientPortalProps {
  user: any;
  onLogout: () => void;
}

export default function PatientPortal({ user, onLogout }: PatientPortalProps) {
  const [activeTab, setActiveTab] = useState('beranda');
  const [patientData, setPatientData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [poliklinik, setPoliklinik] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bookingStep, setBookingStep] = useState(1); // 1: Poli, 2: Dokter, 3: Jadwal, 4: Konfirmasi
  const [selectedPoli, setSelectedPoli] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch patient profile
        const { data: profile, error: profileError } = await supabase
          .from('pasien')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        setPatientData(profile);
        setProfileForm(profile);

        // Fetch bookings
        const { data: bookingData, error: bookingError } = await supabase
          .from('booking_kunjungan')
          .select('*')
          .or(`nik.eq.${profile.nik},patient_id.eq.${profile.id}`)
          .order('tanggal_kunjungan', { ascending: false });

        if (bookingError) throw bookingError;
        setBookings(bookingData);

        // Fetch medical records
        const { data: recordData, error: recordError } = await supabase
          .from('rekam_medis')
          .select('*')
          .eq('patient_id', profile.id)
          .order('tanggal_kunjungan', { ascending: false });

        if (recordError) throw recordError;
        setMedicalRecords(recordData);

        // Fetch Poliklinik
        const { data: poliData } = await supabase.from('poliklinik').select('*').order('nama', { ascending: true });
        setPoliklinik(poliData || []);

        // Fetch Doctors
        const { data: docData } = await supabase.from('dokter').select('*').order('nama', { ascending: true });
        setDoctors(docData || []);

      } catch (err) {
        console.error('Error fetching patient data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const handleBookingSubmit = async () => {
    if (!patientData || !selectedPoli || !selectedDoctor || !selectedDate || !selectedTime) return;
    
    setIsSubmittingBooking(true);
    try {
      const id_booking = `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_booking,
          patient_id: patientData.id,
          nama_pasien: patientData.nama_pasien,
          nik: patientData.nik,
          tanggal_lahir: patientData.tanggal_lahir,
          jenis_kelamin: patientData.jenis_kelamin || 'Laki-Laki',
          nomor_hp: patientData.no_hp,
          alamat: patientData.alamat,
          poli: selectedPoli.nama,
          dokter: selectedDoctor.nama,
          tanggal_kunjungan: selectedDate,
          time: selectedTime,
          status_antrian: 'Menunggu',
          jenis_jaminan: patientData.jenis_jaminan || 'UMUM',
          nomor_bpjs: patientData.nomor_bpjs || ''
        })
      });
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      setBookingSuccess(result);
      setBookingStep(4);
      
      // Refresh bookings
      const { data: newBookings } = await supabase
        .from('booking_kunjungan')
        .select('*')
        .eq('nik', patientData.nik)
        .order('tanggal_kunjungan', { ascending: false });
      setBookings(newBookings || []);
      
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert('Gagal melakukan pendaftaran. Silakan coba lagi.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileForm, id: user.id })
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      const result = await response.json();
      setPatientData(result.user);
      setIsEditingProfile(false);
      alert('Profil berhasil diperbarui');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Gagal memperbarui profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingPhoto(true);
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

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        // Update local state
        setPatientData({ ...patientData, foto_profil: result.url });
        alert('Foto profil berhasil diperbarui');
        
        // Reload page to update header photo
        window.location.reload();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Gagal mengunggah foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const navItems = [
    { id: 'beranda', icon: Home, label: 'Beranda' },
    { id: 'daftar', icon: Calendar, label: 'Daftar' },
    { id: 'antrian', icon: Activity, label: 'Antrian' },
    { id: 'riwayat', icon: History, label: 'Riwayat' },
    { id: 'rekam-medis', icon: FileText, label: 'Rekam Medis' },
    { id: 'profil', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <header className="bg-white px-6 pt-8 pb-6 rounded-b-[32px] shadow-sm border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50 overflow-hidden">
              {user.foto_profil ? (
                <img src={user.foto_profil} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Selamat Datang,</p>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {patientData?.nama_pasien || user.email?.split('@')[0]}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button 
              onClick={onLogout}
              className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari layanan, dokter, atau riwayat..." 
            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'beranda' && (
            <motion.div
              key="beranda"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quick Info Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 rounded-[28px] text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                  <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Nomor Rekam Medis</p>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight">
                    {patientData?.no_rm || 'BELUM ADA'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <CreditCard size={14} />
                      <span>NIK: {patientData?.nik || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Booking Section */}
              {bookings.length > 0 && bookings[0].status_antrian !== 'Selesai' && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Antrian Aktif</h3>
                    <button onClick={() => setActiveTab('antrian')} className="text-emerald-600 text-sm font-bold">Lihat Semua</button>
                  </div>
                  <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-emerald-600 border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase">No.</span>
                      <span className="text-xl font-bold leading-none">{bookings[0].nomor_antrian}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{bookings[0].poli}</h4>
                      <p className="text-xs text-slate-500 mb-1">{bookings[0].dokter}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">
                          {bookings[0].status_antrian}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock size={10} /> {bookings[0].time}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300" size={20} />
                  </div>
                </section>
              )}

              {/* Quick Actions */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Layanan Cepat</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { id: 'daftar', icon: Calendar, label: 'Daftar', color: 'bg-blue-50 text-blue-600' },
                    { id: 'antrian', icon: Activity, label: 'Antrian', color: 'bg-amber-50 text-amber-600' },
                    { id: 'rekam-medis', icon: FileText, label: 'RM', color: 'bg-purple-50 text-purple-600' },
                    { id: 'riwayat', icon: History, label: 'Riwayat', color: 'bg-rose-50 text-rose-600' },
                  ].map((action) => (
                    <button 
                      key={action.id}
                      onClick={() => setActiveTab(action.id)}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-sm transition-transform active:scale-95`}>
                        <action.icon size={24} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Recent Medical Records */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Rekam Medis Terakhir</h3>
                  <button onClick={() => setActiveTab('rekam-medis')} className="text-emerald-600 text-sm font-bold">Semua</button>
                </div>
                <div className="space-y-3">
                  {medicalRecords.length > 0 ? (
                    medicalRecords.slice(0, 2).map((record) => (
                      <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            {record.tanggal_kunjungan}
                          </span>
                          <FileText size={16} className="text-slate-300" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">Diagnosa: {record.diagnosa}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Keluhan: {record.keluhan}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center">
                      <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-sm text-slate-500 font-medium">Belum ada rekam medis</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'daftar' && (
            <motion.div
              key="daftar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-slate-900">Pendaftaran Online</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((s) => (
                    <div 
                      key={s} 
                      className={`w-6 h-1.5 rounded-full transition-all ${bookingStep >= s ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    ></div>
                  ))}
                </div>
              </div>

              {bookingStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 font-medium">Pilih Poliklinik Tujuan</p>
                  <div className="grid grid-cols-2 gap-4">
                    {poliklinik.map((poli) => (
                      <button
                        key={poli.id}
                        onClick={() => {
                          setSelectedPoli(poli);
                          setBookingStep(2);
                        }}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-emerald-500 transition-all active:scale-95"
                      >
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <Stethoscope size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 text-center">{poli.nama}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setBookingStep(1)} className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      <ChevronRight className="rotate-180" size={16} />
                    </button>
                    <p className="text-sm text-slate-500 font-medium">Pilih Dokter Spesialis</p>
                  </div>
                  <div className="space-y-3">
                    {doctors.filter(d => d.spesialisasi === selectedPoli?.nama).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setBookingStep(3);
                        }}
                        className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-emerald-500 transition-all active:scale-95 text-left"
                      >
                        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
                          {doc.foto ? <img src={doc.foto} className="w-full h-full object-cover" /> : <User size={24} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-sm">{doc.nama}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{doc.spesialisasi}</p>
                        </div>
                        <ChevronRight className="text-slate-300" size={20} />
                      </button>
                    ))}
                    {doctors.filter(d => d.spesialisasi === selectedPoli?.nama).length === 0 && (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-sm text-slate-500">Tidak ada dokter tersedia di poli ini.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setBookingStep(2)} className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      <ChevronRight className="rotate-180" size={16} />
                    </button>
                    <p className="text-sm text-slate-500 font-medium">Pilih Jadwal Kunjungan</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Tanggal</label>
                      <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Jam</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '19:00'].map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                              selectedTime === time 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
                                : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleBookingSubmit}
                        disabled={!selectedDate || !selectedTime || isSubmittingBooking}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center"
                      >
                        {isSubmittingBooking ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'Konfirmasi Pendaftaran'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 4 && bookingSuccess && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                    <CheckCircle2 size={48} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil!</h4>
                    <p className="text-sm text-slate-500 px-6">
                      Nomor antrian Anda telah diterbitkan. Silakan datang tepat waktu sesuai jadwal.
                    </p>
                  </div>
                  
                  <div className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nomor Antrian</p>
                        <p className="text-3xl font-mono font-bold text-emerald-600">{bookingSuccess.nomor_antrian}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Booking</p>
                        <p className="text-sm font-mono font-bold text-slate-900">{bookingSuccess.id_booking}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Poli</p>
                        <p className="text-xs font-bold text-slate-900">{bookingSuccess.poli}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dokter</p>
                        <p className="text-xs font-bold text-slate-900">{bookingSuccess.dokter}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</p>
                        <p className="text-xs font-bold text-slate-900">{bookingSuccess.tanggal_kunjungan}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam</p>
                        <p className="text-xs font-bold text-slate-900">{bookingSuccess.time}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTab('antrian');
                      setBookingStep(1);
                      setBookingSuccess(null);
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                  >
                    Lihat Antrian Saya
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'antrian' && (
            <motion.div
              key="antrian"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Antrian Aktif</h3>
              {bookings.filter(b => b.status_antrian !== 'Selesai' && b.status_antrian !== 'Dibatalkan').length > 0 ? (
                bookings.filter(b => b.status_antrian !== 'Selesai' && b.status_antrian !== 'Dibatalkan').map((booking) => (
                  <div key={booking.id_booking} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{booking.poli}</h4>
                        <p className="text-sm text-slate-500">{booking.dokter}</p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {booking.status_antrian}
                      </span>
                    </div>

                    <div className="flex items-center justify-center py-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Antrian</p>
                        <p className="text-5xl font-mono font-bold text-emerald-600">{booking.nomor_antrian}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</p>
                          <p className="text-xs font-bold text-slate-900">{booking.tanggal_kunjungan}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam</p>
                          <p className="text-xs font-bold text-slate-900">{booking.time}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-2xl text-blue-700">
                        <AlertCircle size={20} />
                        <p className="text-xs font-medium leading-relaxed">
                          Silakan datang 15 menit sebelum jadwal untuk melakukan check-in di loket pendaftaran.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <Activity size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Tidak Ada Antrian Aktif</h4>
                  <p className="text-sm text-slate-500 max-w-[200px]">Anda belum memiliki jadwal kunjungan aktif saat ini.</p>
                  <button 
                    onClick={() => setActiveTab('daftar')}
                    className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100"
                  >
                    Daftar Sekarang
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'riwayat' && (
            <motion.div
              key="riwayat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Riwayat Kunjungan</h3>
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id_booking} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      booking.status_antrian === 'Selesai' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {booking.status_antrian === 'Selesai' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 text-sm">{booking.poli}</h4>
                        <span className="text-[10px] font-bold text-slate-400">{booking.tanggal_kunjungan}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{booking.dokter}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        booking.status_antrian === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status_antrian === 'Dibatalkan' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.status_antrian}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <History size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Riwayat</h4>
                  <p className="text-sm text-slate-500">Riwayat kunjungan Anda akan muncul di sini.</p>
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'rekam-medis' && (
            <motion.div
              key="rekam-medis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Riwayat Rekam Medis</h3>
              {medicalRecords.length > 0 ? (
                medicalRecords.map((record) => (
                  <div key={record.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{record.tanggal_kunjungan}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Kunjungan Medis</p>
                        </div>
                      </div>
                      <button className="text-emerald-600">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Diagnosa</p>
                        <p className="text-sm font-bold text-slate-900">{record.diagnosa}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Keluhan</p>
                        <p className="text-sm text-slate-700">{record.keluhan}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Obat & Tindakan</p>
                        <p className="text-sm text-slate-700">{record.obat || record.tindakan || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <FileText size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Rekam Medis</h4>
                  <p className="text-sm text-slate-500 max-w-[200px]">Data rekam medis Anda akan muncul di sini setelah kunjungan.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profil' && (
            <motion.div
              key="profil"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-4">
                  <div className="w-28 h-28 bg-emerald-100 rounded-[32px] flex items-center justify-center text-emerald-600 shadow-xl border-4 border-white overflow-hidden">
                    {patientData?.foto_profil || user.foto_profil ? (
                      <img src={patientData?.foto_profil || user.foto_profil} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} />
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-emerald-600 border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                    <Activity size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  </label>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{patientData?.nama_pasien}</h3>
                <p className="text-sm text-slate-500 font-medium">No. RM: {patientData?.no_rm || '-'}</p>
              </div>

              <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-slate-900">Informasi Pribadi</h4>
                    {!isEditingProfile ? (
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="text-emerald-600 text-sm font-bold flex items-center gap-1"
                      >
                        Edit Profil
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="text-slate-400 text-sm font-bold"
                        >
                          Batal
                        </button>
                        <button 
                          onClick={handleUpdateProfile}
                          disabled={isUpdatingProfile}
                          className="text-emerald-600 text-sm font-bold"
                        >
                          {isUpdatingProfile ? '...' : 'Simpan'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                          <input 
                            type="text" 
                            value={profileForm.nama_pasien}
                            onChange={(e) => setProfileForm({...profileForm, nama_pasien: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NIK</label>
                          <input 
                            type="text" 
                            value={profileForm.nik}
                            onChange={(e) => setProfileForm({...profileForm, nik: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Lahir</label>
                          <input 
                            type="date" 
                            value={profileForm.tanggal_lahir}
                            onChange={(e) => setProfileForm({...profileForm, tanggal_lahir: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No. Telepon</label>
                          <input 
                            type="text" 
                            value={profileForm.no_hp}
                            onChange={(e) => setProfileForm({...profileForm, no_hp: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat</label>
                          <textarea 
                            value={profileForm.alamat}
                            onChange={(e) => setProfileForm({...profileForm, alamat: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <ProfileItem icon={<CreditCard size={20} />} label="NIK" value={patientData?.nik} />
                        <ProfileItem icon={<Calendar size={20} />} label="Tanggal Lahir" value={patientData?.tanggal_lahir} />
                        <ProfileItem icon={<Phone size={20} />} label="No. Telepon" value={patientData?.no_hp} />
                        <ProfileItem icon={<MapPin size={20} />} label="Alamat" value={patientData?.alamat} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={onLogout}
                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <LogOut size={20} />
                Keluar dari Akun
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-4 py-3 flex justify-around items-center z-40">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-50' : ''}`}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value || '-'}</p>
      </div>
    </div>
  );
}
