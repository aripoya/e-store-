import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import { solutions } from '../../data/content';

export default function Solutions() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <SectionTitle highlight="Lengkap">
          Solusi Lengkap untuk Anda
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution, index) => {
            const bgColor = solution.color === 'gold' ? 'bg-gold' : 'bg-navy-primary';
            
            return (
              <Card key={index} hover className="p-6 text-center">
                <div className={`w-20 h-20 ${bgColor} rounded-full flex items-center justify-center text-4xl mx-auto mb-4`}>
                  {solution.icon}
                </div>
                <h3 className="text-lg font-bold text-navy-dark mb-2">
                  {solution.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {solution.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
