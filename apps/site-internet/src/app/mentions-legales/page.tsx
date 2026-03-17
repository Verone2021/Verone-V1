import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'Mentions légales du site Vérone : éditeur, hébergement, propriété intellectuelle.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-12">
        Mentions légales
      </h1>

      <div className="space-y-10 text-sm text-verone-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Éditeur du site
          </h2>
          <p>
            Le site verone.fr est édité par la société Vérone SAS, au capital de
            10 000 euros.
          </p>
          <ul className="mt-3 space-y-1">
            <li>
              <strong>Siège social :</strong> Paris, France
            </li>
            <li>
              <strong>SIRET :</strong> XXX XXX XXX XXXXX
            </li>
            <li>
              <strong>RCS :</strong> Paris B XXX XXX XXX
            </li>
            <li>
              <strong>TVA intracommunautaire :</strong> FR XX XXX XXX XXX
            </li>
            <li>
              <strong>Directeur de la publication :</strong> Roméo Dos Santos
            </li>
            <li>
              <strong>Email :</strong> contact@verone.fr
            </li>
            <li>
              <strong>Téléphone :</strong> +33 1 23 45 67 89
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Hébergement
          </h2>
          <p>Le site est hébergé par :</p>
          <ul className="mt-3 space-y-1">
            <li>
              <strong>Vercel Inc.</strong>
            </li>
            <li>440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
            <li>Site web : vercel.com</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble du contenu de ce site (textes, images,
            photographies, logos, vidéos, marques) est protégé par le droit
            d&apos;auteur et le droit des marques. Toute reproduction,
            représentation ou diffusion, totale ou partielle, du contenu de ce
            site par quelque procédé que ce soit, sans l&apos;autorisation
            expresse et préalable de Vérone SAS, est interdite et constitue une
            contrefaçon sanctionnée par les articles L.335-2 et suivants du Code
            de la propriété intellectuelle.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Responsabilité
          </h2>
          <p>
            Vérone SAS s&apos;efforce d&apos;assurer l&apos;exactitude et la
            mise à jour des informations diffusées sur ce site, dont elle se
            réserve le droit de corriger le contenu à tout moment et sans
            préavis. Toutefois, Vérone SAS ne peut garantir l&apos;exactitude,
            la précision ou l&apos;exhaustivité des informations mises à
            disposition sur ce site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Litiges
          </h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. Tout
            litige relatif à l&apos;utilisation du site verone.fr sera de la
            compétence exclusive des tribunaux de Paris.
          </p>
        </section>

        <p className="text-xs text-verone-gray-400 pt-4">
          Dernière mise à jour : mars 2026
        </p>
      </div>
    </div>
  );
}
