export interface PainPoint {
  icon: string;
  title: string;
  description: string;
  image?: string;
}

export interface Solution {
  icon: string;
  title: string;
  description: string;
  color: 'gold' | 'navy';
}

export interface Course {
  id: string;
  title: string;
  level: 'Pemula' | 'Menengah' | 'Lanjutan' | 'Semua Level';
  duration: string;
  price: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  business: string;
  text: string;
  avatar: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface Stat {
  value: string;
  label: string;
}
