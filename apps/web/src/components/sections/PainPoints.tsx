import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import { painPoints } from '../../data/content';

export default function PainPoints() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <SectionTitle highlight="Ini">
          Apakah Anda Mengalami Ini?
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <Card key={index} hover className="p-8 border-t-4 border-gold">
              <div className="text-5xl mb-4">{point.icon}</div>
              <h3 className="text-xl font-bold text-navy-dark mb-3">
                {point.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {point.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
