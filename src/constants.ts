import { Doctor, Service, Testimonial } from './types';

export const DOCTORS: Doctor[] = [
  {
    id: '1',
    name: 'dr. Hijrah Saputra WR, Sp.PD',
    specialty: 'Spesialis Penyakit Dalam',
    schedule: 'Senin dan Rabu: 07.30 - 09.00, Jumat : 12:30 - 15:00',
    imageUrl: '/doctor-1.jpg',
    rating: 4.9,
    status_aktif: 'Aktif',
    availability: 'Tersedia',
    nextSchedule: 'Hari ini: 07:30 - 09:00',
    slotsAvailable: 3,
  },
  {
    id: '2',
    name: 'dr. Niko Adhi H, Sp.PD, M.Kes, FINASIM',
    specialty: 'Spesialis Penyakit Dalam',
    schedule: 'Selasa: 15:00 - 18:00',
    imageUrl: '/doctor-2.jpg',
    rating: 4.8,
    status_aktif: 'Aktif',
    availability: 'Tidak Praktik Hari Ini',
    nextSchedule: 'Besok: 15:00 - 18:00',
    slotsAvailable: 5,
  },
  {
    id: '3',
    name: 'dr. Dhyniek Nurul FLA, Sp.A',
    specialty: 'Spesialis Anak',
    schedule: 'Senin - Jumat: 08.00 - 10.00',
    imageUrl: '/doctor-3.jpg',
    rating: 5.0,
    status_aktif: 'Aktif',
    availability: 'Tersedia',
    nextSchedule: 'Hari ini: 08:00 - 10:00',
    slotsAvailable: 2,
  },
  {
    id: '4',
    name: 'dr. Ferry Sudarsono, Sp.B, FINACS',
    specialty: 'Spesialis Bedah Umum',
    schedule: 'Senin - Jumat: 07.30 - 11.00',
    imageUrl: '/doctor-4.jpg',
    rating: 4.7,
    status_aktif: 'Aktif',
    availability: 'Jadwal Penuh',
    nextSchedule: 'Hari ini: 07:30 - 11:00',
    slotsAvailable: 0,
  },
  {
    id: '5',
    name: 'dr. Billy Nusa Anggara T, Sp.OG',
    specialty: 'Spesialis Kebidanan & Kandungan',
    schedule: 'Senin, Rabu dan Jumat : 16.00 - 18.00',
    imageUrl: '/doctor-5.jpg',
    rating: 4.9,
    status_aktif: 'Aktif',
    availability: 'Tersedia',
    nextSchedule: 'Hari ini: 16:00 - 18:00',
    slotsAvailable: 4,
  },
   {
    id: '6',
    name: 'dr. Muthiah Nurul I, Sp.OG',
    specialty: 'Spesialis Kebidanan & Kandungan',
    schedule: 'Senin dan Kamis : 15.00 - 18.00',
    rating: 4.6,
    status_aktif: 'Aktif',
    availability: 'Tidak Praktik Hari Ini',
    nextSchedule: 'Besok: 15:00 - 18:00',
    slotsAvailable: 6,
  },
  {
    id: '7',
    name: 'dr. Haris Nur, Sp.N',
    specialty: 'Spesialis Neurologi',
    schedule: 'Senin, Rabu dan Jumat : 15.30 - 18.00',
    rating: 4.8,
    status_aktif: 'Aktif',
    availability: 'Tersedia',
    nextSchedule: 'Hari ini: 15:30 - 18:00',
    slotsAvailable: 1,
  },
  {
    id: '8',
    name: 'dr. Diana Ratna Dewi, Sp.PK',
    specialty: 'Spesialis Patologi Klinik',
    schedule: 'Senin - Sabtu : 08.00 - 12.00',
    imageUrl: '/doctor-8.jpg',
    rating: 4.5,
    status_aktif: 'Aktif',
    availability: 'Tersedia',
    nextSchedule: 'Hari ini: 08:00 - 12:00',
    slotsAvailable: 8,
  },
  {
    id: '9',
    name: 'dr. Rosilah, Sp.Rad',
    specialty: 'Spesialis Radiologi',
    schedule: 'Selasa : 07.00 - 09.00, Sabtu : 09.00 - 11.00',
    rating: 4.7,
    status_aktif: 'Aktif',
    availability: 'Tidak Praktik Hari Ini',
    nextSchedule: 'Besok: 07:00 - 09:00',
    slotsAvailable: 3,
  },
  {
    id: '10',
    name: 'Lelawati',
    specialty: 'Poli Gigi',
    schedule: 'Senin - Sabtu : 08.00 - 12.00',
    rating: 4.6,
    status_aktif: 'Aktif',
    availability: 'Tersedia',
    nextSchedule: 'Hari ini: 08:00 - 12:00',
    slotsAvailable: 2,
  },
  {
    id: '11',
    name: 'dr. M. Arifin Ramadhani',
    specialty: 'Poli Umum & Vaksinasi',
    schedule: 'Senin - Sabtu : 08.00 - 14.00',
    rating: 4.8,
    status_aktif: 'Aktif',
    availability: 'Tersedia',
    nextSchedule: 'Hari ini: 08:00 - 14:00',
    slotsAvailable: 10,
  },
];

