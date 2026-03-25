import React from 'react';
import { Home, CalendarPlus, Activity, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function BottomNavigation({ currentView, setCurrentView }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Beranda' },
    { id: 'buat-janji', icon: CalendarPlus, label: 'Daftar Online' },
    { id: 'cek-antrian', icon: Activity, label: 'Antrian' },
    { id: 'profil', icon: User, label: 'Profil' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-emerald-100' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
