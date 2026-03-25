export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  schedule: string;
  imageUrl?: string;
  rating?: number;
  status_aktif?: 'Aktif' | 'Nonaktif';
  availability?: 'Tersedia' | 'Jadwal Penuh' | 'Tidak Praktik Hari Ini' | 'Sedang Cuti';
  nextSchedule?: string;
  slotsAvailable?: number;
  is_rekomendasi?: boolean;
  urutan_rekomendasi?: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}
