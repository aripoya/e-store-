import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SectionTitle from '../ui/SectionTitle';
import { courses } from '../../data/content';

export default function Courses() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <SectionTitle highlight="Unggulan">
          Kursus Unggulan
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => (
            <Card key={course.id} hover className="overflow-hidden">
              <div className="bg-gradient-to-r from-navy-primary to-navy-secondary p-6 text-white">
                <div className="text-5xl mb-3">{course.icon}</div>
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              </div>
              
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-gold/10 text-gold text-xs font-semibold rounded-full">
                    {course.level}
                  </span>
                  <span className="px-3 py-1 bg-navy-primary/10 text-navy-primary text-xs font-semibold rounded-full">
                    {course.duration}
                  </span>
                </div>
                
                <div className="text-2xl font-bold text-navy-dark mb-4">
                  {course.price}
                </div>
                
                <Button variant="secondary" fullWidth>
                  Lihat Detail
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/products">
            <Button variant="primary">
              Lihat Semua Kursus →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
