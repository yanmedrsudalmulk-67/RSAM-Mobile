import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft,
  Calendar,
  Activity,
  FileText,
  Stethoscope,
  Clock,
  Settings,
  Plus,
  Minus,
  CheckCircle,
  Save,
  Users,
  Trash2,
  Edit,
  Volume,
  Volume2,
  VolumeX,
  Eye,
  User,
  X,
  Monitor,
  Menu,
  SkipForward,
  PieChart as PieChartIcon,
  Upload,
  Image,
  Hospital,
  ClipboardList,
  BarChart2,
  Pill,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Select from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { DisplayTV } from './DisplayTV';
import { LogoFooterManagement } from './LogoFooterManagement';
import { SosialMediaManagement } from './SosialMediaManagement';
import { DokterManagement } from './DokterManagement';
import ChartModal from './ChartModal';
import { SiteAssetEditor } from './SiteAssetEditor';
import { 
  getAppointmentsDB, 
  updateAppointmentStatusDB,
  updateMedicalRecordDB,
  getMedicalRecordDB,
  getDiagnosaDB,
  getObatDB,
  getVaccineStocksDB, 
  getEIcvStockDB, 
  saveVaccineStocksDB, 
  saveEIcvStockDB,
  getPoliklinikDB,
  savePoliklinikDB,
  updatePoliklinikDB,
  getDokterDB,
  saveDokterDB,
  updateDokterDB,
  getJadwalDokterDB,
  saveJadwalDokterDB,
  updateJadwalDokterDB,
  deleteJadwalDokterDB,
  getLaporanBulananDB,
  getPatientsDB,
  updatePatientDB,
  deletePatientDB,
  getArticlesDB,
  saveArticleDB,
  updateArticleDB,
  deleteArticleDB,
  uploadArticleImageDB,
  getArticleStatsDB
} from '../db';
import { supabase } from '../lib/supabase';

