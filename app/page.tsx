"use client";

import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  BedDouble, 
  Stethoscope, 
  Calendar, 
  Search, 
  Bell, 
  Menu, 
  UserPlus, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react';

export default function HospitalDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const stats = [
    { title: 'Total Pasien', value: '1,284', icon: Users, color: 'bg-blue-500' },
    { title: 'Kamar Tersedia', value: '142', icon: BedDouble, color: 'bg-emerald-500' },
    { title: 'Dokter Aktif', value: '48', icon: Stethoscope, color: 'bg-indigo-500' },
    { title: 'Operasi Hari Ini', value: '12', icon: Activity, color: 'bg-rose-500' },
  ];

  const recentPatients = [
    { id: 'P-001', name: 'Budi Santoso', age: 45, condition: 'Hipertensi', status: 'Rawat Inap', room: 'Melati 102', time: '08:30 AM' },
    { id: 'P-002', name: 'Siti Aminah', age: 32, condition: 'Demam Berdarah', status: 'Kritis', room: 'ICU 04', time: '09:15 AM' },
    { id: 'P-003', name: 'Andi Wijaya', age: 28, condition: 'Fraktur Lengan', status: 'Pemulihan', room: 'Mawar 205', time: '10:00 AM' },
    { id: 'P-004', name: 'Rina Marlina', age: 50, condition: 'Diabetes', status: 'Rawat Jalan', room: '-', time: '10:45 AM' },
    { id: 'P-005', name: 'Joko Anwar', age: 60, condition: 'Penyakit Jantung', status: 'Observasi', room: 'IGD', time: '11:20 AM' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16">
          {sidebarOpen && <div className="font-bold text-lg flex items-center gap-2"><Activity className="text-blue-400" /> RS Sejahtera</div>}
          {!sidebarOpen && <Activity className="text-blue-400 mx-auto" />}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2 px-2">
            {[
              { icon: Activity, label: 'Dashboard', active: true },
              { icon: Users, label: 'Pasien' },
              { icon: Calendar, label: 'Jadwal' },
              { icon: BedDouble, label: 'Ruangan' },
              { icon: FileText, label: 'Laporan' },
              { icon: Settings, label: 'Pengaturan' },
            ].map((item, idx) => (
              <li key={idx}>
                <a href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <item.icon size={20} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span>Keluar</span>}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors">
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari pasien, dokter..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all w-64" 
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="relative text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">3</span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                DR
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-slate-700 leading-tight">Dr. Hendra</p>
                <p className="text-slate-500 text-xs">Admin Utama</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Ringkasan aktivitas rumah sakit hari ini.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
              <UserPlus size={18} />
              Pasien Baru
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Patients Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-slate-800">Pasien Terbaru</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">Lihat Semua</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="px-5 py-3 font-medium">ID Pasien</th>
                    <th className="px-5 py-3 font-medium">Nama</th>
                    <th className="px-5 py-3 font-medium">Kondisi</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Ruangan</th>
                    <th className="px-5 py-3 font-medium">Waktu Masuk</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentPatients.map((patient, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-700">{patient.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{patient.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{patient.age} Tahun</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{patient.condition}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          patient.status === 'Kritis' ? 'bg-rose-100 text-rose-700' :
                          patient.status === 'Rawat Inap' ? 'bg-blue-100 text-blue-700' :
                          patient.status === 'Pemulihan' ? 'bg-emerald-100 text-emerald-700' :
                          patient.status === 'Observasi' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{patient.room}</td>
                      <td className="px-5 py-4 text-slate-500">{patient.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
