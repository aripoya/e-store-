import type { PainPoint, Solution, Course, Testimonial, Stat } from '../types/homepage';

export const stats: Stat[] = [
  { value: '500+', label: 'Pebisnis Tergabung' },
  { value: '25+', label: 'Materi Pembelajaran' },
  { value: '95%', label: 'Rating Kepuasan' },
];

export const painPoints: PainPoint[] = [
  {
    icon: '🤯',
    title: 'Bingung Mulai Dari Mana?',
    description: 'Digitalisasi terasa overwhelming. Terlalu banyak pilihan, tidak tahu harus mulai dari langkah apa.',
    image: 'https://cover.jogjabootcamp.com/Card%20halaman%20depan/Bingung%20memulai%20dari%20mana%3F.png',
  },
  {
    icon: '🤖',
    title: 'AI Terasa Rumit?',
    description: 'Semua orang bicara tentang AI, tapi bagaimana cara pakainya untuk bisnis Anda?',
    image: 'https://cover.jogjabootcamp.com/Card%20halaman%20depan/AI%20terasa%20rumit%20card.png',
  },
  {
    icon: '📉',
    title: 'Tertinggal dari Kompetitor?',
    description: 'Kompetitor sudah go digital, bisnis Anda masih jalan di tempat.',
    image: 'https://cover.jogjabootcamp.com/Card%20halaman%20depan/Tertinggal%20dari%20kompetitor.png',
  },
];

export const solutions: Solution[] = [
  {
    icon: '🎓',
    title: 'Kursus Online',
    description: 'Pembelajaran terstruktur dari dasar hingga mahir',
    color: 'gold',
  },
  {
    icon: '📚',
    title: 'Ebook & Panduan',
    description: 'Materi yang bisa dipelajari kapan saja',
    color: 'navy',
  },
  {
    icon: '💬',
    title: 'Konsultasi 1-on-1',
    description: 'Diskusi langsung dengan praktisi berpengalaman',
    color: 'gold',
  },
  {
    icon: '👥',
    title: 'Komunitas Eksklusif',
    description: 'Networking dengan sesama pebisnis digital',
    color: 'navy',
  },
];

export const courses: Course[] = [
  {
    id: '1',
    title: 'Fundamental Digitalisasi UMKM',
    level: 'Pemula',
    duration: '8 Jam',
    price: 'Rp 299.000',
    icon: '📊',
  },
  {
    id: '2',
    title: 'AI untuk Bisnis: ChatGPT & Beyond',
    level: 'Menengah',
    duration: '12 Jam',
    price: 'Rp 499.000',
    icon: '🤖',
  },
  {
    id: '3',
    title: 'Digital Marketing Masterclass',
    level: 'Semua Level',
    duration: '15 Jam',
    price: 'Rp 599.000',
    icon: '📱',
  },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    business: 'Pemilik Toko Kelontong',
    text: 'Sekarang saya sudah punya toko online dan omset naik 40%!',
    avatar: '👨‍💼',
  },
  {
    id: '2',
    name: 'Sari Dewi',
    business: 'UMKM Kuliner',
    text: 'Belajar pakai AI untuk bikin konten, sekarang followers naik terus.',
    avatar: '👩‍💼',
  },
  {
    id: '3',
    name: 'Hendra Wijaya',
    business: 'Jasa Fotografi',
    text: 'Konsultasinya sangat membantu. Bisnis saya lebih terarah.',
    avatar: '👨‍💼',
  },
];
