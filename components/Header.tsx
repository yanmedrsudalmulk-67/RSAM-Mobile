import { Bell, Search, Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center flex-1">
        <button className="md:hidden p-2 mr-2 text-slate-400 hover:text-slate-600">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari pasien, dokter, atau dokumen..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors hidden sm:block">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-3 sm:border-l border-slate-200 sm:pl-4">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            AD
          </div>
          <div className="hidden lg:block text-sm">
            <p className="font-medium text-slate-700">Dr. Andi Darmawan</p>
            <p className="text-slate-500 text-xs">Dokter Umum</p>
          </div>
        </div>
      </div>
    </header>
  );
}
