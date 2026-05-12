import Link from 'next/link';

import { BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';

import { Badge } from '@verone/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';

export const metadata = {
  title: 'Guide — Publier sur Facebook & Instagram',
};

const STEPS = [
  {
    num: 1,
    title: 'Générer ton image',
    description:
      'Utilise le Studio IA pour créer une image adaptée à ta publication.',
    link: {
      href: '/marketing/prompts',
      label: 'Ouvrir le Studio IA',
      external: false,
    },
  },
  {
    num: 2,
    title: 'La retrouver dans la Bibliothèque',
    description:
      'Une fois générée, retrouve ton image dans la Bibliothèque pour la télécharger.',
    link: {
      href: '/marketing/bibliotheque',
      label: 'Ouvrir la Bibliothèque',
      external: false,
    },
  },
  {
    num: 3,
    title: 'Publier sur Facebook (et Instagram en même temps)',
    description:
      'Depuis Meta Business Suite, tu peux publier sur ta page Facebook ET ton compte Instagram en une seule action. Va dans « Contenu » → « Créer », charge ta photo, écris ton texte, puis publie sur Facebook et Instagram simultanément.',
    link: {
      href: 'https://business.facebook.com/',
      label: 'Ouvrir Meta Business Suite',
      external: true,
    },
  },
  {
    num: 4,
    title: 'Marquer comme publiée dans le back-office',
    description:
      'Reviens dans la Bibliothèque, ouvre la photo et clique sur « Marquer comme publié » pour garder la trace de ta publication.',
    link: {
      href: '/marketing/bibliotheque',
      label: 'Retourner à la Bibliothèque',
      external: false,
    },
  },
];

const USEFUL_LINKS = [
  { label: 'Meta Business Suite', href: 'https://business.facebook.com/' },
  {
    label: 'Gestionnaire de publicités',
    href: 'https://www.facebook.com/adsmanager',
  },
  {
    label: 'Commerce Manager (catalogue produits)',
    href: 'https://www.facebook.com/commerce_manager',
  },
  {
    label: 'Creator Studio',
    href: 'https://business.facebook.com/creatorstudio',
  },
];

export default function GuideMetaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <BookOpen className="mt-1 h-6 w-6 shrink-0 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Guide — Publier sur Facebook &amp; Instagram
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            En attendant la connexion automatique, voici comment publier
            manuellement en 4 étapes.
          </p>
        </div>
      </div>

      {/* Section étapes */}
      <section>
        <h2 className="mb-4 text-base font-semibold">
          Aujourd&apos;hui — Publication manuelle
        </h2>
        <div className="space-y-3">
          {STEPS.map(step => (
            <Card key={step.num}>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {step.num}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="mb-3 text-sm text-muted-foreground">
                  {step.description}
                </p>
                {step.link.external ? (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {step.link.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    href={step.link.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {step.link.label}
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Liens utiles */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Liens utiles</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {USEFUL_LINKS.map(item => (
            <Card key={item.href} className="transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{item.label}</span>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  aria-label={`Ouvrir ${item.label}`}
                >
                  Ouvrir
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bientôt disponible */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <Badge variant="secondary" className="mb-2 text-[10px]">
          Bientôt disponible
        </Badge>
        <p className="text-sm text-muted-foreground">
          Quand les accès API Meta seront connectés, tu pourras programmer tes
          publications directement depuis le Calendrier de ce back-office, sans
          passer par Meta Business Suite.
        </p>
      </div>
    </div>
  );
}
