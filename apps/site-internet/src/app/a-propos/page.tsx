import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'Vérone, concept store en ligne de décoration et mobilier original. Notre mission : dénicher des pièces uniques, au juste prix, grâce à un sourcing créatif.',
  alternates: { canonical: '/a-propos' },
};

export default function AProposPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="text-center mb-16">
        <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-verone-black mb-4">
          À propos de Vérone
        </h1>
        <p className="text-verone-gray-500 max-w-2xl mx-auto leading-relaxed">
          Concept store en ligne — des trouvailles déco et mobilier, sourcées
          avec soin
        </p>
      </div>

      <div className="prose prose-lg max-w-none space-y-12">
        {/* Story */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-4">
            Notre histoire
          </h2>
          <p className="text-verone-gray-600 leading-relaxed">
            Vérone est née d&apos;une frustration simple : trouver des pièces de
            déco et de mobilier originales sans se ruiner, c&apos;est un
            parcours du combattant. D&apos;un côté, les enseignes grand public
            où tout le monde a les mêmes meubles. De l&apos;autre, les boutiques
            de créateurs aux prix inaccessibles. On a voulu créer une troisième
            voie.
          </p>
          <p className="text-verone-gray-600 leading-relaxed">
            Notre métier, c&apos;est le sourcing. On parcourt les salons
            professionnels, on rencontre des fabricants, on teste des matériaux.
            On sélectionne uniquement les pièces qui nous font dire « ça,
            c&apos;est une trouvaille ». Des produits qu&apos;on ne trouve pas
            partout, à des prix qui restent justes.
          </p>
        </section>

        {/* Values */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-verone-gray-200 p-6">
              <h3 className="font-semibold text-verone-black mb-2">
                Originalité
              </h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                On cherche des pièces qui sortent de l&apos;ordinaire. Des
                designs qui racontent quelque chose, des matières qu&apos;on a
                envie de toucher, des objets qui font la conversation.
              </p>
            </div>
            <div className="border border-verone-gray-200 p-6">
              <h3 className="font-semibold text-verone-black mb-2">
                Rapport qualité-prix
              </h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                Pas de marges excessives. On travaille en direct avec les
                fabricants pour proposer des produits de qualité à des prix
                accessibles. Le bon prix, c&apos;est le prix juste.
              </p>
            </div>
            <div className="border border-verone-gray-200 p-6">
              <h3 className="font-semibold text-verone-black mb-2">Curation</h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                Notre catalogue n&apos;est pas un entrepôt. On sélectionne peu,
                mais bien. Chaque produit passe par notre filtre : originalité,
                qualité, prix. Si ça ne coche pas les trois, on passe.
              </p>
            </div>
            <div className="border border-verone-gray-200 p-6">
              <h3 className="font-semibold text-verone-black mb-2">
                Service client
              </h3>
              <p className="text-sm text-verone-gray-600 leading-relaxed">
                On est une petite équipe, et c&apos;est notre force. Quand vous
                nous écrivez, vous parlez à quelqu&apos;un qui connaît les
                produits. On vous conseille, on vous guide, on s&apos;assure que
                tout se passe bien.
              </p>
            </div>
          </div>
        </section>

        {/* Promise */}
        <section className="bg-verone-gray-50 p-4 md:p-8">
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-4">
            Notre promesse
          </h2>
          <p className="text-verone-gray-600 leading-relaxed">
            Chez Vérone, on ne prétend pas réinventer la déco. On fait un
            travail simple mais exigeant : trouver les bonnes pièces, les rendre
            accessibles, et s&apos;assurer qu&apos;elles arrivent chez vous en
            parfait état. Notre catalogue évolue au fil de nos découvertes —
            revenez souvent, il y a toujours quelque chose de nouveau à
            découvrir.
          </p>
        </section>
      </div>
    </div>
  );
}
