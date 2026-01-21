import { getQuizURL, trackCTAClick } from '../utils/tracking';

export default function MobileStickyButton() {
  const handleClick = () => {
    trackCTAClick('mobile_sticky');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg md:hidden z-50 border-t border-gray-200">
      <a 
        href={getQuizURL()}
        onClick={handleClick}
        className="block w-full bg-gradient-to-r from-gold to-orange-500 text-white text-center font-bold py-4 rounded-lg shadow-md active:scale-95 transition-transform"
      >
        Mulai Quiz Gratis →
      </a>
    </div>
  );
}
