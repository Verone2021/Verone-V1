export function JsonLdOrganization() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vérone',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr'}/logo-verone.png`,
    description:
      'Concept store en ligne de déco et mobilier original. Sourcing créatif, prix justes, sélection curatée.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+33-1-23-45-67-89',
      contactType: 'customer service',
      availableLanguage: 'French',
    },
    sameAs: [
      'https://facebook.com',
      'https://instagram.com',
      'https://twitter.com',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
