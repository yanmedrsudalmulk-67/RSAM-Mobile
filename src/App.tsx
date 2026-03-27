/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Activity, 
  Stethoscope, 
  Microscope, 
  Pill, 
  ChevronRight, 
  ChevronLeft,
  Menu, 
  X, 
  Star,
  CheckCircle2,
  Wifi,
  ParkingCircle,
  Coffee,
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
  LogOut,
  FileText,
  Upload,
  Edit2,
  Trash2,
  MessageCircle,
  Facebook,
  Instagram,
  Video,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICES, TESTIMONIALS, DOCTORS } from './constants';
import { getJadwalDokterDB, getDokterDB } from './db';
const Dashboard = lazy(() => import('./components/Dashboard'));
const PendaftaranOnline = lazy(() => import('./components/PendaftaranOnline'));
const Login = lazy(() => import('./components/LoginComponent'));
const Profile = lazy(() => import('./components/Profile'));
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));
const DaftarDokter = lazy(() => import('./components/DaftarDokter'));
import { supabase } from './lib/supabase';
import { checkIsCuti } from './utils/doctorUtils';

const ScrollHint = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Hide if scrolled more than 30% of viewport height
      setVisible(scrollY < window.innerHeight * 0.3);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: [0, 10, 0],
          }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ 
            opacity: { duration: 0.3 },
            y: { 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "easeInOut" 
            }
          }}
          onClick={() => {
            document.getElementById("next-section")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
          className="fixed bottom-5 right-4 z-[60] flex md:hidden items-center justify-center w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg cursor-pointer group"
        >
          <ChevronDown className="text-white" size={24} />
          <div className="absolute bottom-full mb-2 right-0 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Scroll ke bawah
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import { useSiteAssets } from './hooks/useSiteAssets';

function ServiceSlider({ services, onSelectService }: { services: any[], onSelectService: (service: any) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isHovered || isDragging || isLoading) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, isDragging, isLoading, services.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % services.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);

  if (isLoading) {
    return (
      <div className="relative w-full h-[550px] flex items-center justify-center overflow-hidden">
        <div className="w-[300px] md:w-[380px] h-[420px] bg-white border border-slate-100 p-8 rounded-[20px] shadow-sm flex flex-col animate-pulse">
          <div className="w-14 h-14 bg-slate-200 rounded-full mb-6"></div>
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2 mb-6 flex-grow">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
          <div className="h-12 bg-slate-200 rounded-xl w-full mt-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[550px] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {services.map((service, index) => {
          let offset = index - currentIndex;
          if (offset > Math.floor(services.length / 2)) offset -= services.length;
          if (offset < -Math.floor(services.length / 2)) offset += services.length;

          const isCenter = offset === 0;
          const isVisible = Math.abs(offset) <= 1;
          
          const xOffset = offset * (isMobile ? 320 : 420);

          return (
            <motion.div
              key={service.id}
              initial={false}
              animate={{
                x: xOffset,
                scale: isCenter ? 1 : 0.85,
                opacity: isVisible ? (isCenter ? 1 : 0.5) : 0,
                filter: isCenter ? 'blur(0px)' : 'blur(4px)',
                zIndex: isCenter ? 10 : 0,
                pointerEvents: isCenter ? 'auto' : 'none'
              }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="absolute w-[300px] md:w-[380px] h-[420px] bg-white border p-8 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col"
              whileHover={isCenter ? { y: -8, scale: 1.03, boxShadow: '0 15px 35px rgba(11,163,96,0.15)', borderColor: '#0BA360' } : {}}
              drag={isCenter ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(e, { offset, velocity }) => {
                setIsDragging(false);
                const swipe = offset.x;
                if (swipe < -50) {
                  handleNext();
                } else if (swipe > 50) {
                  handlePrev();
                }
              }}
              onClick={() => {
                if (!isCenter) {
                  setCurrentIndex(index);
                }
              }}
              style={{ 
                cursor: isCenter ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                borderColor: '#f1f5f9'
              }}
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-600 border border-emerald-100 shadow-sm transition-transform duration-300 hover:rotate-12">
                {service.icon === 'Activity' && <Activity size={28} strokeWidth={1.5} />}
                {service.icon === 'Stethoscope' && <Stethoscope size={28} strokeWidth={1.5} />}
                {service.icon === 'Microscope' && <Microscope size={28} strokeWidth={1.5} />}
                {service.icon === 'Pill' && <Pill size={28} strokeWidth={1.5} />}
                {service.icon === 'ShieldCheck' && <ShieldCheck size={28} strokeWidth={1.5} />}
              </div>
              <h4 className="text-xl font-bold text-emerald-900 mb-4 drop-shadow-sm">{service.title}</h4>
              <p className="text-emerald-700 leading-relaxed mb-6 flex-grow text-sm">
                {service.description}
              </p>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectService(service);
                }} 
                className="mt-auto w-full py-3 bg-gradient-to-r from-[#11998E] to-[#38EF7D] text-white rounded-xl font-semibold flex items-center justify-center hover:shadow-[0_0_15px_rgba(56,239,125,0.5)] hover:scale-105 transition-all duration-300 group overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center">
                  Selengkapnya 
                  <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={handlePrev}
        className="absolute left-2 md:left-8 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-2 md:right-8 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 z-20 flex space-x-2">
        {services.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#38EF7D]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <motion.div 
          className="h-full bg-[#38EF7D]"
          initial={{ width: "0%" }}
          animate={{ width: isHovered || isDragging ? "0%" : "100%" }}
          transition={{ duration: isHovered || isDragging ? 0 : 4, ease: "linear" }}
          key={currentIndex}
        />
      </div>
    </div>
  );
}

export default function App() {
  const { assets, loading: assetsLoading, refresh: refreshAssets } = useSiteAssets();
  const [view, setView] = useState<'website' | 'dashboard' | 'pendaftaran' | 'profile' | 'riwayat' | 'daftar-dokter'>('website');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [serviceImages, setServiceImages] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ title: string, message: string, type: 'alert' | 'confirm', onConfirm?: () => void } | null>(null);

  const [user, setUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showScrollArrow, setShowScrollArrow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      
      // Hide if scrolled more than 30% of the viewport or near bottom
      if (scrollY > windowHeight * 0.3) {
        setShowScrollArrow(false);
      } else {
        setShowScrollArrow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    setShowWelcome(false);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    sessionStorage.setItem('user_session', JSON.stringify({ id: userData.id, role: userData.role }));
    setView('website');
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user_session');
    setShowWelcome(true);
    setView('website');
  };
  const [footerLogos, setFooterLogos] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<any | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [tentangKamiImageIndex, setTentangKamiImageIndex] = useState(0);
  const tentangKamiImages = [
    assets.about_image1 || "/tentang-kami.jpg",
    assets.about_image2 || "/uploads/foto_pasien/gedung-baru.jpg"
  ];

  const handleRippleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }
    button.appendChild(circle);

    setTimeout(() => {
      setView(user?.role === 'admin' ? 'dashboard' : 'pendaftaran');
    }, 300); // Give the ripple time to start before navigating
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTentangKamiImageIndex((prev) => (prev + 1) % tentangKamiImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchDoctorsStatus = useCallback(async () => {
    try {
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const [jadwal, dbDoctors, { data: todayAppointments }] = await Promise.all([
        getJadwalDokterDB(),
        getDokterDB(),
        supabase.from('booking_kunjungan').select('id_jadwal, dokter').eq('tanggal_kunjungan', todayStr)
      ]);
      
      const normalizeName = (name: string) => {
        if (!name) return '';
        return name.toLowerCase()
          .replace(/^(dr\.|drg\.|prof\.|apt\.)\s*/g, '')
          .split(',')[0]
          .replace(/\./g, '')
          .trim();
      };

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

      const baseDoctors = dbDoctors.length > 0 ? dbDoctors : DOCTORS;
      const updatedDoctors = baseDoctors.map((docInfo: any) => {
        const docName = docInfo.nama_dokter || docInfo.name;
        const normalizedDocName = normalizeName(docName);
        
        // Find all schedules for this doctor
        const doctorSchedules = (jadwal || []).filter((j: any) => {
          const normalizedJadwalName = normalizeName(j.nama_dokter);
          return normalizedJadwalName === normalizedDocName || 
                 j.nama_dokter === docName;
        });
        
        const allSchedules = doctorSchedules.length > 0 ? doctorSchedules.flatMap(s => getSchedules(s)) : [];
        const formatted = formatScheduleDisplay(allSchedules);
        const scheduleString = formatted.length > 0 ? formatted.join(' | ') : (docInfo.jadwal_praktek || docInfo.schedule || 'Jadwal belum tersedia');
        const availableDays = allSchedules.map((s: any) => (s.hari_praktek || '').toLowerCase());

        const mappedDoc = {
          id: docInfo.id_dokter || docInfo.id,
          name: docName,
          specialty: docInfo.spesialis || docInfo.specialty || docInfo.poli || 'Dokter Umum',
          imageUrl: docInfo.foto_dokter || docInfo.imageUrl,
          status_aktif: (docInfo.status_aktif || 'Aktif').toString().toLowerCase() === 'aktif' ? 'Aktif' : 'Tidak Aktif',
          schedule: scheduleString,
          rating: docInfo.rating || 5.0,
          availability: 'Tidak Praktik Hari Ini' as any,
          is_rekomendasi: docInfo.is_rekomendasi || false,
          urutan_rekomendasi: docInfo.urutan_rekomendasi || 0
        };

        const isCuti = checkIsCuti(doctorSchedules);
        if (isCuti) {
          return { ...mappedDoc, availability: 'Sedang Cuti' as any };
        }

        const isAvailableToday = availableDays.includes(todayName);

        if (isAvailableToday) {
          const todaySchedule = allSchedules.find((s: any) => (s.hari_praktek || '').toLowerCase() === todayName);
          const kuota = todaySchedule ? parseInt(todaySchedule.kuota_harian) || 0 : 0;
          
          const bookingCount = (todayAppointments || []).filter((a: any) => 
            a.dokter === docName || 
            (a.id_jadwal && doctorSchedules.some(ds => ds.id === a.id_jadwal))
          ).length;

          if (kuota > 0 && bookingCount >= kuota) {
            return { ...mappedDoc, availability: 'Jadwal Penuh' as any };
          } else {
            return { ...mappedDoc, availability: 'Tersedia' as any };
          }
        }
        
        return { ...mappedDoc, availability: 'Tidak Praktik Hari Ini' as any };
      });
      
      setDoctorsList(updatedDoctors);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchDoctorsStatus();

    const schedulesSubscription = supabase.channel('app_doctor_schedules_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal_dokter' }, fetchDoctorsStatus)
      .subscribe();

    const bookingsSubscription = supabase.channel('app_bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_kunjungan' }, fetchDoctorsStatus)
      .subscribe();

    const doctorsSubscription = supabase.channel('app_doctors_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dokter' }, fetchDoctorsStatus)
      .subscribe();

    return () => {
      supabase.removeChannel(schedulesSubscription);
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(doctorsSubscription);
    };
  }, [fetchDoctorsStatus]);

  const fetchFooterLogos = async () => {
    try {
      const response = await fetch('/api/logos?status=aktif');
      if (response.ok) {
        const data = await response.json();
        setFooterLogos(data);
      }
    } catch (error) {
      console.error('Failed to fetch footer logos:', error);
    }
  };

  useEffect(() => {
    if (view === 'website') {
      fetchFooterLogos();
      fetchDoctorsStatus();
    }
  }, [view, fetchDoctorsStatus]);

  const fetchServiceImages = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/images`);
      if (response.ok) {
        const data = await response.json();
        setServiceImages(data);
      }
    } catch (error) {
      console.error('Failed to fetch service images:', error);
    }
  };

  useEffect(() => {
    if (selectedService) {
      fetchServiceImages(selectedService.id);
    } else {
      setServiceImages([]);
    }
  }, [selectedService]);

  useEffect(() => {
    const checkAuth = async () => {
      // Clear session on restart to force login again as requested
      sessionStorage.removeItem('user_session');
      setUser(null);
      setShowWelcome(true);
      setIsAuthLoading(false);
    };
    checkAuth();
  }, []);

  // Auto logout timer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          handleLogout();
          setSessionExpired(true);
        }, 60 * 60 * 1000);
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [user]);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedService) return;
    
    if (serviceImages.length >= 5) {
      setModalMessage({ title: 'Peringatan', message: 'Maksimal 5 gambar per layanan', type: 'alert' });
      return;
    }

    const file = e.target.files[0];
    
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const response = await fetch('/api/layanan-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: selectedService.id,
            image: base64String
          })
        });

        const data = await response.json();
        if (data.success) {
          await fetchServiceImages(selectedService.id);
        } else {
          throw new Error(data.error || 'Gagal mengunggah gambar');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      setModalMessage({ title: 'Error', message: error.message || 'Terjadi kesalahan saat mengupload gambar', type: 'alert' });
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleEditImage = async (e: React.ChangeEvent<HTMLInputElement>, imageId: number) => {
    if (!e.target.files || !e.target.files[0] || !selectedService) return;
    
    const file = e.target.files[0];
    
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const response = await fetch(`/api/layanan-images/${imageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: selectedService.id,
            image: base64String
          })
        });

        const data = await response.json();
        if (data.success) {
          await fetchServiceImages(selectedService.id);
        } else {
          throw new Error(data.error || 'Gagal memperbarui gambar');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Edit error:', error);
      setModalMessage({ title: 'Error', message: error.message || 'Terjadi kesalahan saat mengedit gambar', type: 'alert' });
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!selectedService) return;
    
    if (serviceImages.length <= 3) {
      setModalMessage({ title: 'Peringatan', message: 'Minimal 3 gambar per layanan', type: 'alert' });
      return;
    }

    setModalMessage({
      title: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus gambar ini?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/layanan-images/${imageId}`, {
            method: 'DELETE'
          });

          const data = await response.json();
          if (data.success) {
            if (currentImageIndex >= serviceImages.length - 1) {
              setCurrentImageIndex(Math.max(0, serviceImages.length - 2));
            }
            await fetchServiceImages(selectedService.id);
          } else {
            throw new Error(data.error || 'Gagal menghapus gambar');
          }
        } catch (error: any) {
          console.error('Delete error:', error);
          setModalMessage({ title: 'Error', message: error.message || 'Terjadi kesalahan saat menghapus gambar', type: 'alert' });
        }
      }
    });
  };

  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Memuat Aplikasi...</p>
        </div>
      </div>
    }>
      <AnimatePresence mode="wait">
      {isAuthLoading ? (
        <motion.div key="loading" className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </motion.div>
      ) : showWelcome ? (
        <motion.div
          key="welcome"
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <WelcomeScreen onGetStarted={handleGetStarted} assets={assets} />
        </motion.div>
      ) : !user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {sessionExpired && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sesi Berakhir</h3>
                <p className="text-slate-600 mb-6">Sesi Anda telah berakhir karena tidak ada aktivitas selama 60 menit. Silakan login kembali.</p>
                <button onClick={() => setSessionExpired(false)} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-medium hover:bg-emerald-700">Tutup</button>
              </div>
            </div>
          )}
          <Login onLogin={handleLogin} assets={assets} />
        </motion.div>
      ) : view === 'dashboard' ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {user.role !== 'admin' ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center p-8 bg-white rounded-3xl shadow-lg max-w-md">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
                <p className="text-slate-600 mb-8">Akses hanya tersedia untuk Admin</p>
                <button 
                  onClick={() => setView('website')}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors w-full"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          ) : (
            <Dashboard onBack={() => setView('website')} assets={assets} onAssetsUpdate={refreshAssets} />
          )}
        </motion.div>
      ) : view === 'pendaftaran' ? (
        <motion.div key="pendaftaran" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {user.role !== 'patient' ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center p-8 bg-white rounded-3xl shadow-lg max-w-md">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
                <p className="text-slate-600 mb-8">Pendaftaran Online hanya tersedia untuk Pasien</p>
                <button 
                  onClick={() => setView('website')}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors w-full"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          ) : (
            <PendaftaranOnline onBack={() => { setView('website'); setSelectedDoctorForBooking(null); }} user={user} onUpdateUser={setUser} initialTab={selectedDoctorForBooking ? "buat-janji" : "dashboard"} initialDoctor={selectedDoctorForBooking} />
          )}
        </motion.div>
      ) : view === 'riwayat' ? (
        <motion.div key="riwayat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <PendaftaranOnline onBack={() => setView('website')} user={user} onUpdateUser={setUser} initialTab="riwayat" />
        </motion.div>
      ) : view === 'profile' ? (
        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Profile user={user} onUpdate={setUser} onBack={() => setView('website')} />
        </motion.div>
      ) : view === 'daftar-dokter' ? (
        <motion.div key="daftar-dokter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <DaftarDokter onBack={() => setView('website')} onSelectDoctor={(doc) => { setSelectedDoctorForBooking(doc); setView('pendaftaran'); }} doctorsList={doctorsList} />
        </motion.div>
      ) : (
        <motion.div key="website" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-emerald-100 w-full">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white-600 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden">
                <img src={assets.logo_main || "/logo-1.jpg"} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm md:text-xl font-bold text-emerald-400 leading-tight whitespace-nowrap">UOBK RSUD AL-MULK</h1>
                <p className="text-[7px] md:text-[10px] uppercase tracking-widest text-emerald-700 font-semibold whitespace-nowrap">Kota Sukabumi</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center space-x-1 lg:space-x-2">
              <a href="#tentang" className="px-2 lg:px-4 py-2 rounded-full text-slate-600 hover:text-emerald-600 text-xs lg:text-base font-medium transition-all duration-300 hover:bg-emerald-50/40 hover:backdrop-blur-lg border border-transparent hover:border-emerald-200/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">Tentang Kami</a>
              <a href="#layanan" className="px-2 lg:px-4 py-2 rounded-full text-slate-600 hover:text-emerald-600 text-xs lg:text-base font-medium transition-all duration-300 hover:bg-emerald-50/40 hover:backdrop-blur-lg border border-transparent hover:border-emerald-200/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">Layanan</a>
              <a href="#dokter" className="px-2 lg:px-4 py-2 rounded-full text-slate-600 hover:text-emerald-600 text-xs lg:text-base font-medium transition-all duration-300 hover:bg-emerald-50/40 hover:backdrop-blur-lg border border-transparent hover:border-emerald-200/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">Dokter</a>
              <a href="#fasilitas" className="px-2 lg:px-4 py-2 rounded-full text-slate-600 hover:text-emerald-600 text-xs lg:text-base font-medium transition-all duration-300 hover:bg-emerald-50/40 hover:backdrop-blur-lg border border-transparent hover:border-emerald-200/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">Fasilitas</a>
              
              {user.role === 'admin' && (
                <button 
                  onClick={() => setView('dashboard')}
                  className="px-2 lg:px-4 py-2 rounded-full flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 text-xs lg:text-base font-bold transition-all duration-300 hover:bg-emerald-50/40 hover:backdrop-blur-lg border border-transparent hover:border-emerald-200/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]"
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden lg:inline">Dashboard</span>
                </button>
              )}
              
              {user.role === 'patient' && (
                <button 
                  onClick={() => setView('pendaftaran')}
                  className="px-2 lg:px-4 py-2 rounded-full text-slate-600 hover:text-emerald-600 text-xs lg:text-base font-medium transition-all duration-300 hover:bg-emerald-50/40 hover:backdrop-blur-lg border border-transparent hover:border-emerald-200/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]"
                >
                  Daftar Online
                </button>
              )}

              {/* User Menu */}
              <div className="relative ml-1 lg:ml-2">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="px-2 lg:px-4 py-2 rounded-full flex items-center space-x-1 lg:space-x-2 text-slate-700 hover:text-emerald-600 font-medium transition-all duration-300 hover:bg-emerald-50/40 hover:backdrop-blur-lg border border-transparent hover:border-emerald-200/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]"
                >
                  {user.foto_profil ? (
                    <img src={user.foto_profil} alt="Profile" className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover border-2 border-emerald-100" />
                  ) : (
                    <UserCircle size={18} className="text-emerald-600 lg:w-6 lg:h-6" />
                  )}
                  <span className="hidden sm:inline text-xs lg:text-base">{user.nama_pasien || 'Admin'}</span>
                </button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-black/5" 
                        onClick={() => setIsUserMenuOpen(false)}
                      ></div>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden"
                      >
                        <div className="p-2 space-y-1">
                          {user.role === 'patient' && (
                            <button 
                              onClick={() => { setView('profile'); setIsUserMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors flex items-center"
                            >
                              <UserCircle size={16} className="mr-2" /> Profil Saya
                            </button>
                          )}
                          {user.role === 'patient' && (
                            <button 
                              onClick={() => { setView('riwayat'); setIsUserMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors flex items-center"
                            >
                              <FileText size={16} className="mr-2" /> Riwayat Pendaftaran
                            </button>
                          )}
                          <button 
                            onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                          >
                            <LogOut size={16} className="mr-2" /> Keluar
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="sm:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-emerald-50 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                <a href="#tentang" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-700 hover:bg-emerald-50 rounded-lg">Tentang Kami</a>
                <a href="#layanan" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-700 hover:bg-emerald-50 rounded-lg">Layanan</a>
                <a href="#dokter" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-700 hover:bg-emerald-50 rounded-lg">Dokter</a>
                <a href="#fasilitas" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-700 hover:bg-emerald-50 rounded-lg">Fasilitas</a>
                
                {user.role === 'admin' && (
                  <button 
                    onClick={() => { setView('dashboard'); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-4 text-base font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </button>
                )}
                
                {user.role === 'patient' && (
                  <button 
                    onClick={() => { setView('profile'); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-4 text-base font-medium text-slate-700 hover:bg-emerald-50 rounded-lg"
                  >
                    <UserCircle size={18} />
                    <span>Profil Pasien</span>
                  </button>
                )}

                {user.role === 'patient' && (
                  <button 
                    onClick={() => { setView('pendaftaran'); setIsMenuOpen(false); }}
                    className="w-full block px-3 py-4 text-base font-medium text-slate-700 hover:bg-emerald-50 rounded-lg text-left"
                  >
                    Daftar Online
                  </button>
                )}

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-4 text-base font-bold text-red-600 hover:bg-red-50 rounded-lg mt-2"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>


      <main>
        {/* Hero Section */}
        <section className="relative h-[calc(100vh-5rem)] flex items-center overflow-hidden">
          <ScrollHint />
          <div className="absolute inset-0 z-0">
            <img 
              src={assets.hero_bg || "/rsud-al-mulk.jpg"} 
              alt="RSUD AL-MULK Building" 
              className="w-full h-full object-cover object-top md:object-[center_10%]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-emerald-500/10"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start text-left">
            {heroVisible && (
              <>
                <motion.div 
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="max-w-2xl text-white"
                >
                  <span className="inline-block px-4 py-1 bg-emerald-500/50 backdrop-blur-md rounded-full text-sm font-semibold mb-6 border border-emerald-400/30">
                    Terakreditasi Paripurna
                  </span>
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}>
                    Pelayanan Kesehatan Terbaik
                  </h1>
                  <h2 
                    className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                    style={{ WebkitTextStroke: '1px rgba(52,211,153,0.5)' }}
                  >
                    Untuk Seluruh Lapisan Masyarakat
                  </h2>
                  <p 
                    className="text-xl md:text-2xl text-slate-600 mb-8 leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                    style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
                  >
                    Mudah, Cepat dan Terpercaya
                  </p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4"
                >
                  <button 
                    onClick={handleRippleClick} 
                    className="relative overflow-hidden w-full sm:w-auto px-8 py-4 rounded-full bg-white backdrop-blur-md border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-105 hover:shadow-xl transition-all duration-300 text-center group"
                  >
                    <span 
                      className="relative z-10 font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                      style={{ WebkitTextStroke: '0.5px rgba(5,150,105,0.4)' }}
                    >
                      {user?.role === 'admin' ? 'Dashboard' : 'Daftar Online'}
                    </span>
                  </button>
                  <a href="#layanan" className="w-full sm:w-auto border-2 border-white/50 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all text-center backdrop-blur-sm">
                    Lihat Layanan
                  </a>
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section id="next-section" className="py-12 bg-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-5xl font-bold text-emerald-700 mb-1">10</p>
                <p className="text-slate-600 font-medium">Dokter Spesialis</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-emerald-700 mb-1">24/7</p>
                <p className="text-slate-600 font-medium">IGD Siaga</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-emerald-700 mb-1">50+</p>
                <p className="text-slate-600 font-medium">Kapasitas Bed</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-emerald-700 mb-1">8</p>
                <p className="text-slate-600 font-medium">Poliklinik</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tentang Kami Section */}
        <section id="tentang" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative rounded-3xl shadow-2xl w-full overflow-hidden aspect-video bg-slate-50">
                  <AnimatePresence initial={false}>
                    <motion.img 
                      key={tentangKamiImageIndex}
                      src={tentangKamiImages[tentangKamiImageIndex]} 
                      alt="RSUD AL-MULK Team" 
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '-100%' }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0 w-full h-full object-contain bg-slate-50"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
                    {tentangKamiImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTentangKamiImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === tentangKamiImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex absolute -bottom-12 md:-bottom-18 right-2 md:right-4 z-30">
                  <div className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-xl border border-emerald-50">
                    <div className="flex items-center space-x-2 md:space-x-4 pr-2 md:pr-4">
                      <div className="p-2 md:p-3 bg-emerald-100 text-emerald-600 rounded-full">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <p className="text-lg md:text-2xl font-bold text-emerald-400 leading-tight">11+ Tahun</p>
                        <p className="text-xs md:text-base text-slate-500 font-medium">Melayani Sukabumi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div>
                <h3 className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4">Tentang Kami</h3>
                <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
                  Sejarah                        
                  UOBK RSUD AL-MULK
                </h2>
                <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                  UOBK RSUD AL-MULK Kota Sukabumi didirikan berdasarkan Perwal (Peraturan Walikota) Sukabumi Nomor 24 Tahun 2014. Nomor izin penyelenggaraan Rumah Sakit : 440/8/SIP-RS/BPMPT/XI/201, sebagai RSUD Type D Pratama dan diresmikan pada tanggal 15 Januari 2015. Tahun 201, dengan Nomor Izin Operasional : Nomor 440/02/SIO-RS/ DPMPTSP/II/2017 RSUD Al Mulk menjadi Rumah Sakit Kelas D dengan 50 TT.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 p-1 bg-emerald-100 text-emerald-600 rounded-full">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Visi</h4>
                      <p className="text-slate-600">Menjadi rumah sakit pilihan utama masyarakat dengan pelayanan yang profesional dan berorientasi pada keselamatan pasien.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 p-1 bg-emerald-100 text-emerald-600 rounded-full">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Misi</h4>
                      <p className="text-slate-600">Menyelenggarakan pelayanan kesehatan paripurna, bermutu, dan terjangkau serta meningkatkan kompetensi sumber daya manusia secara berkelanjutan.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layanan Unggulan Section */}
        <section id="layanan" className="py-24 relative overflow-hidden bg-emerald-900 text-white bg-fixed">
          {/* Glassmorphism Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>

          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
          >
            <div className="text-center max-w-4xl mx-auto mb-6">
              <h3 className="text-white/80 font-bold uppercase tracking-widest text-sm mb-4">Layanan Kami</h3>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-wide drop-shadow-md" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Layanan Unggulan & Fasilitas Medis</h2>
              <p className="text-white/80 text-lg font-light">
                Kami menyediakan berbagai layanan medis terpadu yang didukung oleh teknologi terkini dan tenaga medis profesional.
              </p>
            </div>

            <ServiceSlider services={SERVICES} onSelectService={(service) => {
              setSelectedService(service);
              setCurrentImageIndex(0);
            }} />
          </motion.div>
        </section>

        {/* Service Detail Modal */}
        <AnimatePresence>
          {selectedService && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
              onClick={() => setSelectedService(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden sm:my-8 h-full sm:h-auto flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-4">
                      {selectedService.icon === 'Activity' && <Activity size={20} />}
                      {selectedService.icon === 'Stethoscope' && <Stethoscope size={20} />}
                      {selectedService.icon === 'Microscope' && <Microscope size={20} />}
                      {selectedService.icon === 'Pill' && <Pill size={20} />}
                      {selectedService.icon === 'ShieldCheck' && <ShieldCheck size={20} />}
                    </div>
                    {selectedService.details.nama}
                  </h3>
                  <button onClick={() => setSelectedService(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6 md:p-8 flex-grow overflow-y-auto sm:max-h-[80vh]">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Info */}
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Informasi Layanan</h4>
                        <p className="text-slate-700 text-lg leading-relaxed mb-4">{selectedService.details.deskripsi}</p>
                        
                        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                          <div className="flex items-center">
                            <Clock size={18} className="text-emerald-600 mr-3" />
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Jam Operasional</p>
                              <p className="text-sm font-bold text-slate-900">{selectedService.details.jamOperasional}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Activity size={18} className="text-emerald-600 mr-3" />
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Jenis Pelayanan</p>
                              <p className="text-sm font-bold text-slate-900">{selectedService.details.jenisPelayanan}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Fasilitas Layanan</h4>
                        <ul className="space-y-2">
                          {selectedService.details.fasilitas.map((fasilitas: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle2 size={18} className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-700">{fasilitas}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {selectedService.id === 'vaksinasi' && (
                        <>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Jenis Vaksin Tersedia</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedService.details.vaksinTersedia.map((vaksin: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-100">
                                  {vaksin}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Informasi Tambahan</h4>
                            <ul className="space-y-2">
                              {selectedService.details.informasiTambahan.map((info: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                                  <span className="text-slate-700 text-sm">{info}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Column: Gallery */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Galeri Fasilitas</h4>
                        {user?.role === 'admin' && (
                          <div className="flex space-x-2">
                            <label className="cursor-pointer flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold hover:bg-emerald-200 transition-colors">
                              <Upload size={14} />
                              <span>Upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={isUploadingImage} />
                            </label>
                            {serviceImages.length > 0 && (
                              <>
                                <label className="cursor-pointer flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors">
                                  <Edit2 size={14} />
                                  <span>Edit</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleEditImage(e, serviceImages[currentImageIndex]?.id)} disabled={isUploadingImage} />
                                </label>
                                <button 
                                  onClick={() => handleDeleteImage(serviceImages[currentImageIndex]?.id)}
                                  disabled={isUploadingImage}
                                  className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition-colors"
                                >
                                  <Trash2 size={14} />
                                  <span>Hapus</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {serviceImages.length > 0 ? (
                        <>
                          <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3] group shadow-inner">
                            <img 
                              src={serviceImages[currentImageIndex]?.image_url || undefined} 
                              alt="Fasilitas" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                              referrerPolicy="no-referrer"
                              onClick={() => {
                                window.open(serviceImages[currentImageIndex]?.image_url, '_blank');
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end p-4">
                              <p className="text-white text-sm font-medium">Klik untuk memperbesar</p>
                            </div>
                            
                            {/* Slider Controls */}
                            {serviceImages.length > 1 && (
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex(prev => prev === 0 ? serviceImages.length - 1 : prev - 1);
                                  }}
                                  className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-800 hover:bg-white shadow-sm"
                                >
                                  <ChevronRight size={18} className="rotate-180" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex(prev => prev === serviceImages.length - 1 ? 0 : prev + 1);
                                  }}
                                  className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-800 hover:bg-white shadow-sm"
                                >
                                  <ChevronRight size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Thumbnails */}
                          {serviceImages.length > 1 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                              {serviceImages.map((img: any, idx: number) => (
                                <button
                                  key={img.id}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${currentImageIndex === idx ? 'border-emerald-500 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                  <img 
                                    src={img.image_url || undefined} 
                                    alt="Thumbnail" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full aspect-[4/3] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                          <p>Belum ada gambar fasilitas</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end flex-shrink-0">
                  <button 
                    onClick={() => {
                      setSelectedService(null);
                    }}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    Kembali
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fasilitas Section */}
        <section id="fasilitas" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4">Fasilitas & Teknologi</h3>
                <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                  Kenyamanan Pasien Adalah Prioritas Kami
                </h2>
                <p className="text-slate-600 mb-10 text-lg leading-relaxed">
                  Kami memahami bahwa lingkungan yang nyaman mendukung proses penyembuhan. RSUD AL-MULK dilengkapi dengan fasilitas penunjang yang modern dan lengkap.
                </p>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                    <div className="p-3 bg-white text-emerald-600 rounded-lg shadow-sm">
                      <Wifi size={24} />
                    </div>
                    <span className="font-semibold text-slate-700">Free WiFi Area</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                    <div className="p-3 bg-white text-emerald-600 rounded-lg shadow-sm">
                      <ParkingCircle size={24} />
                    </div>
                    <span className="font-semibold text-slate-700">Parkir Luas & Aman</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                    <div className="p-3 bg-white text-emerald-600 rounded-lg shadow-sm">
                      <Coffee size={24} />
                    </div>
                    <span className="font-semibold text-slate-700">Kantin & Area Tunggu</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                    <div className="p-3 bg-white text-emerald-600 rounded-lg shadow-sm">
                      <Activity size={24} />
                    </div>
                    <span className="font-semibold text-slate-700">Alat Medis Modern</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <img 
                  src={assets.fasilitas_waiting_room} 
                  alt="Waiting Room" 
                  className="rounded-2xl shadow-lg w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/rsud-al-mulk.jpg';
                  }}
                />
                <div className="space-y-4">
                  <img 
                    src={assets.teknologi_medical_device} 
                    alt="Medical Device" 
                    className="rounded-2xl shadow-lg w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/rsud-al-mulk.jpg';
                    }}
                  />
                  <img 
                    src={assets.fasilitas_hospital_ward} 
                    alt="Hospital Ward" 
                    className="rounded-2xl shadow-lg w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/rsud-al-mulk.jpg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section id="booking" className="py-24 bg-emerald-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-800/50 skew-x-12 translate-x-1/2"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Pendaftaran Poliklinik Online</h2>
                <p className="text-emerald-100 text-lg mb-10 leading-relaxed">
                  Kini Anda dapat mendaftar berobat dari mana saja. Dapatkan nomor antrian, pilih dokter spesialis, dan pantau status antrian Anda secara real-time melalui sistem pendaftaran online kami.
                </p>
                
                <div className="space-y-6 mb-10">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-emerald-300 text-sm">Cek Antrian Real-time</p>
                      <p className="text-lg font-bold">Pantau estimasi waktu tunggu</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-emerald-300 text-sm">Sistem Kuota Otomatis</p>
                      <p className="text-lg font-bold">Kepastian jadwal dokter</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl text-slate-900 text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Stethoscope size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Mulai Pendaftaran</h3>
                <p className="text-slate-600 mb-8">
                  Siapkan KTP dan nomor BPJS (jika ada) untuk mempercepat proses pendaftaran.
                </p>
                {user.role === 'patient' && (
                  <button 
                    onClick={() => setView('pendaftaran')}
                    className="w-full bg-gradient-to-r from-[#11998E] to-[#38EF7D] text-white py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(56,239,125,0.5)] hover:scale-[1.02] transition-all shadow-lg"
                  >
                    Buka Portal Pendaftaran
                  </button>
                )}
                {user.role === 'admin' && (
                  <button 
                    onClick={() => setView('dashboard')}
                    className="w-full bg-gradient-to-r from-[#11998E] to-[#38EF7D] text-white py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(56,239,125,0.5)] hover:scale-[1.02] transition-all shadow-lg"
                  >
                    Buka Dashboard Admin
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Dokter Section */}
        <section id="dokter" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h3 className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4">Tim Medis</h3>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">Rekomendasi Dokter Spesialis</h2>
                <p className="text-slate-600 text-lg">
                  Konsultasikan keluhan kesehatan Anda dengan tim dokter ahli kami yang berdedikasi tinggi.
                </p>
              </div>
              <button 
                onClick={() => setView('daftar-dokter')}
                className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-full font-bold hover:bg-emerald-100 transition-all flex items-center"
              >
                Lihat Semua Dokter <ChevronRight size={18} className="ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctorsList.filter(doc => doc.status_aktif === 'Aktif')
                .sort((a, b) => {
                  // First priority: is_rekomendasi
                  if (a.is_rekomendasi && !b.is_rekomendasi) return -1;
                  if (!a.is_rekomendasi && b.is_rekomendasi) return 1;
                  
                  // Second priority: urutan_rekomendasi (if both are recommended)
                  if (a.is_rekomendasi && b.is_rekomendasi) {
                    return (a.urutan_rekomendasi || 0) - (b.urutan_rekomendasi || 0);
                  }
                  
                  // Third priority: rating
                  return (b.rating || 0) - (a.rating || 0);
                })
                .slice(0, 4)
                .map((doc) => (
                <motion.div 
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
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
                  
                    {user.role === 'patient' && (
                      <button 
                        onClick={() => { setSelectedDoctorForBooking(doc); setView('pendaftaran'); }} 
                        disabled={doc.availability !== 'Tersedia'}
                        className={`w-full py-2.5 rounded-xl font-bold transition-all duration-300 mt-1 ${
                          doc.availability === 'Tersedia' 
                            ? 'bg-gradient-to-r from-[#11998E] to-[#38EF7D] text-white hover:shadow-[0_0_15px_rgba(56,239,125,0.4)] hover:scale-[1.02] shadow-sm' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Daftar Online
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4">Testimoni</h3>
              <h2 className="text-4xl font-bold text-slate-900">Apa Kata Pasien Kami?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t) => (
                <div key={t.id} className="bg-white p-8 rounded-3xl shadow-sm relative">
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-slate-600 italic mb-6 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold mr-3">
                      {t.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Logos Section */}
      {footerLogos.length > 0 && (
        <section className="bg-slate-50 py-10 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              {footerLogos.filter(logo => logo.gambar_logo).map((logo) => (
                <a 
                  key={logo.id_logo} 
                  href={logo.link_instansi || '#'} 
                  target={logo.link_instansi ? "_blank" : "_self"}
                  rel={logo.link_instansi ? "noopener noreferrer" : ""}
                  className="group transition-transform hover:scale-105 flex items-center justify-center w-full h-20"
                >
                  <img 
                    src={logo.gambar_logo} 
                    alt={logo.nama_instansi} 
                    className="max-h-[60px] md:max-h-[80px] w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    referrerPolicy="no-referrer"
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 lg:col-span-1">
               <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white-600 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden">
                {footerLogos.find(l => l.nama_instansi === 'logo_rsud')?.gambar_logo ? (
                  <img src={footerLogos.find(l => l.nama_instansi === 'logo_rsud')?.gambar_logo} alt="Logo RSUD" className="w-full h-full object-cover" />
                ) : (
                  <img src={assets.logo_footer || assets.logo_main || "/logo-1.jpg"} alt="Logo" className="w-full h-full object-cover" />
                )}
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">UOBK RSUD AL-MULK</h2>
                  <p className="text-[8px] uppercase tracking-widest text-emerald-400">Kota Sukabumi</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8">
                Memberikan pelayanan kesehatan yang unggul dan profesional untuk mewujudkan masyarakat Sukabumi yang sehat dan sejahtera.
              </p>
              {/* Social Media Icons */}
              <div className="mb-3">
                <p className="text-sm text-slate-400 font-medium">Silahkan Kunjungi Sosial Media Kami</p>
              </div>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {footerLogos.find(l => l.nama_instansi === 'sosmed_whatsapp')?.link_instansi && (
                  <a 
                    href={footerLogos.find(l => l.nama_instansi === 'sosmed_whatsapp')?.link_instansi} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-emerald-500 hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300"
                    title="WhatsApp"
                  >
                    <MessageCircle size={20} className="md:w-6 md:h-6" />
                  </a>
                )}
                {footerLogos.find(l => l.nama_instansi === 'sosmed_facebook')?.link_instansi && (
                  <a 
                    href={footerLogos.find(l => l.nama_instansi === 'sosmed_facebook')?.link_instansi} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-blue-600 hover:scale-110 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-300"
                    title="Facebook"
                  >
                    <Facebook size={20} className="md:w-6 md:h-6" />
                  </a>
                )}
                {footerLogos.find(l => l.nama_instansi === 'sosmed_instagram')?.link_instansi && (
                  <a 
                    href={footerLogos.find(l => l.nama_instansi === 'sosmed_instagram')?.link_instansi} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-pink-600 hover:scale-110 hover:shadow-[0_0_15px_rgba(219,39,119,0.5)] transition-all duration-300"
                    title="Instagram"
                  >
                    <Instagram size={20} className="md:w-6 md:h-6" />
                  </a>
                )}
                {footerLogos.find(l => l.nama_instansi === 'sosmed_tiktok')?.link_instansi && (
                  <a 
                    href={footerLogos.find(l => l.nama_instansi === 'sosmed_tiktok')?.link_instansi} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-800 hover:scale-110 hover:shadow-[0_0_15px_rgba(30,41,59,0.5)] transition-all duration-300"
                    title="TikTok"
                  >
                    <Video size={20} className="md:w-6 md:h-6" />
                  </a>
                )}
                {footerLogos.find(l => l.nama_instansi === 'sosmed_gmaps')?.link_instansi && (
                  <a 
                    href={footerLogos.find(l => l.nama_instansi === 'sosmed_gmaps')?.link_instansi} 
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

            <div>
              <h4 className="text-lg font-bold mb-6">Navigasi Cepat</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#tentang" className="hover:text-emerald-400 transition-all">Tentang Kami</a></li>
                <li><a href="#layanan" className="hover:text-emerald-400 transition-all">Layanan Medis</a></li>
                <li><a href="#dokter" className="hover:text-emerald-400 transition-all">Cari Dokter</a></li>
                {user.role === 'patient' && (
                  <li><button onClick={() => setView('pendaftaran')} className="hover:text-emerald-400 transition-all">Daftar Online</button></li>
                )}
                {user.role === 'admin' && (
                  <li><button onClick={() => setView('dashboard')} className="hover:text-emerald-400 transition-all">Dashboard Admin</button></li>
                )}
                <li><a href="#" className="hover:text-emerald-400 transition-all">Artikel Kesehatan</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Kontak Kami</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-start">
                  <MapPin size={20} className="mr-3 text-emerald-500 flex-shrink-0 mt-1" />
                  <span>Jl. Pelabuhan II No.KM. 6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43169</span>
                </li>
                <li className="flex items-center">
                  <Phone size={20} className="mr-3 text-emerald-500 flex-shrink-0" />
                  <span>(0266) 6243088</span>
                </li>
                <li className="flex items-center">
                  <Mail size={20} className="mr-3 text-emerald-500 flex-shrink-0" />
                  <span>info:rsudalmulk@gmail.com</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Newsletter</h4>
              <p className="text-slate-400 mb-6">Dapatkan tips kesehatan dan info terbaru dari kami.</p>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Email Anda" 
                  className="bg-slate-800 border-none rounded-l-xl px-4 py-3 w-full focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button className="bg-emerald-600 px-4 py-3 rounded-r-xl hover:bg-emerald-700 transition-all">
                  <ChevronRight size={20} />
                </button>
              </form>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
            <p>© 2026 UOBK RSUD AL-MULK KOTA SUKABUMI. All rights reserved.</p>
            <div className="flex space-x-8">
              <a href="#" className="hover:text-white transition-all">Kebijakan Privasi</a>
              <a href="#" className="hover:text-white transition-all">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </motion.div>
      )}
    </AnimatePresence>

      {/* Custom Modal */}
      <AnimatePresence>
        {modalMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{modalMessage.title}</h3>
                <p className="text-slate-600 mb-6">{modalMessage.message}</p>
                <div className="flex justify-end space-x-3">
                  {modalMessage.type === 'confirm' && (
                    <button
                      onClick={() => setModalMessage(null)}
                      className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (modalMessage.type === 'confirm' && modalMessage.onConfirm) {
                        modalMessage.onConfirm();
                      }
                      setModalMessage(null);
                    }}
                    className={`px-4 py-2 text-white font-medium rounded-xl transition-colors ${
                      modalMessage.type === 'confirm' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {modalMessage.type === 'confirm' ? 'Hapus' : 'Tutup'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Suspense>
  );
}
