import React, { useState, useEffect } from 'react';
import { getAppointmentsDB } from '../db';
import { Volume2 } from 'lucide-react';

export default function DisplayAntrian() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAppointments = async () => {
    const data = await getAppointmentsDB();
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAppointments = data.filter((a: any) => a.tanggal_kunjungan === todayStr);
    setAppointments(todaysAppointments);
  };

  useEffect(() => {
    fetchAppointments();

    const eventSource = new EventSource('/api/queue/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'STATUS_UPDATE') {
        fetchAppointments();
        
        if (data.appointment.status_antrian === 'Sedang Dilayani') {
          setCurrentCall(data.appointment);
          playVoiceCall(data.appointment);
        }
      }
    };

    return () => {
      eventSource.close();
    };
  }, [audioEnabled]); // Re-bind if audioEnabled changes, though playVoiceCall uses window.speechSynthesis directly

  const playVoiceCall = (appointment: any) => {
    if (!audioEnabled) return;
    if ('speechSynthesis' in window) {
      const text = `Nomor antrian ${appointment.nomor_antrian}, silakan menuju ${appointment.poli}, dokter ${appointment.dokter}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.85; // Slightly slower for clarity
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const enableAudio = () => {
    setAudioEnabled(true);
    // Play a silent utterance to unlock audio context on some browsers
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
    }
  };

  const sedangDilayani = appointments.filter(a => a.status_antrian === 'Sedang Dilayani');
  const menunggu = appointments.filter(a => a.status_antrian === 'Menunggu').slice(0, 5); // Next 5

  if (!audioEnabled) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Volume2 size={64} className="text-emerald-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold text-white mb-4">Display Antrian Digital</h1>
          <p className="text-slate-400 mb-8">Klik tombol di bawah untuk mengaktifkan suara panggilan</p>
          <button 
            onClick={enableAudio}
            className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/25"
          >
            Mulai Display & Aktifkan Suara
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-emerald-500/20 shadow-lg">
            <span className="text-3xl font-bold text-white">RS</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">DISPLAY ANTRIAN</h1>
            <p className="text-emerald-400 font-medium text-lg">UOBK RSUD AL-MULK</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold font-mono tracking-wider text-white">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-slate-400 font-medium mt-1">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Call Section (Takes 2 columns) */}
        <div className="lg:col-span-2 flex flex-col space-y-8">
          <div className="bg-slate-800 rounded-3xl p-10 border border-slate-700 shadow-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            
            {currentCall ? (
              <div className="text-center w-full animate-in fade-in zoom-in duration-500">
                <div className="inline-flex items-center justify-center space-x-3 bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-full mb-8 border border-emerald-500/20">
                  <Volume2 size={24} className="animate-pulse" />
                  <span className="text-xl font-bold tracking-widest uppercase">Panggilan Antrian</span>
                </div>
                
                <h2 className="text-[12rem] font-black font-mono leading-none tracking-tighter text-white mb-8 drop-shadow-2xl">
                  {currentCall.nomor_antrian}
                </h2>
                
                <div className="grid grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Poli Tujuan</p>
                    <p className="text-3xl font-bold text-emerald-400">{currentCall.poli}</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Dokter</p>
                    <p className="text-3xl font-bold text-white">{currentCall.dokter}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <Volume2 size={64} className="mx-auto mb-6 opacity-20" />
                <p className="text-2xl font-medium">Belum ada panggilan antrian</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col space-y-6">
          {/* Sedang Dilayani List */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex-1">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-3 animate-pulse"></span>
              Sedang Dilayani
            </h3>
            <div className="space-y-4">
              {sedangDilayani.length > 0 ? (
                sedangDilayani.map(a => (
                  <div key={a.id_booking} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold font-mono text-white">{a.nomor_antrian}</p>
                      <p className="text-sm text-slate-400 mt-1">{a.poli}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        Dilayani
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">Tidak ada antrian yang sedang dilayani</p>
              )}
            </div>
          </div>

          {/* Menunggu List */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex-1">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-3"></span>
              Antrian Berikutnya
            </h3>
            <div className="space-y-3">
              {menunggu.length > 0 ? (
                menunggu.map((a, idx) => (
                  <div key={a.id_booking} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <span className="text-slate-500 font-bold w-4">{idx + 1}.</span>
                      <p className="text-xl font-bold font-mono text-slate-300">{a.nomor_antrian}</p>
                    </div>
                    <p className="text-xs text-slate-400">{a.poli}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">Tidak ada antrian menunggu</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Ticker */}
      <div className="bg-emerald-600 text-white py-3 px-6 overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee inline-block">
          <span className="mx-4 font-medium">Selamat Datang di UOBK RSUD AL-MULK</span>
          <span className="mx-4">•</span>
          <span className="mx-4 font-medium">Mohon siapkan kartu identitas dan kartu BPJS (jika ada) saat dipanggil</span>
          <span className="mx-4">•</span>
          <span className="mx-4 font-medium">Tetap patuhi protokol kesehatan selama berada di area rumah sakit</span>
          <span className="mx-4">•</span>
          <span className="mx-4 font-medium">Layanan Pengaduan: 0811-XXXX-XXXX</span>
        </div>
      </div>
    </div>
  );
}
