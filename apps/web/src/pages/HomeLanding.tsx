import Hero from '../components/sections/Hero';
import PainPoints from '../components/sections/PainPoints';
import Solutions from '../components/sections/Solutions';
import Courses from '../components/sections/Courses';
import Testimonials from '../components/sections/Testimonials';
import CTA from '../components/sections/CTA';

export default function HomeLanding() {
  return (
    <div className="min-h-screen">
      <Hero />
      <PainPoints />
      <Solutions />
      <Courses />
      <Testimonials />
      <CTA />
    </div>
  );
}
