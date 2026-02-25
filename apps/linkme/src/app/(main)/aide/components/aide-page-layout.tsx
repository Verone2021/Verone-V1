import Link from 'next/link';

import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface AidePageLayoutProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  children: React.ReactNode;
}

/**
 * Layout partagé pour chaque page du centre d'aide.
 * Header avec titre + icone + lien retour, puis contenu enfant.
 */
export function AidePageLayout({
  title,
  icon: Icon,
  iconColor,
  children,
}: AidePageLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Navigation retour */}
        <Link
          href="/aide"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-linkme-turquoise transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Centre d&apos;aide
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconColor}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-linkme-marine">{title}</h1>
        </div>

        {/* Contenu */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
