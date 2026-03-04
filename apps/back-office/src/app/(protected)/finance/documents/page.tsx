'use client';

/**
 * Hub Documents — Style Indy
 *
 * Sous-navigation laterale + cartes cliquables par section.
 * Remplace l'ancien hub Comptabilite.
 */

import { useState } from 'react';

import Link from 'next/link';

import { Card, CardContent, Button } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  BookOpenCheck,
  TrendingUp,
  TrendingDown,
  Calculator,
  Scale,
  FileText,
  Landmark,
  Download,
  Eye,
  Percent,
  Paperclip,
  ChevronRight,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface DocumentCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  downloadAction?: () => void;
}

type SubNav = 'comptabilite' | 'declarations' | 'justificatifs';

// =====================================================================
// DATA
// =====================================================================

const comptabiliteCards: DocumentCard[] = [
  {
    title: 'Resultats',
    description: 'Synthese mensuelle des recettes et depenses',
    href: '/finance/documents/resultats',
    icon: Calculator,
  },
  {
    title: 'Recettes',
    description: 'Livre des recettes (entrees de tresorerie)',
    href: '/finance/documents/recettes',
    icon: TrendingUp,
  },
  {
    title: 'Achats',
    description: 'Livre des achats (sorties de tresorerie)',
    href: '/finance/documents/achats',
    icon: TrendingDown,
  },
  {
    title: 'Compte de resultat',
    description: 'P&L format Plan Comptable General (PCG)',
    href: '/finance/documents/compte-resultat',
    icon: BookOpenCheck,
  },
  {
    title: 'Grand Livre',
    description: 'Ecritures ventilees par compte PCG',
    href: '/finance/documents/grand-livre',
    icon: Landmark,
  },
  {
    title: 'Bilan',
    description: 'Actif / Passif — vue simplifiee',
    href: '/finance/documents/bilan',
    icon: Scale,
  },
  {
    title: 'Annexe legale',
    description: 'Notes explicatives aux comptes annuels',
    href: '/finance/documents/annexe',
    icon: FileText,
  },
];

const declarationsCards: DocumentCard[] = [
  {
    title: 'TVA (CA3)',
    description: 'Declaration mensuelle TVA collectee vs deductible',
    href: '/finance/documents/tva',
    icon: Percent,
  },
];

// =====================================================================
// PAGE
// =====================================================================

export default function DocumentsHubPage() {
  const [activeNav, setActiveNav] = useState<SubNav>('comptabilite');

  const handleExportFec = () => {
    const year = new Date().getFullYear();
    window.open(`/api/finance/export-fec?year=${year}`, '_blank');
  };

  const cards =
    activeNav === 'comptabilite'
      ? comptabiliteCards
      : activeNav === 'declarations'
        ? declarationsCards
        : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpenCheck className="h-6 w-6" />
          Documents
        </h1>
        <p className="text-muted-foreground">
          Documents comptables, declarations fiscales et justificatifs
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sous-navigation laterale */}
        <nav className="w-56 flex-shrink-0 space-y-1">
          <button
            onClick={() => setActiveNav('comptabilite')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              activeNav === 'comptabilite'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <BookOpenCheck className="h-4 w-4" />
            Comptabilite
          </button>
          <button
            onClick={() => setActiveNav('declarations')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              activeNav === 'declarations'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Percent className="h-4 w-4" />
            Declarations fiscales
          </button>
          <button
            onClick={() => setActiveNav('justificatifs')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              activeNav === 'justificatifs'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Paperclip className="h-4 w-4" />
            Justificatifs
          </button>
        </nav>

        {/* Contenu principal */}
        <div className="flex-1">
          {activeNav === 'justificatifs' ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Justificatifs</p>
                <p className="text-sm">
                  Les justificatifs sont accessibles depuis chaque transaction
                  dans la page{' '}
                  <Link
                    href="/finance/transactions"
                    className="text-blue-600 underline"
                  >
                    Transactions
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(card => (
                <Card
                  key={card.href}
                  className="group hover:shadow-md transition-all duration-200 hover:border-gray-300"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                        <card.icon className="h-5 w-5 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{card.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {card.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        asChild
                      >
                        <Link href={card.href}>
                          <Eye className="h-3.5 w-3.5" />
                          Visualiser
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Export FEC — carte speciale (comptabilite seulement) */}
              {activeNav === 'comptabilite' && (
                <Card className="group hover:shadow-md transition-all duration-200 hover:border-gray-300">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                        <Download className="h-5 w-5 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">Export FEC</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Fichier des Ecritures Comptables (obligation legale)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleExportFec}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Exporter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
