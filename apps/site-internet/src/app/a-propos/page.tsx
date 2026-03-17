import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    "Découvrez l'histoire de Vérone, maison française de mobilier et décoration d'intérieur haut de gamme. Nos valeurs : excellence artisanale, design intemporel, engagement responsable.",
  alternates: { canonical: '/a-propos' },
};

export default function AProposPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-verone-black mb-4">
          À propos de Vérone
        </h1>
        <p className="text-verone-gray-500 max-w-2xl mx-auto leading-relaxed">
          L&apos;art de vivre à l&apos;italienne, au service de votre intérieur
        </p>
      </div>

      <div className="prose prose-lg max-w-none space-y-12">
        {/* Story */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-4">
            Notre histoire
          </h2>
          <p className="text-verone-gray-600 leading-relaxed">
            Née de la passion pour le design et l&apos;artisanat
            d&apos;excellence, Vérone est une maison française spécialisée dans
            le mobilier et la décoration d&apos;intérieur haut de gamme.
            Inspirée par l&apos;élégance intemporelle de la ville italienne dont
            elle porte le nom, notre maison sélectionne avec soin chaque pièce
            pour son caractère unique, sa qualité de fabrication et sa capacité
            à sublimer les espaces de vie.
          </p>
          <p className="text-verone-gray-600 leading-relaxed">
            Depuis notre création, nous collaborons avec les meilleurs artisans
            et manufactures d&apos;Europe pour proposer des collections qui
            allient tradition du savoir-faire et design contemporain. Chaque
            pièce raconte une histoire, chaque matériau est choisi pour sa
            noblesse et sa durabilité.
          </p>
        </section>

        {/* Values */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-verone-gray-200 p-6 rounded-lg">
              <h3 className="font-semibold text-verone-black mb-2">
                Excellence artisanale
              </h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                Nous travaillons exclusivement avec des artisans et manufactures
                reconnus pour leur savoir-faire. Chaque pièce est le fruit
                d&apos;un processus de fabrication exigeant, où la qualité prime
                sur la quantité.
              </p>
            </div>
            <div className="border border-verone-gray-200 p-6 rounded-lg">
              <h3 className="font-semibold text-verone-black mb-2">
                Design intemporel
              </h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                Nos collections sont pensées pour traverser les modes. Nous
                privilégions les lignes épurées, les matériaux nobles et les
                finitions soignées qui garantissent une élégance durable dans le
                temps.
              </p>
            </div>
            <div className="border border-verone-gray-200 p-6 rounded-lg">
              <h3 className="font-semibold text-verone-black mb-2">
                Engagement responsable
              </h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                Nous favorisons les circuits courts, les matériaux durables et
                les partenaires engagés dans une démarche écoresponsable.
                Choisir la qualité, c&apos;est aussi choisir la durabilité.
              </p>
            </div>
            <div className="border border-verone-gray-200 p-6 rounded-lg">
              <h3 className="font-semibold text-verone-black mb-2">
                Service personnalisé
              </h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                Notre équipe de conseillers vous accompagne dans vos projets
                d&apos;aménagement. Du choix des pièces à la livraison, nous
                sommes à vos côtés pour créer l&apos;intérieur qui vous
                ressemble.
              </p>
            </div>
          </div>
        </section>

        {/* Promise */}
        <section className="bg-verone-gray-50 p-8 rounded-lg">
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-4">
            Notre promesse
          </h2>
          <p className="text-verone-gray-600 leading-relaxed">
            Chez Vérone, nous croyons que chaque intérieur mérite des pièces
            d&apos;exception. C&apos;est pourquoi nous nous engageons à vous
            offrir une sélection rigoureuse de mobilier et d&apos;objets de
            décoration, un service client attentif et une livraison soignée
            jusque chez vous. Parce que votre intérieur est le reflet de qui
            vous êtes, nous mettons tout en oeuvre pour qu&apos;il soit à la
            hauteur de vos attentes.
          </p>
        </section>
      </div>
    </div>
  );
}
