import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { stats } from '../../data/content';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-navy-primary to-navy-secondary text-white py-20 md:py-32 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-gold opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-gold opacity-5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-6 py-2 border-2 border-gold rounded-full text-gold font-bold">
            <span>🚀</span>
            <span className="text-sm md:text-base font-extrabold tracking-wide">PLATFORM EDUKASI DIGITAL #1 UNTUK UMKM</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-center mb-6 leading-tight tracking-tight">
          Transformasi Bisnis Anda ke Era Digital dengan{' '}
          <span className="text-gold">AI</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-center text-gray-200 max-w-3xl mx-auto mb-10">
          Pelajari cara memanfaatkan Internet dan Artificial Intelligence untuk mengembangkan UMKM Anda bersama praktisi berpengalaman.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button variant="primary">
            Mulai Belajar Gratis
          </Button>
          <Link to="/products">
            <Button variant="outline">
              Lihat Kursus →
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gold mb-2">
                {stat.value}
              </div>
              <div className="text-gray-300">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
