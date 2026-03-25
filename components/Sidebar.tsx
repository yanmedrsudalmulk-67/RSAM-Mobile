import { LayoutDashboard, Users, Calendar, Stethoscope, Pill, Settings, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'patients', label: 'Pasien', icon: Users },
    { id: 'appointments', label: 'Janji Temu', icon: Calendar },
    { id: 'doctors', label: 'Dokter', icon: Stethoscope },
    { id: 'pharmacy', label: 'Farmasi', icon: Pill },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Activity className="h-6 w-6 text-blue-600 mr-2" />
        <span className="font-bold text-lg tracking-tight text-slate-900">MedikaCare</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={clsx(
                    "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={clsx("h-5 w-5 mr-3", isActive ? "text-blue-700" : "text-slate-400")} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200">
        <button className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Settings className="h-5 w-5 mr-3 text-slate-400" />
          Pengaturan
        </button>
      </div>
    </div>
  );
}
