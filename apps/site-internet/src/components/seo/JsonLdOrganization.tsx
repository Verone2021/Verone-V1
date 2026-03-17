export function JsonLdOrganization() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vérone',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr'}/logo-verone.png`,
    description:
      "Mobilier et décoration d'intérieur haut de gamme pour sublimer votre espace de vie.",
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