export default function Dashboard({ onBack, assets }: { onBack: () => void, assets: Record<string, string> }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeChartModal, setActiveChartModal] = useState<'bar' | 'pie' | 'line' | null>(null);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // today, week, month, custom
  const [customDate, setCustomDate] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [activePatientTab, setActivePatientTab] = useState<'detail' | 'rekam-medis'>('detail');
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    keluhan: '',
    pemeriksaan: '',
    diagnosa: '',
    tindakan: '',
    resep: ''
  });
  const [isSavingMedicalRecord, setIsSavingMedicalRecord] = useState(false);
  const [callingId, setCallingId] = useState<string | null>(null);

  // Fetch initial data and auto refresh every 5 seconds
  useEffect(() => {
    const fetchData = async () => {
      const data = await getAppointmentsDB();
      setAppointments(data);
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (item: any, newStatus: string) => {
    try {
      await updateAppointmentStatusDB(item.id_booking, newStatus);
      
      // Refresh data immediately
      const data = await getAppointmentsDB();
      setAppointments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePanggilAntrian = (item: any) => {
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

    const cleanDoctorName = (name: string) => {
      return name.replace(/dr\.\s*/gi, '').replace(/,\s*(Sp\.[A-Z]+|Umum|Gigi)/gi, '').trim();
    };

    const text = `Nomor antrian ${item.nomor_antrian}, silakan menuju ${item.poli}, dokter ${cleanDoctorName(item.dokter)}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      setCallingId(null);
    };
    
    utterance.onerror = () => {
      setCallingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleDetailPasien = async (item: any) => {
    setSelectedPatient(item);
    setActivePatientTab('detail');
    
    // Fetch medical record
    try {
      const record = await getMedicalRecordDB(item.id_booking);
      let diagnosaString = '';
      if (Array.isArray(record.diagnosa)) {
        diagnosaString = record.diagnosa.map((d: any) => d.code === 'Custom' ? d.name : `${d.code} - ${d.name}`).join(', ');
      } else {
        diagnosaString = record.diagnosa || '';
      }
      
      let resepString = '';
      if (Array.isArray(record.resep)) {
        resepString = record.resep.map((r: any) => `${r.nama_obat} (${r.dosis}, ${r.frekuensi}, ${r.durasi}, ${r.cara_pakai})`).join('\n');
      } else {
        resepString = record.resep || '';
      }
      
      setMedicalRecordForm({
        keluhan: record.keluhan || '',
        pemeriksaan: record.pemeriksaan || '',
        diagnosa: diagnosaString,
        tindakan: record.tindakan || '',
        resep: resepString
      });
    } catch (error) {
      console.error('Error fetching medical record:', error);
      setMedicalRecordForm({
        keluhan: '',
        pemeriksaan: '',
        diagnosa: '',
        tindakan: '',
        resep: ''
      });
    }
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedPatient) return;
    setIsSavingMedicalRecord(true);
    try {
      await updateMedicalRecordDB(selectedPatient.id_booking, medicalRecordForm);
      // Update local state
      const updatedAppointments = appointments.map(app => 
        app.id_booking === selectedPatient.id_booking 
          ? { ...app, ...medicalRecordForm } 
          : app
      );
      setAppointments(updatedAppointments);
      setSelectedPatient({ ...selectedPatient, ...medicalRecordForm });
      alert('Rekam medis berhasil disimpan');
    } catch (error) {
      console.error('Error saving medical record:', error);
      alert('Gagal menyimpan rekam medis');
    } finally {
      setIsSavingMedicalRecord(false);
    }
  };

  const handleShowGrafik = async (type: 'bar' | 'pie' | 'line') => {
    console.log("BUTTON CLICKED:", type);
    setLoadingCharts(true);
    try {
      // Fetch fresh data
      const data = await getAppointmentsDB();
      setAppointments(data);
      console.log("DATA GRAFIK FETCHED:", data.length);
      setActiveChartModal(type);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoadingCharts(false);
    }
  };

  // Filter appointments
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };
  const todayStr = getTodayStr();

  const filteredAppointments = appointments.filter((a: any) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchSearch = !search || 
      a.nama_pasien?.toLowerCase().includes(searchLower) ||
      a.nik?.toLowerCase().includes(searchLower) ||
      a.nomor_hp?.toLowerCase().includes(searchLower) ||
      a.poli?.toLowerCase().includes(searchLower) ||
      a.dokter?.toLowerCase().includes(searchLower) ||
      a.tanggal_kunjungan?.toLowerCase().includes(searchLower) ||
      a.nomor_antrian?.toLowerCase().includes(searchLower);

    // Date filter
    let matchDate = true;
    const apptDateStr = a.tanggal_kunjungan?.split('T')[0];

    if (dateFilter === 'today') {
      matchDate = apptDateStr === todayStr;
    } else if (dateFilter === 'week') {
      const apptDate = new Date(apptDateStr);
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      weekAgo.setHours(0,0,0,0);
      const endOfDay = new Date();
      endOfDay.setHours(23,59,59,999);
      matchDate = apptDate >= weekAgo && apptDate <= endOfDay;
    } else if (dateFilter === 'month') {
      const apptDate = new Date(apptDateStr);
      const now = new Date();
      matchDate = apptDate.getMonth() === now.getMonth() && apptDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'custom' && customDate) {
      matchDate = apptDateStr === customDate;
    }

    return matchSearch && matchDate;
  });

  // Stats
  const totalKunjungan = appointments.filter((a: any) => a.tanggal_kunjungan?.split('T')[0] === todayStr).length;
  const totalBooking = appointments.filter((a: any) => a.waktu_booking?.startsWith(todayStr)).length;
  const pasienSelesai = appointments.filter((a: any) => a.tanggal_kunjungan?.split('T')[0] === todayStr && a.status_antrian === 'Selesai').length;
  const pasienMenunggu = appointments.filter((a: any) => a.tanggal_kunjungan?.split('T')[0] === todayStr && a.status_antrian === 'Menunggu').length;
  const pasienDilayani = appointments.filter((a: any) => a.tanggal_kunjungan?.split('T')[0] === todayStr && a.status_antrian === 'Sedang Dilayani').length;
  const activeQueue = pasienMenunggu + pasienDilayani;

  // Chart Data: Kunjungan Per Poli
  const poliCounts = filteredAppointments.reduce((acc: any, curr: any) => {
    const poliName = curr.poli || 'Lainnya';
    acc[poliName] = (acc[poliName] || 0) + 1;
    return acc;
  }, {});
  const poliChartData = Object.keys(poliCounts).map(key => ({
    name: key.replace('Poli ', ''),
    kunjungan: poliCounts[key]
  })).sort((a, b) => b.kunjungan - a.kunjungan);

  // Chart Data: Pasien per Dokter
  const doctorCounts = filteredAppointments.reduce((acc: any, curr: any) => {
    const docName = curr.dokter || 'Lainnya';
    acc[docName] = (acc[docName] || 0) + 1;
    return acc;
  }, {});
  const doctorChartData = Object.keys(doctorCounts).map(key => ({
    name: key.replace('dr. ', '').split(',')[0].split(' ')[0],
    pasien: doctorCounts[key]
  })).sort((a, b) => b.pasien - a.pasien);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4', '#f97316'];

  // Top 5 Poli
  const top5Poli = [...poliChartData].slice(0, 5);

  // Chart Data: Tren Kunjungan
  // Always show last 7 days if today or week is selected
  const getTrendData = () => {
    const counts: any = {};
    const now = new Date();
    
    // Determine range
    let startDate = new Date();
    if (dateFilter === 'today' || dateFilter === 'week') {
      startDate.setDate(now.getDate() - 6); // Last 7 days including today
    } else if (dateFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === 'custom' && customDate) {
      const d = new Date(customDate);
      startDate = new Date(d);
      startDate.setDate(d.getDate() - 6);
    } else {
      startDate.setDate(now.getDate() - 6);
    }
    startDate.setHours(0,0,0,0);

    // Filter appointments for trend (might be broader than filteredAppointments)
    const relevantAppts = appointments.filter((a: any) => {
      const apptDate = new Date(a.tanggal_kunjungan?.split('T')[0]);
      return apptDate >= startDate && apptDate <= now;
    });

    relevantAppts.forEach((a: any) => {
      const dateStr = a.tanggal_kunjungan?.split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const result = [];
    const iterDate = new Date(startDate);
    
    while (iterDate <= now) {
      const dateStr = iterDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        dayName: days[iterDate.getDay()],
        kunjungan: counts[dateStr] || 0
      });
      iterDate.setDate(iterDate.getDate() + 1);
    }
    return result;
  };

  const trendChartData = getTrendData();

  return (
    <div className="flex h-[100dvh] bg-[#F8F9FB] overflow-hidden font-sans relative w-full">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A1F1C] text-white z-30 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Admin Dashboard</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 h-full bg-gradient-to-b from-[#0F2027] to-[#2C5364] text-white flex flex-col p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-20' : 'md:w-64'} md:m-4 md:rounded-[20px] md:h-[calc(100vh-32px)] shrink-0`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute top-6 -right-3 bg-white text-[#0F2027] rounded-full p-1 shadow-md hover:bg-slate-100 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        
        <div className={`flex flex-col items-center mb-8 mt-4 transition-all duration-300 ${isCollapsed ? 'px-0' : 'px-2'}`}>
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full"></div>
            <img 
              src={assets.logo_main || "/logo-1.jpg"} 
              alt="Hospital" 
              className={`rounded-full border-2 border-white/20 p-0.5 bg-white relative z-10 transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-14 h-14'}`}
              referrerPolicy="no-referrer"
            />
          </div>
          {!isCollapsed && (
            <div className="text-center overflow-hidden">
              <p className="text-xs text-white/70 font-medium mb-0.5">RSUD AL-MULK</p>
              <h3 className="text-sm font-semibold tracking-wide">Monitoring System</h3>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
          <div>
            {!isCollapsed && <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-3 ml-3">Menu Utama</p>}
            <ul className="space-y-2">
              <SidebarItem isCollapsed={isCollapsed} icon={<Hospital size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <SidebarItem isCollapsed={isCollapsed} icon={<FileText size={20} />} label="Rekam Medis" active={activeTab === 'rekam-medis'} onClick={() => { setActiveTab('rekam-medis'); setIsMobileMenuOpen(false); }} />
              <SidebarItem isCollapsed={isCollapsed} icon={<ClipboardList size={20} />} label="Artikel" active={activeTab === 'artikel'} onClick={() => { setActiveTab('artikel'); setIsMobileMenuOpen(false); }} />
              <SidebarItem isCollapsed={isCollapsed} icon={<Monitor size={20} />} label="Display Antrian" active={activeTab === 'display-tv'} onClick={() => { setActiveTab('display-tv'); setIsMobileMenuOpen(false); }} />
              <SidebarItem isCollapsed={isCollapsed} icon={<BarChart2 size={20} />} label="Laporan" active={activeTab === 'laporan'} onClick={() => { setActiveTab('laporan'); setIsMobileMenuOpen(false); }} />
            </ul>
          </div>
          
          <div>
            {!isCollapsed && <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-3 ml-3">Pengaturan</p>}
            <ul className="space-y-2">
              <SidebarDropdown 
                isCollapsed={isCollapsed} 
                icon={<Settings size={20} />} 
                label="Pengaturan" 
                active={['pengaturan', 'logo-footer', 'sosial-media', 'dokter', 'pasien', 'jadwal', 'poliklinik'].includes(activeTab)}
                isOpen={isSettingsOpen}
                onToggle={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setIsSettingsOpen(true);
                  } else {
                    setIsSettingsOpen(!isSettingsOpen);
                  }
                }}
              >
                <SidebarItem isCollapsed={false} icon={<Calendar size={18} />} label="Jadwal Dokter" active={activeTab === 'jadwal'} onClick={() => { setActiveTab('jadwal'); setIsMobileMenuOpen(false); }} />
                <SidebarItem isCollapsed={false} icon={<Activity size={18} />} label="Poliklinik" active={activeTab === 'poliklinik'} onClick={() => { setActiveTab('poliklinik'); setIsMobileMenuOpen(false); }} />
                <SidebarItem isCollapsed={false} icon={<Pill size={18} />} label="Manajemen Stok" active={activeTab === 'pengaturan'} onClick={() => { setActiveTab('pengaturan'); setIsMobileMenuOpen(false); }} />
                <SidebarItem isCollapsed={false} icon={<Image size={18} />} label="Logo Footer" active={activeTab === 'logo-footer'} onClick={() => { setActiveTab('logo-footer'); setIsMobileMenuOpen(false); }} />
                <SidebarItem isCollapsed={false} icon={<Share2 size={18} />} label="Sosial Media" active={activeTab === 'sosial-media'} onClick={() => { setActiveTab('sosial-media'); setIsMobileMenuOpen(false); }} />
                <SidebarItem isCollapsed={false} icon={<Users size={18} />} label="Manajemen Dokter" active={activeTab === 'dokter'} onClick={() => { setActiveTab('dokter'); setIsMobileMenuOpen(false); }} />
                <SidebarItem isCollapsed={false} icon={<User size={18} />} label="Manajemen Pasien" active={activeTab === 'pasien'} onClick={() => { setActiveTab('pasien'); setIsMobileMenuOpen(false); }} />
                <SidebarItem isCollapsed={false} icon={<Image size={18} />} label="Site Assets" active={activeTab === 'site-assets'} onClick={() => { setActiveTab('site-assets'); setIsMobileMenuOpen(false); }} />
              </SidebarDropdown>
            </ul>
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <button 
            onClick={onBack}
            className={`w-full flex items-center h-12 rounded-xl transition-all duration-300 text-white/70 hover:bg-white/10 hover:text-white font-medium ${isCollapsed ? 'justify-center px-0' : 'px-3 space-x-3'}`}
            title="Kembali ke Beranda"
          >
            <LogOut size={20} className={isCollapsed ? 'rotate-180' : ''} />
            {!isCollapsed && <span className="text-sm">Kembali ke Beranda</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 w-full pb-32 md:pb-8">
        {activeTab === 'dashboard' ? (
          <>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Dashboard Monitoring</h2>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari Nama, NIK, Poli..." 
                    className="w-full bg-white border-none rounded-full pl-10 pr-4 py-2.5 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="px-4 py-2.5 bg-white border-none rounded-full shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-700"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  >
                    <option value="today">Hari Ini</option>
                    <option value="week">Minggu Ini</option>
                    <option value="month">Bulan Ini</option>
                    <option value="custom">Custom Tanggal</option>
                  </select>
                  {dateFilter === 'custom' && (
                    <input 
                      type="date" 
                      className="px-4 py-2.5 bg-white border-none rounded-full shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-700"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </header>

            {/* STATISTIK UTAMA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <StatCard title="Total Pasien Hari Ini" value={totalKunjungan} color="blue" icon={Users} />
              <StatCard title="Total Pendaftaran" value={totalBooking} color="purple" icon={Calendar} />
              <StatCard title="Antrian Aktif" value={activeQueue} color="amber" icon={Activity} />
              <StatCard title="Selesai Dilayani" value={pasienSelesai} color="emerald" icon={CheckCircle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-8">
              {/* GRAFIK UTAMA */}
              <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 overflow-hidden relative group">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Grafik Kunjungan Per Poli</h3>
                  <button 
                    onClick={() => handleShowGrafik('bar')} 
                    disabled={loadingCharts}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {loadingCharts && activeChartModal === 'bar' ? '...' : <><Eye size={14} /> Lihat</>}
                  </button>
                </div>
                <div className="h-64 md:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={poliChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="kunjungan" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} isAnimationActive={true} animationDuration={1500}>
                        {poliChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRAFIK PASIEN PER DOKTER */}
              <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 overflow-hidden relative group">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Pasien per Dokter</h3>
                  <button 
                    onClick={() => handleShowGrafik('pie')} 
                    disabled={loadingCharts}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {loadingCharts && activeChartModal === 'pie' ? '...' : <><Eye size={14} /> Lihat</>}
                  </button>
                </div>
                <div className="h-64 md:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={doctorChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="pasien"
                      >
                        {doctorChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* GRAFIK KEDUA */}
            <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 mb-8 overflow-hidden relative group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Tren Kunjungan Pasien</h3>
                <button 
                  onClick={() => handleShowGrafik('line')} 
                  disabled={loadingCharts}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {loadingCharts && activeChartModal === 'line' ? '...' : <><Eye size={14} /> Lihat</>}
                </button>
              </div>
              <div className="h-64 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="kunjungan" stroke="#10b981" strokeWidth={4} dot={{r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} isAnimationActive={true} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABEL MONITORING */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Monitoring Kunjungan Pasien</h3>
                <div className="flex items-center text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Update
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-xl">No</th>
                      <th className="px-6 py-4">Informasi Pasien</th>
                      <th className="px-6 py-4">Poli & Dokter</th>
                      <th className="px-6 py-4">Jadwal</th>
                      <th className="px-6 py-4 text-center">Antrian</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center rounded-tr-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((item: any, index: number) => (
                      <tr key={item.id_booking} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-medium">{index + 1}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-base">{item.nama_pasien || 'Pasien'}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">NIK: {item.nik || '-'}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">ID: {item.id_booking}</p>
                          {item.jenis_jaminan && (
                            <p className="text-[10px] text-slate-500 font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                              {item.jenis_jaminan === 'BPJS' ? 'BPJS Kesehatan' : item.jenis_jaminan} {item.jenis_jaminan === 'BPJS' && item.nomor_bpjs ? `(${item.nomor_bpjs})` : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-emerald-700">{item.poli}</p>
                          <p className="text-xs text-slate-600 mt-1">{item.dokter}</p>
                          {item.jenis_vaksin && item.jenis_vaksin.length > 0 && (
                            <p className="text-[10px] text-slate-500 font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                              {item.jenis_vaksin.join(', ')}
                            </p>
                          )}
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
                          <select 
                            value={item.status_antrian}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider outline-none cursor-pointer border-r-8 border-transparent shadow-sm ${
                              item.status_antrian === 'Belum Check-In' ? 'bg-slate-100 text-slate-700' :
                              item.status_antrian === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                              item.status_antrian === 'Sedang Dilayani' ? 'bg-blue-100 text-blue-700' :
                              item.status_antrian === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 
                              item.status_antrian === 'Dilewati' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <option value="Belum Check-In">⚪ Belum Check-In</option>
                            <option value="Menunggu">🟡 Menunggu</option>
                            <option value="Sedang Dilayani">🔵 Sedang Dilayani</option>
                            <option value="Dilewati">🟣 Dilewati</option>
                            <option value="Selesai">🟢 Selesai</option>
                            <option value="Dibatalkan">🔴 Dibatalkan</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handlePanggilAntrian(item)}
                              className={`p-2 rounded-lg transition-all relative overflow-hidden group ${
                                callingId === item.id_booking 
                                  ? 'bg-emerald-100 text-emerald-600 hover:bg-red-100 hover:text-red-600 shadow-inner' 
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
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
                                <Volume2 size={18} />
                              )}
                            </button>
                            <button 
                              onClick={() => handleStatusChange(item, 'Dilewati')}
                              className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors border border-amber-100"
                              title="Lewati"
                            >
                              <SkipForward size={18} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(item, 'Selesai')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                              title="Selesai"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleDetailPasien(item)}
                              className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
                              title="Lihat Detail"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAppointments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                          Tidak ada data kunjungan yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* RIWAYAT PENDAFTARAN TERBARU */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Pendaftaran Terakhir</h3>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((item: any) => (
                    <div key={item.id_booking} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                          <Activity size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.nama_pasien || 'Pasien'}</p>
                          <div className="flex flex-wrap items-center text-xs text-slate-500 mt-1 gap-2">
                            <span className="font-medium text-emerald-600">{item.poli}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center"><Calendar size={12} className="mr-1" /> {item.tanggal_kunjungan}</span>
                            {item.time && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center"><Clock size={12} className="mr-1" /> {item.time}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status_antrian === 'Belum Check-In' ? 'bg-slate-100 text-slate-700' :
                          item.status_antrian === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                          item.status_antrian === 'Sedang Dilayani' ? 'bg-blue-100 text-blue-700' :
                          item.status_antrian === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 
                          item.status_antrian === 'Dilewati' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status_antrian}
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-400 sm:mt-2">{item.id_booking}</p>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-4">Belum ada riwayat pendaftaran.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'display-tv' ? (
          <DisplayTV />
        ) : activeTab === 'rekam-medis' ? (
          <RekamMedisView />
        ) : activeTab === 'pengaturan' ? (
          <SettingsView />
        ) : activeTab === 'jadwal' ? (
          <JadwalView />
        ) : activeTab === 'laporan' ? (
          <LaporanView />
        ) : activeTab === 'poliklinik' ? (
          <PoliklinikView />
        ) : activeTab === 'pasien' ? (
          <PasienView />
        ) : activeTab === 'dokter' ? (
          <DokterManagement />
        ) : activeTab === 'artikel' ? (
          <ArtikelView />
        ) : activeTab === 'logo-footer' ? (
          <LogoFooterManagement />
        ) : activeTab === 'sosial-media' ? (
          <SosialMediaManagement />
        ) : activeTab === 'site-assets' ? (
          <SiteAssetEditor />
        ) : null}
      </main>

      <ChartModal 
        isOpen={activeChartModal === 'bar'} 
        onClose={() => setActiveChartModal(null)} 
        title="Grafik Kunjungan Per Poli" 
        type="bar" 
        data={poliChartData} 
        dataKey="kunjungan" 
        nameKey="name" 
        totalInfo={`Total Kunjungan: ${poliChartData.reduce((acc, curr) => acc + curr.kunjungan, 0)}`}
      />
      <ChartModal 
        isOpen={activeChartModal === 'pie'} 
        onClose={() => setActiveChartModal(null)} 
        title="Pasien per Dokter" 
        type="pie" 
        data={doctorChartData} 
        dataKey="pasien" 
        nameKey="name" 
        totalInfo={`Total Pasien: ${doctorChartData.reduce((acc, curr) => acc + curr.pasien, 0)}`}
      />
      <ChartModal 
        isOpen={activeChartModal === 'line'} 
        onClose={() => setActiveChartModal(null)} 
        title="Tren Kunjungan Pasien" 
        type="line" 
        data={trendChartData} 
        dataKey="kunjungan" 
        nameKey="dayName" 
        totalInfo={`Total Kunjungan: ${trendChartData.reduce((acc, curr) => acc + curr.kunjungan, 0)}`}
      />

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
              
              <div className="flex border-b border-slate-200 px-8 bg-white">
                <button
                  className={`py-4 px-4 font-bold text-sm border-b-2 transition-colors ${activePatientTab === 'detail' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActivePatientTab('detail')}
                >
                  Informasi Pendaftaran
                </button>
                <button
                  className={`py-4 px-4 font-bold text-sm border-b-2 transition-colors ${activePatientTab === 'rekam-medis' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActivePatientTab('rekam-medis')}
                >
                  Rekam Medis
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {activePatientTab === 'detail' ? (
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
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Keluhan</label>
                      <textarea 
                        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                        placeholder="Masukkan keluhan pasien..."
                        value={medicalRecordForm.keluhan}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, keluhan: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Pemeriksaan</label>
                      <textarea 
                        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                        placeholder="Hasil pemeriksaan fisik/penunjang..."
                        value={medicalRecordForm.pemeriksaan}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, pemeriksaan: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Diagnosa</label>
                      <textarea 
                        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                        placeholder="Diagnosa penyakit..."
                        value={medicalRecordForm.diagnosa}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, diagnosa: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Tindakan</label>
                      <textarea 
                        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                        placeholder="Tindakan medis yang diberikan..."
                        value={medicalRecordForm.tindakan}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, tindakan: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Obat / Resep</label>
                      <textarea 
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none transition-all resize-none h-24 text-slate-600"
                        placeholder="Resep obat yang diberikan..."
                        value={medicalRecordForm.resep}
                        readOnly
                      />
                      <p className="text-xs text-slate-500 mt-1">Gunakan tombol "Input Rekam Medis" di tabel untuk mengubah resep.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Tutup
                </button>
                {activePatientTab === 'rekam-medis' && (
                  <button 
                    onClick={handleSaveMedicalRecord}
                    disabled={isSavingMedicalRecord}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isSavingMedicalRecord ? 'Menyimpan...' : 'Simpan Rekam Medis'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsView() {
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [eIcv, setEIcv] = useState<any>({ jumlah_stok: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const vData = await getVaccineStocksDB();
      const eData = await getEIcvStockDB();
      setVaccines(vData);
      setEIcv(eData);
    };
    fetchData();
  }, []);

  const handleVaccineChange = (id: string, field: 'stok_tersedia', value: string) => {
    if (value === '') {
      const updated = vaccines.map((v: any) => v.id === id ? { ...v, [field]: '' } : v);
      setVaccines(updated);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    const updated = vaccines.map((v: any) => {
      if (v.id === id) {
        return { ...v, [field]: num };
      }
      return v;
    });
    setVaccines(updated);
  };

  const handleEIcvChange = (value: string) => {
    if (value === '') {
      setEIcv({ ...eIcv, jumlah_stok: '' });
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setEIcv({ ...eIcv, jumlah_stok: num });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure empty strings are converted to 0 before saving
      const cleanVaccines = vaccines.map((v: any) => ({ 
        ...v, 
        stok_tersedia: v.stok_tersedia === '' ? 0 : v.stok_tersedia
      }));
      const cleanEIcv = { ...eIcv, jumlah_stok: eIcv.jumlah_stok === '' ? 0 : eIcv.jumlah_stok };
      
      await saveVaccineStocksDB(cleanVaccines);
      await saveEIcvStockDB(cleanEIcv);
      
      setVaccines(cleanVaccines);
      setEIcv(cleanEIcv);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Error saving stock:`, error.message);
      setErrorMsg('Gagal menyimpan perubahan stok.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
      {errorMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Error</h3>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-medium hover:bg-emerald-700">Tutup</button>
          </div>
        </div>
      )}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 bg-white border border-emerald-100 shadow-xl rounded-2xl p-4 flex items-start space-x-4 z-50"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Data berhasil disimpan</h4>
              <p className="text-sm text-slate-500 mt-1">Stok vaksin telah diperbarui</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Pengaturan Sistem</h2>
          <p className="text-slate-500 mt-1">Kelola stok vaksin dan e-ICV</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
        >
          <Save size={18} />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manajemen Stok Vaksin */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Manajemen Stok Vaksin</h3>
          </div>
          <div className="p-6">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="pb-4">Nama Vaksin</th>
                  <th className="pb-4">Stok Tersedia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vaccines.map((v: any) => (
                  <tr key={v.id}>
                    <td className="py-4 font-bold text-slate-900">{v.nama_vaksin}</td>
                    <td className="py-4">
                      <input 
                        type="number" 
                        min="0"
                        value={v.stok_tersedia}
                        onChange={(e) => handleVaccineChange(v.id, 'stok_tersedia', e.target.value)}
                        className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manajemen Stok e-ICV */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Manajemen Stok e-ICV</h3>
          </div>
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-slate-500 mb-4">Stok e-ICV Saat Ini</p>
            <div className="flex justify-center items-center space-x-8 mb-8">
              <input 
                type="number" 
                min="0"
                value={eIcv.jumlah_stok}
                onChange={(e) => handleEIcvChange(e.target.value)}
                className="w-32 px-4 py-3 text-center text-4xl font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SidebarItem({ icon, label, active = false, onClick, isCollapsed = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, isCollapsed?: boolean }) {
  return (
    <li className="relative group">
      <button 
        onClick={onClick} 
        className={`w-full flex items-center h-12 px-3 rounded-xl transition-all duration-300 ${
          active 
            ? 'bg-white text-[#0F2027] font-semibold shadow-md' 
            : 'text-white/80 hover:bg-white/10 hover:text-white font-medium'
        } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
      >
        <div className={`${active ? 'text-[#2C5364]' : 'text-white group-hover:text-white'}`}>
          {icon}
        </div>
        {!isCollapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
      </button>
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[#0F2027] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-xl border border-white/10">
          {label}
        </div>
      )}
    </li>
  );
}

function SidebarDropdown({ icon, label, active = false, isCollapsed = false, children, isOpen, onToggle }: { icon: React.ReactNode, label: string, active?: boolean, isCollapsed?: boolean, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) {
  return (
    <li className="relative group">
      <button 
        onClick={onToggle} 
        className={`w-full flex items-center justify-between h-12 px-3 rounded-xl transition-all duration-300 ${
          active 
            ? 'bg-white/10 text-white font-semibold' 
            : 'text-white/80 hover:bg-white/10 hover:text-white font-medium'
        } ${isCollapsed ? 'justify-center' : ''}`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className={`${active ? 'text-white' : 'text-white group-hover:text-white'}`}>
            {icon}
          </div>
          {!isCollapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
        </div>
        {!isCollapsed && (
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''} text-white/50 group-hover:text-white`}>
            <ChevronRight size={16} />
          </div>
        )}
      </button>

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[#0F2027] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-xl border border-white/10">
          {label}
        </div>
      )}

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.ul 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-1 space-y-1 pl-4 border-l border-white/10 ml-4"
          >
            {children}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function StatCard({ title, value, color, icon: Icon }: { title: string, value: number, color: 'emerald' | 'blue' | 'purple' | 'amber', icon: any }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-10 transition-transform group-hover:scale-150 ${colorMap[color].split(' ')[0]}`}></div>
      <div className="relative z-10">
        <p className="text-xs md:text-sm font-bold text-slate-500 mb-1">{title}</p>
        <h3 className={`text-3xl md:text-4xl font-black ${colorMap[color].split(' ')[1]}`}>{value}</h3>
      </div>
      <div className={`p-3 rounded-2xl relative z-10 ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

function JadwalView() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [poliklinik, setPoliklinik] = useState<any[]>([]);
  const [dokters, setDokters] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    nama_dokter: '',
    poli: '',
    hari_praktek: 'Senin',
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    kuota_harian: 30,
    status_dokter: 'aktif'
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  useEffect(() => {
    const fetchData = async () => {
      const [jadwalData, poliData, dokterData] = await Promise.all([
        getJadwalDokterDB(),
        getPoliklinikDB(),
        getDokterDB()
      ]);
      setJadwal(jadwalData);
      setPoliklinik(poliData);
      setDokters(dokterData || []);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      
      let inputs: any[] = [];
      const dbSchedules = item.schedules || [{
        hari_praktek: item.hari_praktek || 'Senin',
        jam_mulai: item.jam_mulai || '08:00',
        jam_selesai: item.jam_selesai || '12:00',
        kuota_harian: item.kuota_harian || 30
      }];
      
      const groups: { [key: string]: string[] } = {};
      dbSchedules.forEach((s: any) => {
        const key = `${s.jam_mulai}|${s.jam_selesai}|${s.kuota_harian}`;
        if (!groups[key]) groups[key] = [];
        if (s.hari_praktek) groups[key].push(s.hari_praktek);
      });

      Object.keys(groups).forEach(key => {
        const [jam_mulai, jam_selesai, kuota_str] = key.split('|');
        const kuota_harian = parseInt(kuota_str, 10);
        let scheduleDays = groups[key];
        
        scheduleDays.sort((a, b) => days.indexOf(a) - days.indexOf(b));
        
        let i = 0;
        while (i < scheduleDays.length) {
          let start = i;
          while (i + 1 < scheduleDays.length && days.indexOf(scheduleDays[i + 1]) === days.indexOf(scheduleDays[i]) + 1) {
            i++;
          }
          if (i > start) {
            inputs.push({
              isRange: true,
              hari_mulai: scheduleDays[start],
              hari_selesai: scheduleDays[i],
              hari_praktek: 'Senin',
              jam_mulai,
              jam_selesai,
              kuota_harian
            });
          } else {
            inputs.push({
              isRange: false,
              hari_mulai: 'Senin',
              hari_selesai: 'Jumat',
              hari_praktek: scheduleDays[start],
              jam_mulai,
              jam_selesai,
              kuota_harian
            });
          }
          i++;
        }
      });

      setFormData({
        nama_dokter: item.nama_dokter,
        poli: item.poli,
        status_dokter: item.status_dokter,
        tanggal_mulai_cuti: item.tanggal_mulai_cuti || '',
        tanggal_selesai_cuti: item.tanggal_selesai_cuti || '',
        schedules: inputs
      });
    } else {
      setEditingItem(null);
      setFormData({
        nama_dokter: dokters.length > 0 ? dokters[0].nama_dokter : '',
        poli: poliklinik[0]?.nama_poli || '',
        status_dokter: 'aktif',
        schedules: [{
          isRange: false,
          hari_mulai: 'Senin',
          hari_selesai: 'Jumat',
          hari_praktek: 'Senin',
          jam_mulai: '08:00',
          jam_selesai: '12:00',
          kuota_harian: 30
        }]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nama_dokter) {
      alert('Nama dokter tidak boleh kosong');
      return;
    }

    if (!formData.poli) {
      alert('Poliklinik tidak boleh kosong');
      return;
    }

    if (!formData.schedules || formData.schedules.length === 0) {
      alert('Minimal 1 hari praktek wajib diisi');
      return;
    }

    const dbSchedules: any[] = [];
    
    for (const input of formData.schedules) {
      if (input.jam_selesai <= input.jam_mulai) {
        alert(`Jam selesai harus lebih besar dari jam mulai`);
        return;
      }
      if (input.kuota_harian <= 0) {
        alert(`Kuota pasien harus lebih dari 0`);
        return;
      }
      
      if (input.isRange) {
        const startIdx = days.indexOf(input.hari_mulai);
        const endIdx = days.indexOf(input.hari_selesai);
        if (startIdx !== -1 && endIdx !== -1) {
          if (startIdx > endIdx) {
             alert(`Hari mulai (${input.hari_mulai}) tidak boleh melewati hari selesai (${input.hari_selesai})`);
             return;
          }
          for (let i = startIdx; i <= endIdx; i++) {
            dbSchedules.push({
              hari_praktek: days[i],
              jam_mulai: input.jam_mulai,
              jam_selesai: input.jam_selesai,
              kuota_harian: input.kuota_harian
            });
          }
        }
      } else {
        dbSchedules.push({
          hari_praktek: input.hari_praktek,
          jam_mulai: input.jam_mulai,
          jam_selesai: input.jam_selesai,
          kuota_harian: input.kuota_harian
        });
      }
    }

    const daysSeen = new Set();
    for (const schedule of dbSchedules) {
      if (daysSeen.has(schedule.hari_praktek)) {
        alert(`Tidak boleh ada duplikasi hari yang sama (${schedule.hari_praktek})`);
        return;
      }
      daysSeen.add(schedule.hari_praktek);
    }

    const finalData = {
      ...formData,
      schedules: dbSchedules
    };

    try {
      if (editingItem) {
        await updateJadwalDokterDB(editingItem.id, finalData);
      } else {
        await saveJadwalDokterDB(finalData);
      }
      setIsModalOpen(false);
      const data = await getJadwalDokterDB();
      setJadwal(data);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Gagal menyimpan jadwal');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJadwalDokterDB(id);
      setIsDeleting(null);
      const data = await getJadwalDokterDB();
      setJadwal(data);
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus jadwal');
    }
  };

  const formatScheduleDisplay = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return [];
    
    const groups: { [key: string]: string[] } = {};
    schedules.forEach((s: any) => {
      const key = `${s.jam_mulai}|${s.jam_selesai}|${s.kuota_harian}`;
      if (!groups[key]) groups[key] = [];
      if (s.hari_praktek) groups[key].push(s.hari_praktek);
    });

    return Object.keys(groups).map(key => {
      const [jam_mulai, jam_selesai, kuota_str] = key.split('|');
      let scheduleDays = groups[key];
      scheduleDays.sort((a, b) => days.indexOf(a) - days.indexOf(b));
      
      let parts = [];
      let i = 0;
      while (i < scheduleDays.length) {
        let start = i;
        while (i + 1 < scheduleDays.length && days.indexOf(scheduleDays[i + 1]) === days.indexOf(scheduleDays[i]) + 1) {
          i++;
        }
        if (i > start) {
          parts.push(`${scheduleDays[start]} - ${scheduleDays[i]}`);
        } else {
          parts.push(scheduleDays[start]);
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Jadwal Dokter</h2>
          <p className="text-slate-500 mt-1">Kelola jadwal praktek dokter (Terintegrasi Real-time dengan Portal Pasien)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center space-x-2 shadow-md active:scale-95"
        >
          <Plus size={20} />
          <span>Tambah Jadwal</span>
        </button>
      </header>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Daftar Jadwal Praktek</h3>
          <div className="text-xs text-slate-500 font-medium">Total: {jadwal.length} Jadwal</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Poliklinik</th>
                <th className="px-6 py-4">Nama Dokter</th>
                <th className="px-6 py-4">Jadwal Praktek</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jadwal.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Belum ada data jadwal dokter.
                  </td>
                </tr>
              ) : (
                jadwal.map((item: any) => {
                  const formattedSchedules = formatScheduleDisplay(item.schedules || [{
                    hari_praktek: item.hari_praktek,
                    jam_mulai: item.jam_mulai,
                    jam_selesai: item.jam_selesai,
                    kuota_harian: item.kuota_harian
                  }]);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-700">{item.poli}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={16} />
                          </div>
                          <span className="font-semibold text-slate-900">{item.nama_dokter}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {formattedSchedules.map((s, idx) => (
                            <div key={idx} className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 flex flex-col space-y-1">
                              <span className="font-bold text-slate-700 text-xs">{s.daysStr}</span>
                              <div className="flex items-center text-slate-500 text-xs font-medium">
                                <Clock size={12} className="mr-1" />
                                {s.jam_mulai} - {s.jam_selesai}
                                <span className="mx-2 text-slate-300">|</span>
                                <span className="text-emerald-600 font-bold">Kuota: {s.kuota_harian}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block w-max ${
                            item.status_dokter === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.status_dokter === 'aktif' ? 'Aktif' : 'Sedang Cuti'}
                          </span>
                          {item.status_dokter === 'cuti' && item.tanggal_mulai_cuti && (
                            <span className="text-[10px] text-slate-500 mt-1 font-medium">
                              {item.tanggal_mulai_cuti} s/d {item.tanggal_selesai_cuti}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenModal(item)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Jadwal"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => setIsDeleting(item.id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Jadwal"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <Calendar className="mr-3 text-emerald-600" size={24} />
                  {editingItem ? 'Edit Jadwal Dokter' : 'Tambah Jadwal Baru'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nama Dokter</label>
                  <select 
                    value={formData.nama_dokter}
                    onChange={e => setFormData({...formData, nama_dokter: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  >
                    {dokters.map(d => (
                      <option key={d.id_dokter} value={d.nama_dokter}>{d.nama_dokter}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Poliklinik</label>
                  <Select
                    options={[
                      {
                        label: 'Poliklinik Utama',
                        options: poliklinik
                          .filter(p => !p.nama_poli.toLowerCase().includes('patologi') && !p.nama_poli.toLowerCase().includes('radiologi'))
                          .map(p => ({ value: p.nama_poli, label: p.nama_poli }))
                      },
                      {
                        label: 'Spesialis Penunjang',
                        options: poliklinik
                          .filter(p => p.nama_poli.toLowerCase().includes('patologi') || p.nama_poli.toLowerCase().includes('radiologi'))
                          .map(p => ({ value: p.nama_poli, label: p.nama_poli }))
                      }
                    ]}
                    value={formData.poli ? { value: formData.poli, label: formData.poli } : null}
                    onChange={(selectedOption: any) => setFormData({...formData, poli: selectedOption?.value || ''})}
                    placeholder="Pilih Poliklinik..."
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        padding: '0.25rem',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#cbd5e1'
                        }
                      }),
                      groupHeading: (base) => ({
                        ...base,
                        color: '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.5rem 0.75rem'
                      })
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">Jadwal Praktek</label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, schedules: [...(formData.schedules || []), { isRange: false, hari_mulai: 'Senin', hari_selesai: 'Jumat', hari_praktek: 'Senin', jam_mulai: '08:00', jam_selesai: '12:00', kuota_harian: 30 }]})}
                      className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 transition-colors flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> Tambah Jadwal
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {(formData.schedules || []).map((schedule: any, index: number) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 relative"
                      >
                        <button 
                          type="button"
                          onClick={() => {
                            const newSchedules = [...formData.schedules];
                            newSchedules.splice(index, 1);
                            setFormData({...formData, schedules: newSchedules});
                          }}
                          className="absolute top-4 right-4 text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <div className="flex items-center space-x-2 pr-10">
                          <label className="text-xs font-bold text-slate-600 cursor-pointer flex items-center">
                            <input 
                              type="checkbox" 
                              checked={schedule.isRange}
                              onChange={e => {
                                const newSchedules = [...formData.schedules];
                                newSchedules[index].isRange = e.target.checked;
                                setFormData({...formData, schedules: newSchedules});
                              }}
                              className="mr-2 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            Gunakan Rentang Hari
                          </label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {schedule.isRange ? (
                            <>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Hari Mulai</label>
                                <select 
                                  value={schedule.hari_mulai}
                                  onChange={e => {
                                    const newSchedules = [...formData.schedules];
                                    newSchedules[index].hari_mulai = e.target.value;
                                    setFormData({...formData, schedules: newSchedules});
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                                >
                                  {days.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Hari Selesai</label>
                                <select 
                                  value={schedule.hari_selesai}
                                  onChange={e => {
                                    const newSchedules = [...formData.schedules];
                                    newSchedules[index].hari_selesai = e.target.value;
                                    setFormData({...formData, schedules: newSchedules});
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                                >
                                  {days.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2 col-span-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Hari</label>
                              <select 
                                value={schedule.hari_praktek}
                                onChange={e => {
                                  const newSchedules = [...formData.schedules];
                                  newSchedules[index].hari_praktek = e.target.value;
                                  setFormData({...formData, schedules: newSchedules});
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                              >
                                {days.map(day => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Jam Mulai</label>
                            <input 
                              type="time"
                              value={schedule.jam_mulai}
                              onChange={e => {
                                const newSchedules = [...formData.schedules];
                                newSchedules[index].jam_mulai = e.target.value;
                                setFormData({...formData, schedules: newSchedules});
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Jam Selesai</label>
                            <input 
                              type="time"
                              value={schedule.jam_selesai}
                              onChange={e => {
                                const newSchedules = [...formData.schedules];
                                newSchedules[index].jam_selesai = e.target.value;
                                setFormData({...formData, schedules: newSchedules});
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Kuota</label>
                            <input 
                              type="number"
                              value={schedule.kuota_harian}
                              onChange={e => {
                                const newSchedules = [...formData.schedules];
                                newSchedules[index].kuota_harian = parseInt(e.target.value) || 0;
                                setFormData({...formData, schedules: newSchedules});
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select 
                    value={formData.status_dokter}
                    onChange={e => setFormData({...formData, status_dokter: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="cuti">Sedang Cuti</option>
                  </select>
                </div>

                {formData.status_dokter === 'cuti' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Mulai Cuti</label>
                      <input 
                        type="date"
                        value={formData.tanggal_mulai_cuti}
                        onChange={e => setFormData({...formData, tanggal_mulai_cuti: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Selesai Cuti</label>
                      <input 
                        type="date"
                        value={formData.tanggal_selesai_cuti}
                        onChange={e => setFormData({...formData, tanggal_selesai_cuti: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex space-x-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formData.nama_dokter || !formData.poli || !formData.schedules || formData.schedules.length === 0 || formData.schedules.some((s: any) => !s.jam_mulai || !s.jam_selesai || !s.kuota_harian || (s.isRange ? (!s.hari_mulai || !s.hari_selesai) : !s.hari_praktek))}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Jadwal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Jadwal?</h3>
              <p className="text-slate-500 mb-8">Tindakan ini tidak dapat dibatalkan. Jadwal akan dihapus permanen.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsDeleting(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleDelete(isDeleting)}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LaporanView() {
  const [laporan, setLaporan] = useState<any>({ totalKunjungan: 0, statistikPoli: [], topPoli: [] });

  useEffect(() => {
    const fetchLaporan = async () => {
      const data = await getLaporanBulananDB();
      setLaporan(data);
    };
    fetchLaporan();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Laporan Statistik</h2>
          <p className="text-slate-500 mt-1">Statistik kunjungan pasien bulanan</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <StatCard title="Total Kunjungan Bulan Ini" value={laporan.totalKunjungan} color="emerald" icon={Activity} />
        
        <div className="lg:col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top 3 Poli Terpadat</h3>
          <div className="space-y-5">
            {laporan.topPoli.map((poli: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-bold text-slate-700">{poli.name}</span>
                </div>
                <span className="font-black text-slate-900 text-lg">{poli.kunjungan} <span className="text-xs font-medium text-slate-500">pasien</span></span>
              </div>
            ))}
            {laporan.topPoli.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">Belum ada data kunjungan bulan ini</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Statistik Kunjungan Bulanan per Poli</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={laporan.statistikPoli} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} width={150} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="kunjungan" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function PoliklinikView() {
  const [poliklinik, setPoliklinik] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    const fetchPoli = async () => {
      const data = await getPoliklinikDB();
      setPoliklinik(data);
    };
    fetchPoli();
  }, []);

  const handleEdit = (item: any) => {
    setIsEditing(item.id_poli);
    setEditForm(item);
  };

  const handleSave = async () => {
    await updatePoliklinikDB(editForm.id_poli, editForm);
    setIsEditing(null);
    const data = await getPoliklinikDB();
    setPoliklinik(data);
  };

  const toggleStatus = async (item: any) => {
    const newStatus = item.status_poli === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    await updatePoliklinikDB(item.id_poli, { ...item, status_poli: newStatus });
    const data = await getPoliklinikDB();
    setPoliklinik(data);
  };

  const handleAdd = async () => {
    const newPoli = {
      id_poli: `p${Date.now()}`,
      nama_poli: 'Poli Baru',
      deskripsi: 'Deskripsi Poli',
      lokasi_ruangan: 'Lantai 1',
      kuota_harian: 20,
      status_poli: 'Aktif'
    };
    await savePoliklinikDB(newPoli);
    const data = await getPoliklinikDB();
    setPoliklinik(data);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Manajemen Poliklinik</h2>
          <p className="text-slate-500 mt-1">Kelola data poliklinik dan kapasitas pasien</p>
        </div>
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={18} />
          <span>Tambah Poliklinik</span>
        </button>
      </header>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between">
          <h3 className="text-lg font-bold text-slate-900">Daftar Poliklinik</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Nama Poli</th>
                <th className="px-6 py-4">Deskripsi</th>
                <th className="px-6 py-4">Lokasi Ruangan</th>
                <th className="px-6 py-4">Kuota Harian</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {poliklinik.map((item: any) => (
                <tr key={item.id_poli} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.nama_poli}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {isEditing === item.id_poli ? (
                      <input type="text" value={editForm.deskripsi} onChange={e => setEditForm({...editForm, deskripsi: e.target.value})} className="border border-slate-200 rounded-lg px-3 py-1.5 w-full outline-none focus:border-emerald-500" />
                    ) : item.deskripsi}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {isEditing === item.id_poli ? (
                      <input type="text" value={editForm.lokasi_ruangan} onChange={e => setEditForm({...editForm, lokasi_ruangan: e.target.value})} className="border border-slate-200 rounded-lg px-3 py-1.5 w-full outline-none focus:border-emerald-500" />
                    ) : item.lokasi_ruangan}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing === item.id_poli ? (
                      <input type="number" value={editForm.kuota_harian} onChange={e => setEditForm({...editForm, kuota_harian: parseInt(e.target.value)})} className="border border-slate-200 rounded-lg px-3 py-1.5 w-20 outline-none focus:border-emerald-500" />
                    ) : (
                      <span className="font-bold text-slate-700">{item.kuota_harian} pasien</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status_poli === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status_poli}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing === item.id_poli ? (
                      <button onClick={handleSave} className="text-emerald-600 font-bold hover:text-emerald-700 px-3 py-1.5 bg-emerald-50 rounded-lg">Simpan</button>
                    ) : (
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 font-bold hover:text-blue-700">Edit</button>
                        <button onClick={() => toggleStatus(item)} className={`${item.status_poli === 'Aktif' ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'} font-bold`}>
                          {item.status_poli === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function PasienView() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getPatientsDB();
      setPatients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient: any) => {
    setEditingId(patient.id);
    setEditForm({ ...patient });
  };

  const handleSave = async () => {
    try {
      await updatePatientDB(editingId!, editForm);
      setEditingId(null);
      fetchPatients();
    } catch (error) {
      console.error(error);
      setErrorMsg('Gagal menyimpan data pasien');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deletePatientDB(deleteConfirm);
        fetchPatients();
        setDeleteConfirm(null);
      } catch (error) {
        console.error(error);
        setErrorMsg('Gagal menghapus data pasien');
        setDeleteConfirm(null);
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data pasien...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {errorMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Error</h3>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-medium hover:bg-emerald-700">Tutup</button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Hapus</h3>
            <p className="text-slate-600 mb-6">Apakah Anda yakin ingin menghapus data pasien ini?</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50">Batal</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Manajemen Pasien</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nama Pasien</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">NIK</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">No. HP</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">No. BPJS</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === patient.id ? (
                      <input type="text" value={editForm.nama_pasien} onChange={e => setEditForm({...editForm, nama_pasien: e.target.value})} className="w-full px-2 py-1 border rounded" />
                    ) : (
                      <span className="font-medium text-slate-900">{patient.nama_pasien}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === patient.id ? (
                      <input type="text" value={editForm.nik} onChange={e => setEditForm({...editForm, nik: e.target.value})} className="w-full px-2 py-1 border rounded" />
                    ) : (
                      <span className="text-slate-600">{patient.nik}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === patient.id ? (
                      <input type="text" value={editForm.no_hp} onChange={e => setEditForm({...editForm, no_hp: e.target.value})} className="w-full px-2 py-1 border rounded" />
                    ) : (
                      <span className="text-slate-600">{patient.no_hp}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === patient.id ? (
                      <input type="text" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-2 py-1 border rounded" />
                    ) : (
                      <span className="text-slate-600">{patient.email}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === patient.id ? (
                      <input type="text" value={editForm.nomor_bpjs || ''} onChange={e => setEditForm({...editForm, nomor_bpjs: e.target.value})} className="w-full px-2 py-1 border rounded" />
                    ) : (
                      <span className="text-slate-600">{patient.nomor_bpjs || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === patient.id ? (
                      <div className="flex justify-end space-x-2">
                        <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-700 p-1"><Save size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1">Batal</button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleEdit(patient)} className="text-blue-600 hover:text-blue-700 p-1"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(patient.id)} className="text-red-600 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Belum ada data pasien.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function ArtikelView() {
  const [articles, setArticles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ topArticles: [], totalViews: 0, totalArticles: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchArticles();
    fetchStats();
  }, []);

  const fetchArticles = async () => {
    try {
      const data = await getArticlesDB();
      setArticles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getArticleStatsDB();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (article: any) => {
    setIsEditing(article.id_artikel);
    setEditForm({ ...article });
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await saveArticleDB(editForm);
      } else {
        await updateArticleDB(isEditing!.toString(), editForm);
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
      fetchArticles();
      fetchStats();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        const data = await deleteArticleDB(deleteConfirm.toString());
        if (data.success) {
          fetchArticles();
          fetchStats();
          setDeleteConfirm(null);
        } else {
          throw new Error(data.error || 'Gagal menghapus artikel');
        }
      } catch (error: any) {
        console.error('Delete error:', error);
        alert('Gagal menghapus artikel: ' + error.message);
      }
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditForm({
      judul_artikel: '',
      ringkasan_artikel: '',
      isi_artikel: '',
      gambar_slider: '',
      kategori_artikel: 'Edukasi Kesehatan',
      tanggal_publish: new Date().toISOString().slice(0, 10),
      status_publish: 'Draft',
      featured_slider: 'No',
      penulis: 'Admin'
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau PDF.');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          const data = await uploadArticleImageDB(base64String);
          
          if (data.success) {
            setEditForm(prev => ({
              ...prev,
              gambar_slider: data.url
            }));
          } else {
            throw new Error(data.error || 'Gagal mengunggah gambar');
          }
        } catch (error: any) {
          console.error('Upload error:', error);
          alert('Gagal mengunggah gambar: ' + error.message);
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('File read error:', error);
      alert('Gagal membaca file: ' + error.message);
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data artikel...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Hapus</h3>
            <p className="text-slate-600 mb-6">Apakah Anda yakin ingin menghapus artikel ini?</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50">Batal</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {(isEditing || isAdding) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full my-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{isAdding ? 'Tambah Artikel Baru' : 'Edit Artikel'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Artikel</label>
                <input type="text" value={editForm.judul_artikel || ''} onChange={e => setEditForm({...editForm, judul_artikel: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select value={editForm.kategori_artikel || ''} onChange={e => setEditForm({...editForm, kategori_artikel: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="Edukasi Kesehatan">Edukasi Kesehatan</option>
                  <option value="Pengumuman">Pengumuman</option>
                  <option value="Program RS">Program RS</option>
                  <option value="Informasi">Informasi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ringkasan (Maks 120 karakter)</label>
                <textarea value={editForm.ringkasan_artikel || ''} onChange={e => setEditForm({...editForm, ringkasan_artikel: e.target.value})} maxLength={120} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Isi Artikel</label>
                <textarea value={editForm.isi_artikel || ''} onChange={e => setEditForm({...editForm, isi_artikel: e.target.value})} rows={6} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Gambar Slider</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors border border-slate-200">
                    <Upload size={18} className="mr-2" />
                    <span>{uploadingImage ? 'Mengupload...' : 'Pilih File'}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                  <span className="text-sm text-slate-500 flex-1 truncate">
                    {editForm.gambar_slider ? editForm.gambar_slider.split('/').pop() : 'Belum ada file dipilih (Maks 5MB)'}
                  </span>
                </div>
                {editForm.gambar_slider && (
                  <div className="mt-2">
                    <img src={editForm.gambar_slider} alt="Preview" className="h-32 object-cover rounded-xl border border-slate-200" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Publish</label>
                  <select value={editForm.status_publish || ''} onChange={e => setEditForm({...editForm, status_publish: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="Draft">Draft</option>
                    <option value="Publish">Publish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Featured Slider</label>
                  <select value={editForm.featured_slider || ''} onChange={e => setEditForm({...editForm, featured_slider: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="No">Tidak</option>
                    <option value="Yes">Ya</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
              <button onClick={() => { setIsEditing(null); setIsAdding(false); }} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50">Batal</button>
              <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700" disabled={uploadingImage}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Artikel Portal</h2>
          <p className="text-slate-500 mt-1">Kelola informasi dan edukasi kesehatan untuk pasien</p>
        </div>
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={18} />
          <span>Tambah Artikel</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Total Artikel</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FileText size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalArticles}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Total Tayangan</h3>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Eye size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalViews}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-4">Artikel Terpopuler</h3>
          <div className="space-y-3">
            {stats.topArticles.slice(0, 3).map((article: any, index: number) => (
              <div key={article.id_artikel} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-sm font-bold text-slate-400 w-4">{index + 1}.</span>
                  <span className="text-sm font-medium text-slate-700 truncate">{article.judul_artikel}</span>
                </div>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                  {article.views} views
                </span>
              </div>
            ))}
            {stats.topArticles.length === 0 && (
              <div className="text-sm text-slate-500 italic">Belum ada data tayangan</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Judul Artikel</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Kategori</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Featured</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Views</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tanggal</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((article) => (
                <tr key={article.id_artikel} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 line-clamp-1">{article.judul_artikel}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 text-sm">{article.kategori_artikel}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${article.status_publish === 'Publish' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {article.status_publish}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${article.featured_slider === 'Yes' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {article.featured_slider === 'Yes' ? 'Ya' : 'Tidak'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 text-sm font-medium">{article.views || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 text-sm">{article.tanggal_publish}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleEdit(article)} className="text-blue-600 hover:text-blue-700 p-1"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(article.id_artikel)} className="text-red-600 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Belum ada artikel.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function RekamMedisView() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [diagnosaOptions, setDiagnosaOptions] = useState<any[]>([]);
  const [obatOptions, setObatOptions] = useState<any[]>([]);
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    no_rm: '',
    keluhan: '',
    pemeriksaan: '',
    tekanan_darah: '',
    nadi: '',
    respirasi: '',
    suhu: '',
    saturasi: '',
    diagnosa: [] as any[],
    tindakan: 'Rawat Jalan',
    resep: [] as any[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apps, diagnosa, obat] = await Promise.all([
          getAppointmentsDB(),
          getDiagnosaDB(),
          getObatDB()
        ]);
        setAppointments(apps);
        setDiagnosaOptions(diagnosa);
        setObatOptions(obat);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const loadIcd10Options = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const response = await fetch(`/api/icd10?search=${encodeURIComponent(inputValue)}&limit=20`);
      const data = await response.json();
      
      const options = data.map((item: any) => ({
        value: item.code,
        label: `${item.code} - ${item.name}`,
        id: item.id
      }));
      
      // Check if exact match exists (case insensitive)
      const exactMatch = data.find((item: any) => 
        item.name.toLowerCase() === inputValue.toLowerCase() || 
        item.code.toLowerCase() === inputValue.toLowerCase()
      );
      
      return options;
    } catch (error) {
      console.error('Error fetching ICD-10 options:', error);
      return [];
    }
  };

  const loadObatOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const response = await fetch(`/api/obat?search=${encodeURIComponent(inputValue)}&limit=15`);
      const data = await response.json();
      
      return data.map((item: any) => ({
        value: item.id,
        label: `${item.nama_obat} (${item.kategori}) - Stok: ${item.stok}`,
        obat: item
      }));
    } catch (error) {
      console.error('Error fetching obat options:', error);
      return [];
    }
  };

  const handleAddResep = () => {
    setMedicalRecordForm({
      ...medicalRecordForm,
      resep: [
        ...medicalRecordForm.resep,
        { obat_id: '', nama_obat: '', satuan: '', dosis: '', frekuensi: '3x1', durasi: '3 Hari', cara_pakai: 'Sesudah Makan' }
      ]
    });
  };

  const handleRemoveResep = (index: number) => {
    const newResep = [...medicalRecordForm.resep];
    newResep.splice(index, 1);
    setMedicalRecordForm({ ...medicalRecordForm, resep: newResep });
  };

  const handleUpdateResep = (index: number, field: string, value: any) => {
    const newResep = [...medicalRecordForm.resep];
    if (field === 'obat') {
      if (!value) {
        newResep[index].obat_id = '';
        newResep[index].nama_obat = '';
        newResep[index].satuan = '';
        newResep[index].stok = 0;
        newResep[index].dosis = '';
      } else {
        // Check for duplicates
        const isDuplicate = newResep.some((r, i) => i !== index && r.obat_id === value.value && value.value !== 'custom');
        if (isDuplicate) {
          alert('Obat ini sudah ada dalam resep.');
          return;
        }

        if (value.__isNew__ || value.value === 'custom') {
          const normalizedName = value.label.trim().replace(/\s+/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
          
          // Check for duplicate custom names
          const isDuplicateCustom = newResep.some((r, i) => i !== index && r.nama_obat.toLowerCase() === normalizedName.toLowerCase());
          if (isDuplicateCustom) {
            alert('Obat ini sudah ada dalam resep.');
            return;
          }

          newResep[index].obat_id = 'custom';
          newResep[index].nama_obat = normalizedName;
          newResep[index].satuan = 'pcs';
          newResep[index].stok = 100; // Default stock for custom
          newResep[index].dosis = '1 Tablet';
        } else {
          newResep[index].obat_id = value.value;
          newResep[index].nama_obat = value.obat.nama_obat;
          newResep[index].satuan = value.obat.satuan;
          newResep[index].stok = value.obat.stok;
          
          // Auto-fill dosis based on category
          if (value.obat.kategori === 'Sirup') {
            newResep[index].dosis = '1 Sendok Takar (5ml)';
          } else if (value.obat.kategori === 'Salep' || value.obat.kategori === 'Krim') {
            newResep[index].dosis = 'Oleskan tipis';
            newResep[index].cara_pakai = 'Dioleskan pada area sakit';
          } else {
            newResep[index].dosis = '1 Tablet';
          }
        }
      }
    } else {
      newResep[index][field] = value;
    }
    setMedicalRecordForm({ ...medicalRecordForm, resep: newResep });
  };

  const handleInputRekamMedis = async (item: any) => {
    setSelectedPatient(item);
    setSaveStatus({ type: null, message: '' });
    try {
      const record = await getMedicalRecordDB(item.id_booking);
      
      let parsedDiagnosa = [];
      if (record.diagnosa) {
        if (Array.isArray(record.diagnosa)) {
          parsedDiagnosa = record.diagnosa.map((d: any) => {
            if (typeof d === 'string') return { value: 'Custom', label: d, id: 'custom' };
            return { value: d.code, label: d.code === 'Custom' ? d.name : `${d.code} - ${d.name}`, id: d.id };
          });
        } else if (typeof record.diagnosa === 'string') {
          try {
            const parsed = JSON.parse(record.diagnosa);
            if (Array.isArray(parsed)) {
              parsedDiagnosa = parsed.map((d: any) => {
                if (typeof d === 'string') return { value: 'Custom', label: d, id: 'custom' };
                return { value: d.code, label: d.code === 'Custom' ? d.name : `${d.code} - ${d.name}`, id: d.id };
              });
            } else {
              parsedDiagnosa = [{ value: 'Custom', label: record.diagnosa, id: 'custom' }];
            }
          } catch (e) {
            parsedDiagnosa = [{ value: 'Custom', label: record.diagnosa, id: 'custom' }];
          }
        }
      }

      let parsedResep = [];
      if (record.resep) {
        if (Array.isArray(record.resep)) {
          parsedResep = record.resep;
        } else if (typeof record.resep === 'string') {
          try {
            const parsed = JSON.parse(record.resep);
            if (Array.isArray(parsed)) {
              parsedResep = parsed;
            }
          } catch (e) {
            parsedResep = [];
          }
        }
      }

      setMedicalRecordForm({
        no_rm: record.no_rm || '',
        keluhan: record.keluhan || '',
        pemeriksaan: record.pemeriksaan || '',
        tekanan_darah: record.tekanan_darah || '',
        nadi: record.nadi || '',
        respirasi: record.respirasi || '',
        suhu: record.suhu || '',
        saturasi: record.saturasi || '',
        diagnosa: parsedDiagnosa,
        tindakan: record.tindakan || 'Rawat Jalan',
        resep: parsedResep
      });
    } catch (error) {
      console.error('Error fetching medical record:', error);
      setMedicalRecordForm({
        no_rm: '',
        keluhan: '',
        pemeriksaan: '',
        tekanan_darah: '',
        nadi: '',
        respirasi: '',
        suhu: '',
        saturasi: '',
        diagnosa: [],
        tindakan: 'Rawat Jalan',
        resep: []
      });
    }
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedPatient) return;
    
    setSaveStatus({ type: null, message: '' });

    // Validation
    if (!medicalRecordForm.diagnosa || medicalRecordForm.diagnosa.length === 0) {
      setSaveStatus({ type: 'error', message: 'Diagnosa wajib dipilih' });
      return;
    }
    if (!medicalRecordForm.resep || medicalRecordForm.resep.length === 0) {
      setSaveStatus({ type: 'error', message: 'Minimal 1 obat harus diinput' });
      return;
    }
    
    // Check for duplicate drugs
    const obatNames = medicalRecordForm.resep.map(r => r.nama_obat.toLowerCase().trim());
    const uniqueObatNames = new Set(obatNames);
    if (obatNames.length !== uniqueObatNames.size) {
      setSaveStatus({ type: 'error', message: 'Tidak boleh ada obat yang duplikat dalam 1 resep' });
      return;
    }

    // Check if all required fields in resep are filled
    const isResepValid = medicalRecordForm.resep.every(r => r.obat_id && r.dosis && r.frekuensi && r.durasi);
    if (!isResepValid) {
      setSaveStatus({ type: 'error', message: 'Mohon lengkapi data obat (Obat, Dosis, Frekuensi, Durasi)' });
      return;
    }

    // Check for out of stock drugs
    const outOfStockObat = medicalRecordForm.resep.find(r => r.stok !== undefined && r.stok <= 0);
    if (outOfStockObat) {
      setSaveStatus({ type: 'error', message: `Stok tidak tersedia untuk obat: ${outOfStockObat.nama_obat}` });
      return;
    }

    setIsSaving(true);
    try {
      const finalData = {
        ...medicalRecordForm,
        id_pasien: selectedPatient.user_id || selectedPatient.nik,
        diagnosa: medicalRecordForm.diagnosa.map((d: any) => {
          const isNew = d.__isNew__ || d.id === 'custom' || !d.id;
          const rawName = isNew ? d.label : (d.label.includes(' - ') ? d.label.substring(d.label.indexOf(' - ') + 3) : d.label);
          const normalizedName = rawName.trim().replace(/\s+/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
          return {
            id: isNew ? 'custom' : d.id,
            code: isNew ? 'Custom' : d.value,
            name: normalizedName
          };
        }),
        // Ensure numeric fields are numbers or empty strings
        nadi: medicalRecordForm.nadi || null,
        respirasi: medicalRecordForm.respirasi || null,
        suhu: medicalRecordForm.suhu || null,
        saturasi: medicalRecordForm.saturasi || null
      };
      
      console.log('Sending medical record data:', finalData);
      const result = await updateMedicalRecordDB(selectedPatient.id_booking, finalData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSaveStatus({ type: 'success', message: 'Rekam medis berhasil disimpan' });
      
      // Close modal after delay
      setTimeout(() => {
        setSelectedPatient(null);
        setSaveStatus({ type: null, message: '' });
      }, 2000);
      
    } catch (error: any) {
      console.error('Error saving medical record:', error);
      setSaveStatus({ type: 'error', message: `Gagal menyimpan: ${error.message || 'Error tidak diketahui'}` });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAppointments = appointments.filter(app => 
    app.nama_pasien?.toLowerCase().includes(search.toLowerCase()) ||
    app.nik?.includes(search) ||
    app.id_booking?.toLowerCase().includes(search.toLowerCase())
  );

  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const handleSeedData = async () => {
    setShowSeedConfirm(false);
    setSeedMessage('Sedang memproses...');
    try {
      const res = await fetch('/api/seed-data', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage(data.message);
      } else {
        setSeedMessage('Error: ' + data.error);
      }
    } catch (e: any) {
      setSeedMessage('Error: ' + e.message);
    }
  };

  const dosisOptions = [
    { value: '1x1', label: '1x1' },
    { value: '2x1', label: '2x1' },
    { value: '3x1', label: '3x1' },
    { value: 'Lainnya', label: 'Lainnya (Custom)' }
  ];

  return (
    <div className="space-y-8">
      {showSeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi</h3>
            <p className="text-slate-600 mb-6">Apakah Anda yakin ingin menambahkan 500 data dummy obat dan diagnosa?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSeedConfirm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Batal</button>
              <button onClick={handleSeedData} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">Ya, Tambahkan</button>
            </div>
          </div>
        </div>
      )}
      
      {seedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Informasi</h3>
            <p className="text-slate-600 mb-6">{seedMessage}</p>
            <div className="flex justify-end">
              <button onClick={() => setSeedMessage('')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Data Rekam Medis</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowSeedConfirm(true)}
            className="bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-emerald-200 transition-colors whitespace-nowrap"
          >
            Generate 500 Data
          </button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Pasien..." 
              className="w-full bg-white border-none rounded-full pl-10 pr-4 py-2.5 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">ID Booking</th>
                <th className="px-6 py-4">Informasi Pasien</th>
                <th className="px-6 py-4">Poli & Dokter</th>
                <th className="px-6 py-4">Tanggal Kunjungan</th>
                <th className="px-6 py-4 text-center rounded-tr-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((item: any) => (
                <tr key={item.id_booking} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">{item.id_booking}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{item.nama_pasien}</p>
                    <p className="text-xs text-slate-500">NIK: {item.nik}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-emerald-700">{item.poli}</p>
                    <p className="text-xs text-slate-600">{item.dokter}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.tanggal_kunjungan}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleInputRekamMedis(item)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-xs flex items-center justify-center mx-auto"
                    >
                      <FileText size={16} className="mr-2" />
                      Input Rekam Medis
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Tidak ada data pasien ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              className="bg-slate-50 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Sticky Header */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <Stethoscope className="mr-3 text-emerald-600" size={24} />
                  Input Rekam Medis
                </h3>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Biodata Pasien Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-3">
                      <User size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800">Biodata Pasien</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Nama Lengkap</p>
                      <p className="font-bold text-slate-900">{selectedPatient.nama_pasien}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">NIK</p>
                      <p className="font-bold text-slate-900">{selectedPatient.nik}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Tanggal Lahir</p>
                      <p className="font-bold text-slate-900">{selectedPatient.tanggal_lahir}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Jenis Kelamin</p>
                      <p className="font-bold text-slate-900">{selectedPatient.jenis_kelamin}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">No BPJS</p>
                      <p className="font-bold text-slate-900">{selectedPatient.nomor_bpjs || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">No Telepon</p>
                      <p className="font-bold text-slate-900">{selectedPatient.nomor_hp}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Alamat</p>
                      <p className="font-bold text-slate-900">{selectedPatient.alamat || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">No Rekam Medis</p>
                      <input 
                        type="text"
                        placeholder="Masukkan No RM"
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-600"
                        value={medicalRecordForm.no_rm}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, no_rm: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Input Section */}
                <div className="space-y-6">
                  {/* Keluhan & Pemeriksaan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-bold text-slate-700">
                        <Activity className="mr-2 text-emerald-500" size={16} />
                        Keluhan Utama
                      </label>
                      <textarea 
                        className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-32 text-sm bg-white"
                        placeholder="Tuliskan keluhan utama pasien..."
                        value={medicalRecordForm.keluhan}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, keluhan: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-bold text-slate-700">
                        <Eye className="mr-2 text-emerald-500" size={16} />
                        Pemeriksaan Fisik
                      </label>
                      <textarea 
                        className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-32 text-sm bg-white"
                        placeholder="Hasil pemeriksaan fisik..."
                        value={medicalRecordForm.pemeriksaan}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, pemeriksaan: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Vital Signs */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center">
                      <Activity className="mr-2 text-red-500" size={18} />
                      Vital Signs (Tanda-Tanda Vital)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Tekanan Darah</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="120/80"
                            className="w-full border border-slate-200 rounded-xl pl-3 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={medicalRecordForm.tekanan_darah}
                            onChange={(e) => setMedicalRecordForm({...medicalRecordForm, tekanan_darah: e.target.value})}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">mmHg</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Nadi</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="80"
                            className="w-full border border-slate-200 rounded-xl pl-3 pr-16 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={medicalRecordForm.nadi}
                            onChange={(e) => setMedicalRecordForm({...medicalRecordForm, nadi: e.target.value})}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">x/menit</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Respirasi</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="20"
                            className="w-full border border-slate-200 rounded-xl pl-3 pr-16 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={medicalRecordForm.respirasi}
                            onChange={(e) => setMedicalRecordForm({...medicalRecordForm, respirasi: e.target.value})}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">x/menit</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Suhu</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.1"
                            placeholder="36.5"
                            className="w-full border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={medicalRecordForm.suhu}
                            onChange={(e) => setMedicalRecordForm({...medicalRecordForm, suhu: e.target.value})}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">°C</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Saturasi O2</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="98"
                            className="w-full border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={medicalRecordForm.saturasi}
                            onChange={(e) => setMedicalRecordForm({...medicalRecordForm, saturasi: e.target.value})}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosa & Tindakan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-bold text-slate-700">
                        <CheckCircle className="mr-2 text-emerald-500" size={16} />
                        Diagnosa (ICD-10)
                      </label>
                        <AsyncCreatableSelect 
                        isMulti
                        cacheOptions
                        defaultOptions
                        loadOptions={loadIcd10Options}
                        placeholder="Cari diagnosa (kode atau nama) atau ketik baru..."
                        noOptionsMessage={() => "Ketik untuk mencari atau menambahkan diagnosa baru"}
                        formatCreateLabel={(inputValue) => `Tambah diagnosa baru: "${inputValue}"`}
                        className="text-sm"
                        value={medicalRecordForm.diagnosa}
                        onChange={(val) => setMedicalRecordForm({...medicalRecordForm, diagnosa: val as any})}
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: '0.75rem',
                            padding: '2px',
                            borderColor: '#e2e8f0'
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-bold text-slate-700">
                        <Hospital className="mr-2 text-emerald-500" size={16} />
                        Tindakan / Rencana
                      </label>
                      <select 
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={medicalRecordForm.tindakan}
                        onChange={(e) => setMedicalRecordForm({...medicalRecordForm, tindakan: e.target.value})}
                      >
                        <option value="Rawat Jalan">Rawat Jalan</option>
                        <option value="Rawat Inap">Rawat Inap</option>
                        <option value="Rujuk RS">Rujuk RS</option>
                      </select>
                    </div>
                  </div>

                  {/* Obat & Dosis */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center text-sm font-bold text-slate-700">
                        <Pill className="mr-2 text-emerald-500" size={16} />
                        Resep Obat
                      </label>
                      <button
                        onClick={handleAddResep}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center text-sm"
                      >
                        <Plus size={16} className="mr-1" /> Tambah Obat
                      </button>
                    </div>

                    <div className="space-y-4">
                      <AnimatePresence>
                        {medicalRecordForm.resep.map((r, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative"
                          >
                            <button
                              onClick={() => handleRemoveResep(index)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-12 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Obat</label>
                                <AsyncCreatableSelect 
                                  cacheOptions
                                  defaultOptions
                                  loadOptions={loadObatOptions}
                                  placeholder="Cari obat atau ketik baru..."
                                  noOptionsMessage={() => "Ketik untuk mencari atau menambahkan obat baru"}
                                  formatCreateLabel={(inputValue) => `Tambah obat baru: "${inputValue}"`}
                                  className="text-sm"
                                  value={r.obat_id ? { value: r.obat_id, label: r.nama_obat } : null}
                                  onChange={(val) => handleUpdateResep(index, 'obat', val)}
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderRadius: '0.75rem',
                                      padding: '2px',
                                      borderColor: '#e2e8f0'
                                    })
                                  }}
                                />
                              </div>
                              
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dosis</label>
                                <input 
                                  type="text"
                                  placeholder="Contoh: 500 mg"
                                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                  value={r.dosis}
                                  onChange={(e) => handleUpdateResep(index, 'dosis', e.target.value)}
                                />
                              </div>

                              <div className="md:col-span-3 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Frekuensi</label>
                                <select 
                                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                  value={r.frekuensi}
                                  onChange={(e) => handleUpdateResep(index, 'frekuensi', e.target.value)}
                                >
                                  <option value="1x1">1x1 (Sehari 1 kali)</option>
                                  <option value="2x1">2x1 (Sehari 2 kali)</option>
                                  <option value="3x1">3x1 (Sehari 3 kali)</option>
                                  <option value="4x1">4x1 (Sehari 4 kali)</option>
                                  <option value="Bila Perlu">Bila Perlu</option>
                                </select>
                              </div>

                              <div className="md:col-span-3 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Durasi</label>
                                <input 
                                  type="text"
                                  placeholder="Contoh: 3 Hari"
                                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                  value={r.durasi}
                                  onChange={(e) => handleUpdateResep(index, 'durasi', e.target.value)}
                                />
                              </div>

                              <div className="md:col-span-3 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cara Pakai</label>
                                <select 
                                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                  value={r.cara_pakai}
                                  onChange={(e) => handleUpdateResep(index, 'cara_pakai', e.target.value)}
                                >
                                  <option value="Sesudah Makan">Sesudah Makan</option>
                                  <option value="Sebelum Makan">Sebelum Makan</option>
                                  <option value="Bersama Makan">Bersama Makan</option>
                                  <option value="Dioleskan pada area sakit">Dioleskan</option>
                                  <option value="Diteteskan">Diteteskan</option>
                                </select>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {medicalRecordForm.resep.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <Pill className="mx-auto text-slate-400 mb-2" size={32} />
                          <p className="text-slate-500 text-sm">Belum ada obat yang ditambahkan</p>
                          <button
                            onClick={handleAddResep}
                            className="mt-3 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                          >
                            Tambah Obat Pertama
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-6 border-t border-slate-200 bg-white flex flex-col space-y-4 sticky bottom-0 z-10">
                {saveStatus.type && (
                  <div className={`p-3 rounded-xl text-sm font-medium flex items-center ${
                    saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {saveStatus.type === 'success' ? <CheckCircle size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                    {saveStatus.message}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setSelectedPatient(null)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveMedicalRecord}
                    disabled={isSaving}
                    className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center"
                  >
                    <Save size={18} className="mr-2" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Rekam Medis'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
