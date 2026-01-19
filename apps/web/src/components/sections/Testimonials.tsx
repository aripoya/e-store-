import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import { testimonials } from '../../data/content';

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-br from-navy-primary to-navy-secondary">
      <div className="container mx-auto px-4">
        <SectionTitle highlight="Mereka" light>
          Apa Kata Mereka?
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 border-l-4 border-gold">
              <div className="text-5xl text-gold mb-4">"</div>
              <p className="text-gray-700 mb-6 italic leading-relaxed">
                {testimonial.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-bold text-navy-dark">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.business}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
