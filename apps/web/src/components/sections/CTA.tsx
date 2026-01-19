import { useState } from 'react';
import Button from '../ui/Button';

export default function CTA() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement newsletter signup
    alert(`Terima kasih! Kami akan mengirim info ke ${email}`);
    setEmail('');
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-navy-primary to-navy-secondary rounded-3xl shadow-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Siap Memulai Transformasi Digital?
          </h2>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
            Daftar sekarang dan dapatkan akses gratis ke materi pengenalan digitalisasi UMKM
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                required
                className="flex-1 px-6 py-3 rounded-lg text-navy-dark focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <Button type="submit" variant="primary">
                Daftar Sekarang
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
