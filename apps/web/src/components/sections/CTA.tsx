import Button from '../ui/Button';
import { getQuizURL, trackCTAClick } from '../../utils/tracking';

export default function CTA() {
  const handleQuizClick = () => {
    trackCTAClick('bottom_section');
  };

  return (
    <section className="py-20 bg-gradient-to-r from-gold to-orange-500">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-white">
          Mulai Transformasi Digital Anda Sekarang
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-white">
          Ikuti quiz 3 menit untuk mengetahui posisi bisnis Anda dan 
          dapatkan roadmap transformasi digital yang tepat.
        </p>
        <a 
          href={getQuizURL()}
          onClick={handleQuizClick}
          className="inline-block"
        >
          <Button variant="outline" className="bg-white text-gold hover:bg-gray-100 border-white text-lg px-10 py-4 font-bold shadow-xl transform hover:scale-105 transition">
            Mulai Quiz Gratis →
          </Button>
        </a>
      </div>
    </section>
  );
}
