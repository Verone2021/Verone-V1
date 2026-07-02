/**
 * JsonLdOrganization — données structurées Schema.org/Organization pour le SEO
 * Coordonnées validées dans docs/content/articles/README-CLAUDE-CODE.md :
 *   - email : contact@veronecollections.fr
 *   - réseaux : Instagram + Facebook (@veronecollections)
 */
export function JsonLdOrganization() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veronecollections.fr';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vérone',
    legalName: 'Vérone Collections',
    url: siteUrl,
    logo: `${siteUrl}/logo-verone.png`,
    description:
      'Concept store en ligne de déco et mobilier original. Sourcing créatif, prix justes, sélection curatée.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@veronecollections.fr',
      contactType: 'customer service',
      availableLanguage: ['French', 'fr'],
      areaServed: 'FR',
    },
    sameAs: [
      'https://www.instagram.com/veronecollections',
      'https://www.facebook.com/veronecollections',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