export const SERVICES: any[] = [
  {
    id: 'igd',
    title: 'IGD 24 Jam',
    description: 'Layanan gawat darurat yang siap siaga 24 jam dengan tenaga medis profesional.',
    icon: 'Activity',
    details: {
      nama: 'IGD 24 Jam',
      deskripsi: 'Pelayanan kegawatdaruratan selama 24 jam dengan dukungan dokter dan tenaga medis profesional.',
      jamOperasional: '24 Jam',
      jenisPelayanan: 'Gawat Darurat',
      fasilitas: [
        'Jumlah Bed IGD : 14',
        'Ruang Observasi : 4',
        'Ruang Resusitasi : 2',
        'Ambulance : 2 Unit'
      ],
      images: ['/rsud-al-mulk.jpg', '/fasilitas-4.jpg']
    }
  },
  {
    id: 'poli',
    title: 'Poliklinik Spesialis',
    description: 'Berbagai layanan poliklinik spesialis untuk konsultasi dan penanganan medis yang komprehensif.',
    icon: 'Stethoscope',
    details: {
      nama: 'Poliklinik Spesialis',
      deskripsi: 'Pelayanan rawat jalan dengan berbagai dokter spesialis yang berpengalaman di bidangnya.',
      jamOperasional: 'Senin - Sabtu: 08:00 - 14:00',
      jenisPelayanan: 'Rawat Jalan Spesialistik',
      fasilitas: [
        'Ruang Tunggu Nyaman',
        'Sistem Antrian Digital',
        'Ruang Konsultasi Privat',
        'Peralatan Diagnostik Dasar'
      ],
      images: ['/fasilitas-1.jpg', '/fasilitas-2.jpg']
    }
  },
  {
    id: 'radio',
    title: 'Radiologi & Laboratorium',
    description: 'Fasilitas penunjang medis modern untuk diagnosis yang akurat dan cepat.',
    icon: 'Microscope',
    details: {
      nama: 'Radiologi & Laboratorium',
      deskripsi: 'Layanan penunjang diagnostik dengan peralatan modern untuk hasil yang cepat dan akurat.',
      jamOperasional: '24 Jam',
      jenisPelayanan: 'Penunjang Diagnostik',
      fasilitas: [
        'Mesin X-Ray Digital',
        'USG 4 Dimensi',
        'Laboratorium Patologi Klinik',
        'Sistem Informasi Laboratorium (LIS)'
      ],
      images: ['/ruang radiologi-2.jpg', '/fasilitas-3.jpg']
    }
  },
  {
    id: 'farmasi',
    title: 'Farmasi',
    description: 'Pelayanan obat-obatan lengkap dan terjamin kualitasnya untuk mendukung pemulihan pasien.',
    icon: 'Pill',
    details: {
      nama: 'Instalasi Farmasi',
      deskripsi: 'Penyediaan obat-obatan dan alat kesehatan dengan standar mutu terjamin.',
      jamOperasional: '24 Jam',
      jenisPelayanan: 'Pelayanan Obat & Alkes',
      fasilitas: [
        'Apotek Rawat Jalan',
        'Apotek Rawat Inap',
        'Ruang Konseling Obat',
        'Penyimpanan Obat Standar'
      ],
      images: ['/apotek.jpg', '/apotek-2.jpg']
    }
  },
  {
    id: 'vaksinasi',
    title: 'Poli Vaksinasi Internasional',
    description: 'Pelayanan vaksinasi untuk keperluan perjalanan internasional, umroh, dan haji.',
    icon: 'ShieldCheck',
    details: {
      nama: 'Poli Vaksinasi Internasional',
      deskripsi: 'Pelayanan vaksinasi khusus untuk pelaku perjalanan internasional dengan sertifikasi resmi.',
      jamOperasional: 'Senin - Jumat: 08:00 - 14:00',
      jenisPelayanan: 'Vaksinasi & Sertifikasi',
      fasilitas: [
        'Ruang Vaksinasi Khusus',
        'Cold Chain Standard WHO',
        'Ruang Observasi KIPI',
        'Penerbitan Buku Kuning (ICV)'
      ],
      vaksinTersedia: [
        'Vaksin Meningitis',
        'Vaksin Polio',
        'Vaksin Influenza'
      ],
      informasiTambahan: [
        'Pelayanan vaksin untuk perjalanan internasional',
        'Persyaratan vaksin umroh dan haji',
        'Penerbitan International Certificate of Vaccination (ICV)'
      ],
      images: ['/ruang-vaksinasi.jpg', '/ruang-vaksinasi-2.jpg', '/ruang-vaksinasi-3.jpg']
    }
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Bapak Yudi',
    text: 'Pelayanan di RSUD AL-MULK sangat cepat dan ramah. Fasilitasnya juga sangat bersih dan nyaman.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Ibu Hindun',
    text: 'Dokter spesialisnya sangat komunikatif dan menjelaskan kondisi saya dengan sangat detail. Terima kasih.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Sdri. Ina',
    text: 'Proses pendaftaran dan Daftar Online sangat mudah. Tidak perlu antre lama di rumah sakit.',
    rating: 4,
  },
];
