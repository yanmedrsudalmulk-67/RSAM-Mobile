import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Clock, Calendar } from 'lucide-react';

export function DisplayTV() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [callingQueue, setCallingQueue] = useState<any | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/appointments');
        if (response.ok) {
          const data = await response.json();
          // Filter for today in Jakarta timezone
          const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(new Date());
          const todayAppointments = data.filter((app: any) => app.tanggal_kunjungan === today);
          setAppointments(todayAppointments);
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      }
    };

    fetchAppointments();
    const interval = setInterval(fetchAppointments, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for calling queue from localStorage or similar mechanism
  // For simplicity, we can check if any appointment has a specific flag, but since we don't have a flag in DB,
  // we might need to rely on the "Sedang Dilayani" status change, or a separate API.
  // Actually, the requirement says "Display TV untuk ruang tunggu".
  // Let's just show the currently serving and next in line per poly.

  const activePolis = Array.from(new Set(appointments.map(a => a.poli)));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-6 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img 
            src="https://picsum.photos/seed/hospital-logo/100/100" 
            alt="Hospital" 
            className="w-16 h-16 rounded-full border-4 border-white/20 bg-white"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight">RSUD AL-MULK</h1>
            <p className="text-emerald-100 font-medium text-lg">Layanan Kesehatan Terpadu</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black tracking-tighter">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-emerald-100 font-medium text-lg">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Currently Calling (if any) or Main Info */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <Volume2 size={64} className="text-emerald-500 mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-widest mb-2">Panggilan Antrian</h2>
            <div className="text-8xl font-black text-slate-900 tracking-tighter my-8">
              {/* Display the most recently called or currently serving */}
              {appointments.filter(a => a.status_antrian === 'Sedang Dilayani')[0]?.nomor_antrian || '---'}
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {appointments.filter(a => a.status_antrian === 'Sedang Dilayani')[0]?.poli || 'Menunggu Panggilan'}
            </div>
            <div className="text-lg font-medium text-slate-500 mt-2">
              {appointments.filter(a => a.status_antrian === 'Sedang Dilayani')[0]?.dokter || ''}
            </div>
          </div>
          
          {/* Video/Image Placeholder */}
          <div className="bg-slate-200 rounded-[32px] overflow-hidden shadow-inner aspect-video relative">
            <img 
              src="https://picsum.photos/seed/hospital-video/800/600" 
              alt="Hospital Promo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-white border-b-8 border-b-transparent ml-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Queue per Poly */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePolis.map(poli => {
            const poliAppointments = appointments.filter(a => a.poli === poli);
            const serving = poliAppointments.find(a => a.status_antrian === 'Sedang Dilayani');
            const nextInLine = poliAppointments.filter(a => a.status_antrian === 'Menunggu' || a.status_antrian === 'Belum Check-In').slice(0, 3);
            
            return (
              <div key={poli} className="bg-white rounded-[24px] shadow-md border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-slate-800 text-white p-4 text-center">
                  <h3 className="text-xl font-bold">{poli}</h3>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Sedang Dilayani</p>
                    <div className="text-5xl font-black text-emerald-600">
                      {serving ? serving.nomor_antrian : '---'}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Selanjutnya</p>
                    <div className="space-y-2">
                      {nextInLine.map((app, idx) => (
                        <div key={app.id_booking} className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl">
                          <span className="font-bold text-slate-700">{app.nomor_antrian}</span>
                          <span className="text-xs font-medium text-slate-500">{app.nama_pasien}</span>
                        </div>
                      ))}
                      {nextInLine.length === 0 && (
                        <div className="text-center py-2 text-sm text-slate-400 font-medium">Tidak ada antrian</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      
      {/* Footer Ticker */}
      <footer className="bg-slate-900 text-white py-3 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-[marquee_20s_linear_infinite]">
          <span className="mx-8 text-emerald-400 font-bold">INFO:</span> Harap siapkan kartu identitas dan kartu BPJS Anda sebelum dipanggil. 
          <span className="mx-8 text-emerald-400 font-bold">INFO:</span> Tetap patuhi protokol kesehatan selama berada di area rumah sakit.
          <span className="mx-8 text-emerald-400 font-bold">INFO:</span> Jam besuk pasien: 10:00 - 12:00 dan 17:00 - 19:00.
        </div>
      </footer>
    </div>
  );
}
