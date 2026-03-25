'use client';

import { Users, Bed, Activity, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Sen', pasien: 40 },
  { name: 'Sel', pasien: 30 },
  { name: 'Rab', pasien: 45 },
  { name: 'Kam', pasien: 50 },
  { name: 'Jum', pasien: 35 },
  { name: 'Sab', pasien: 20 },
  { name: 'Min', pasien: 15 },
];

export default function DashboardOverview() {
  const stats = [
    { label: 'Total Pasien', value: '1,245', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Kamar Tersedia', value: '42', icon: Bed, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Operasi Hari Ini', value: '8', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'Pendapatan', value: 'Rp 45Jt', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dasbor</h1>
        <p className="text-slate-500 text-sm mt-1">Ringkasan aktivitas rumah sakit hari ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Statistik Kunjungan Pasien</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPasien" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="pasien" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPasien)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Janji Temu Terdekat</h2>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Lihat Semua</button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Budi Santoso', time: '09:00 AM', doctor: 'Dr. Sarah', type: 'Pemeriksaan Umum' },
              { name: 'Siti Aminah', time: '10:30 AM', doctor: 'Dr. Andi', type: 'Konsultasi Jantung' },
              { name: 'Ahmad Dahlan', time: '11:15 AM', doctor: 'Dr. Budi', type: 'Poli Gigi' },
              { name: 'Rina Melati', time: '01:00 PM', doctor: 'Dr. Sarah', type: 'Pemeriksaan Umum' },
            ].map((apt, i) => (
              <div key={i} className="flex items-start p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-3 shrink-0">
                  {apt.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{apt.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{apt.type} • {apt.doctor}</p>
                </div>
                <div className="ml-2 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                  {apt.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
