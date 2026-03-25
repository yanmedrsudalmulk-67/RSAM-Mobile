import { Search, Plus, MoreVertical } from 'lucide-react';

const patients = [
  { id: 'RM-00123', name: 'Budi Santoso', age: 45, gender: 'Laki-laki', blood: 'O', status: 'Rawat Inap', date: '18 Mar 2026' },
  { id: 'RM-00124', name: 'Siti Aminah', age: 32, gender: 'Perempuan', blood: 'A', status: 'Rawat Jalan', date: '18 Mar 2026' },
  { id: 'RM-00125', name: 'Ahmad Dahlan', age: 58, gender: 'Laki-laki', blood: 'B', status: 'IGD', date: '18 Mar 2026' },
  { id: 'RM-00126', name: 'Rina Melati', age: 27, gender: 'Perempuan', blood: 'AB', status: 'Pulang', date: '17 Mar 2026' },
  { id: 'RM-00127', name: 'Joko Widodo', age: 62, gender: 'Laki-laki', blood: 'O', status: 'Rawat Inap', date: '16 Mar 2026' },
];

export default function PatientsList() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Pasien</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data dan rekam medis pasien.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Pasien Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau no. RM..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <select className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto">
              <option>Semua Status</option>
              <option>Rawat Inap</option>
              <option>Rawat Jalan</option>
              <option>IGD</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">No. RM</th>
                <th className="p-4">Nama Pasien</th>
                <th className="p-4">Umur / JK</th>
                <th className="p-4">Gol. Darah</th>
                <th className="p-4">Tanggal Masuk</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-900">{patient.id}</td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mr-3 shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{patient.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{patient.age} thn / {patient.gender === 'Laki-laki' ? 'L' : 'P'}</td>
                  <td className="p-4 text-sm text-slate-600 font-medium">{patient.blood}</td>
                  <td className="p-4 text-sm text-slate-600">{patient.date}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                      ${patient.status === 'Rawat Inap' ? 'bg-blue-100 text-blue-800' : 
                        patient.status === 'Rawat Jalan' ? 'bg-emerald-100 text-emerald-800' : 
                        patient.status === 'IGD' ? 'bg-rose-100 text-rose-800' : 
                        'bg-slate-100 text-slate-800'}`}
                    >
                      {patient.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 bg-slate-50/50">
          <span>Menampilkan 1 hingga 5 dari 1,245 pasien</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50" disabled>Sebelumnya</button>
            <button className="px-3 py-1 border border-slate-200 rounded bg-blue-50 text-blue-600 font-medium hidden sm:block">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 hidden sm:block">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 hidden sm:block">3</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100">Selanjutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
