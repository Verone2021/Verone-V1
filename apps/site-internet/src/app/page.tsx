import { HeroSection } from '@/components/home/HeroSection';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section Luxury */}
      <HeroSection />

      {/* Produits Vedettes - À développer Phase 3 */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <h3 className="font-playfair text-4xl font-bold text-verone-black text-center mb-16">
          Sélection du moment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="group border border-verone-gray-200 hover:shadow-luxury transition-all duration-500"
            >
              <div className="bg-verone-gray-100 h-80 overflow-hidden">
                <div className="w-full h-full bg-verone-gray-200 group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-6">
                <h4 className="font-playfair text-xl font-semibold text-verone-black mb-2">
                  Produit {i}
                </h4>
                <p className="text-sm text-verone-gray-600 mb-4 leading-relaxed">
                  Collection exclusive 2024
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-verone-black">
                    Sur demande
                  </span>
                  <button className="px-4 py-2 border border-verone-black text-verone-black text-xs uppercase tracking-wide hover:bg-verone-black hover:text-verone-white transition-all duration-300">
                    Découvrir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
