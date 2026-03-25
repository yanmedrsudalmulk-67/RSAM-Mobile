import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Star, Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getJadwalDokterDB, getDokterDB } from '../db';
import { DOCTORS } from '../constants';
import { supabase } from '../lib/supabase';
import { checkIsCuti } from '../utils/doctorUtils';

interface DaftarDokterProps {
  onBack: () => void;
  onSelectDoctor: (doctor: any) => void;
  doctorsList?: any[];
}

export default function DaftarDokter({ onBack, onSelectDoctor, doctorsList: propDoctorsList }: DaftarDokterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Semua Spesialis');
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsList, setDoctorsList] = useState<any[]>(propDoctorsList || []);
  const [specialties, setSpecialties] = useState<string[]>(['Semua Spesialis']);
  const itemsPerPage = 8;

  const [isLoading, setIsLoading] = useState(!propDoctorsList);

  useEffect(() => {
    if (propDoctorsList) {
      setDoctorsList(propDoctorsList);
      const specs = ['Semua Spesialis', ...Array.from(new Set(propDoctorsList.map((doc: any) => doc.specialty).filter(Boolean) as string[]))];
      setSpecialties(specs);
      setIsLoading(false);
      return;
    }

    const fetchDoctorsStatus = async () => {
      try {
        setIsLoading(true);
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const [jadwal, dbDoctors, { data: todayAppointments }] = await Promise.all([
          getJadwalDokterDB(),
          getDokterDB(),
          supabase.from('booking_kunjungan').select('id_jadwal, dokter').eq('tanggal_kunjungan', todayStr)
        ]);
        
        const specs = ['Semua Spesialis', ...Array.from(new Set(dbDoctors.map((doc: any) => doc.spesialis).filter(Boolean) as string[]))];
        setSpecialties(specs);
        
        const getSchedules = (j: any) => {
          if (j.schedules && Array.isArray(j.schedules) && j.schedules.length > 0) {
            return j.schedules;
          }
          
          const daysMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
          const result: any[] = [];
          const hp = (j.hari_praktek || '').toLowerCase();
          
          if (hp.includes('-')) {
            const parts = hp.split('-').map((p: string) => p.trim().toLowerCase());
            const startIdx = daysMap.findIndex(d => d === parts[0]);
            const endIdx = daysMap.findIndex(d => d === parts[1]);
            if (startIdx !== -1 && endIdx !== -1) {
              for (let i = startIdx; i <= endIdx; i++) {
                result.push({
                  hari_praktek: daysMap[i],
                  jam_mulai: j.jam_mulai || '',
                  jam_selesai: j.jam_selesai || '',
                  kuota_harian: j.kuota_harian || 0
                });
              }
            }
          } else {
            const days = hp.split(/,|dan/).map((p: string) => p.trim().toLowerCase());
            days.forEach((d: string) => {
              const found = daysMap.find(dm => dm === d);
              if (found) {
                result.push({
                  hari_praktek: found,
                  jam_mulai: j.jam_mulai || '',
                  jam_selesai: j.jam_selesai || '',
                  kuota_harian: j.kuota_harian || 0
                });
              }
            });
          }
          
          if (result.length === 0 && j.hari_praktek) {
             result.push({
                hari_praktek: j.hari_praktek.toLowerCase(),
                jam_mulai: j.jam_mulai || '',
                jam_selesai: j.jam_selesai || '',
                kuota_harian: j.kuota_harian || 0
             });
          }
          
          return result;
        };

        const daysMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        const todayDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const todayName = daysMap[todayDate.getDay()];
        
        const formatScheduleDisplay = (schedules: any[]) => {
          if (!schedules || schedules.length === 0) return [];
          
          const daysOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
          const groups: { [key: string]: string[] } = {};
          schedules.forEach((s: any) => {
            const key = `${s.jam_mulai}|${s.jam_selesai}|${s.kuota_harian}`;
            if (!groups[key]) groups[key] = [];
            if (s.hari_praktek) groups[key].push(s.hari_praktek.toLowerCase());
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
              if (i > start) {
                parts.push(`${scheduleDays[start].charAt(0).toUpperCase() + scheduleDays[start].slice(1)} - ${scheduleDays[i].charAt(0).toUpperCase() + scheduleDays[i].slice(1)}`);
              } else {
                parts.push(scheduleDays[start].charAt(0).toUpperCase() + scheduleDays[start].slice(1));
              }
              i++;
            }

            return `${parts.join(', ')} (${jam_mulai}-${jam_selesai})`;
          });
        };

        const updatedDoctors = jadwal.map((j: any) => {
          // Find doctor info from dbDoctors or fallback to DOCTORS constant
          let docInfo = dbDoctors.find((d: any) => d.nama_dokter === j.nama_dokter || d.nama_dokter.split(',')[0].trim() === j.nama_dokter.split(',')[0].trim());
          if (!docInfo) {
            docInfo = DOCTORS.find(d => d.name === j.nama_dokter || d.name.split(',')[0].trim() === j.nama_dokter.split(',')[0].trim());
          }

          const allSchedules = getSchedules(j);
          const formatted = formatScheduleDisplay(allSchedules);
          const scheduleString = formatted.join(' | ');
          const availableDays = allSchedules.map((s: any) => (s.hari_praktek || '').toLowerCase());

          const mappedDoc = {
            id: j.id || (docInfo ? docInfo.id_dokter || docInfo.id : `JADWAL-${j.nama_dokter}-${j.poli}`),
            name: j.nama_dokter,
            specialty: j.poli || docInfo?.specialty || docInfo?.spesialis || 'Dokter Umum',
            imageUrl: docInfo?.foto_dokter || docInfo?.imageUrl,
            status_aktif: (docInfo?.status_aktif || j.status_dokter || 'Aktif').toString().toLowerCase() === 'aktif' ? 'Aktif' : 'Tidak Aktif',
            schedule: scheduleString,
            rating: docInfo?.rating || 5.0,
            availability: 'Tidak Praktik Hari Ini' as any
          };

          const isCuti = checkIsCuti([j]);
          if (isCuti) {
            return { ...mappedDoc, availability: 'Sedang Cuti' as any };
          }

          const isAvailableToday = availableDays.includes(todayName);

          if (isAvailableToday) {
            const todaySchedule = allSchedules.find((s: any) => (s.hari_praktek || '').toLowerCase() === todayName);
            const kuota = todaySchedule ? parseInt(todaySchedule.kuota_harian) || 0 : 0;
            
            const bookingCount = (todayAppointments || []).filter((a: any) => 
              a.dokter === j.nama_dokter || 
              (a.id_jadwal && a.id_jadwal === j.id)
            ).length;

            if (kuota > 0 && bookingCount >= kuota) {
              return { ...mappedDoc, availability: 'Jadwal Penuh' as any };
            } else {
              return { ...mappedDoc, availability: 'Tersedia' as any };
            }
          }
          
          return { ...mappedDoc, availability: 'Tidak Praktik Hari Ini' as any };
        });
        
        console.log('Total doctors mapped (DaftarDokter):', updatedDoctors.length);
        setDoctorsList(updatedDoctors);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctorsStatus();

    const schedulesSubscription = supabase.channel('doctor_schedules_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal_dokter' }, fetchDoctorsStatus)
      .subscribe();

    const bookingsSubscription = supabase.channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_kunjungan' }, fetchDoctorsStatus)
      .subscribe();

    const doctorsSubscription = supabase.channel('doctors_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dokter' }, fetchDoctorsStatus)
      .subscribe();

    return () => {
      supabase.removeChannel(schedulesSubscription);
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(doctorsSubscription);
    };
  }, []);

  // Filter and sort doctors
  const filteredDoctors = useMemo(() => {
    let result = doctorsList.filter(doc => doc.status_aktif === 'Aktif');

    if (selectedSpecialty !== 'Semua Spesialis') {
      result = result.filter(doc => doc.specialty === selectedSpecialty);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(lowerSearch) || 
        doc.specialty.toLowerCase().includes(lowerSearch)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

    return result;
  }, [searchTerm, selectedSpecialty, sortBy, doctorsList]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const currentDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack}
            className="mr-4 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Daftar Dokter Spesialis</h1>
            <p className="text-slate-500 mt-1">Temukan dokter spesialis terbaik untuk kebutuhan medis Anda</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama dokter..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 py-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Specialty Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-slate-400" />
              </div>
              <select
                value={selectedSpecialty}
                onChange={(e) => {
                  setSelectedSpecialty(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 py-3 text-sm focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              >
                {specialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500 whitespace-nowrap">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'rating')}
                className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="name">Nama Dokter (A-Z)</option>
                <option value="rating">Rating Tertinggi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Doctor Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-slate-500 font-medium">Memuat jadwal...</p>
          </div>
        ) : currentDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            {currentDoctors.map((doc) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 flex flex-col h-full w-full overflow-hidden"
              >
                <div className="w-full bg-white flex items-center justify-center border-b border-slate-100 overflow-hidden h-[240px] md:h-[280px]">
                  <img 
                    src={doc.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=10b981&color=fff`} 
                    alt={doc.name} 
                    className="w-full h-full object-contain object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 md:p-5 flex flex-col flex-grow text-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2">{doc.name}</h3>
                    <p className="text-slate-500 text-sm">{doc.specialty}</p>
                  </div>
                
                  <div className="mt-auto flex flex-col gap-3">
                    <div className="flex items-center justify-center text-slate-600 text-sm">
                      <Clock size={16} className="mr-2 text-emerald-600 flex-shrink-0" />
                      <span className="line-clamp-2">{doc.schedule}</span>
                    </div>
                    
                    <div>
                      <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-medium ${
                        doc.availability === 'Tersedia' ? 'bg-green-100 text-green-700' :
                        doc.availability === 'Jadwal Penuh' ? 'bg-red-100 text-red-700' :
                        doc.availability === 'Sedang Cuti' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.availability === 'Tersedia' ? '● Tersedia' :
                         doc.availability === 'Jadwal Penuh' ? '● Jadwal Penuh' :
                         doc.availability === 'Sedang Cuti' ? '● Sedang Cuti' :
                         '● Tidak Praktik Hari Ini'}
                      </span>
                    </div>
                  </div>
                
                  <button 
                    onClick={() => onSelectDoctor(doc)} 
                    disabled={doc.availability !== 'Tersedia'}
                    className={`w-full py-2.5 rounded-xl font-bold transition-all duration-300 mt-1 ${
                      doc.availability === 'Tersedia' 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] shadow-sm' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Daftar Online
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Dokter tidak ditemukan</h3>
            <p className="text-slate-500">Coba ubah kata kunci pencarian atau filter spesialisasi.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                currentPage === 1 
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed' 
                  : 'text-slate-700 bg-white hover:bg-slate-100 shadow-sm border border-slate-200'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                // Show first, last, current, and adjacent pages
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm border border-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                
                // Show ellipsis for skipped pages
                if (
                  (page === 2 && currentPage > 3) || 
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <span key={page} className="px-2 py-2 text-slate-400">...</span>;
                }
                
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                currentPage === totalPages 
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed' 
                  : 'text-slate-700 bg-white hover:bg-slate-100 shadow-sm border border-slate-200'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
