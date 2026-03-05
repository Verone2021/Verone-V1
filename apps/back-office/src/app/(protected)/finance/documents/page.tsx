'use client';

/**
 * Hub Documents — Style Indy exact
 *
 * Liste verticale pleine largeur + sous-navigation laterale.
 * Chaque document = 1 ligne avec icone + titre a gauche, boutons a droite.
 */

import { useState } from 'react';

import Link from 'next/link';

import { Button } from '@verone/ui';
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
  FolderOpen,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface DocumentRow {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hasDownload?: boolean;
  hasVisualize?: boolean;
  exportOnly?: boolean;
  exportAction?: () => void;
}

type SubNav = 'comptabilite' | 'declarations' | 'justificatifs';

// =====================================================================
// DATA
// =====================================================================

const comptabiliteRows: DocumentRow[] = [
  {
    title: 'Bilan',
    href: '/finance/documents/bilan',
    icon: Scale,
    hasDownload: true,
    hasVisualize: true,
  },
  {
    title: 'Compte de resultat',
    href: '/finance/documents/compte-resultat',
    icon: Calculator,
    hasDownload: true,
    hasVisualize: true,
  },
  {
    title: 'Grand Livre',
    href: '/finance/documents/grand-livre',
    icon: Landmark,
    hasDownload: true,
    hasVisualize: true,
  },
  {
    title: 'Resultats',
    href: '/finance/documents/resultats',
    icon: TrendingUp,
    hasDownload: true,
    hasVisualize: true,
  },
  {
    title: 'Recettes',
    href: '/finance/documents/recettes',
    icon: TrendingUp,
    hasDownload: true,
    hasVisualize: true,
  },
  {
    title: 'Achats',
    href: '/finance/documents/achats',
    icon: TrendingDown,
    hasDownload: true,
    hasVisualize: true,
  },
  {
    title: 'Annexe legale',
    href: '/finance/documents/annexe',
    icon: FileText,
    hasDownload: true,
    hasVisualize: true,
  },
  {
    title: 'FEC',
    href: '/finance/documents/grand-livre',
    icon: FolderOpen,
    hasDownload: true,
    hasVisualize: true,
  },
];

const declarationsRows: DocumentRow[] = [
  {
    title: 'TVA (CA3)',
    href: '/finance/documents/tva',
    icon: Percent,
    hasDownload: true,
    hasVisualize: true,
  },
];

// =====================================================================
// PAGE
// =====================================================================

export default function DocumentsHubPage() {
  const [activeNav, setActiveNav] = useState<SubNav>('comptabilite');
  const currentYear = new Date().getFullYear();

  const handleExportComptable = () => {
    window.open(`/api/finance/export-fec?year=${currentYear}`, '_blank');
  };

  const rows =
    activeNav === 'comptabilite'
      ? comptabiliteRows
      : activeNav === 'declarations'
        ? declarationsRows
        : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button
          variant="outline"
          className="rounded-full px-4 text-sm font-medium"
        >
          Exercice {currentYear} ▾
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sous-navigation laterale */}
        <nav className="w-52 flex-shrink-0 space-y-1">
          <button
            onClick={() => setActiveNav('comptabilite')}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              activeNav === 'comptabilite'
                ? 'bg-orange-50 text-orange-900 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            Comptabilite
          </button>
          <button
            onClick={() => setActiveNav('declarations')}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              activeNav === 'declarations'
                ? 'bg-orange-50 text-orange-900 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            Declarations fiscales
          </button>
          <button
            onClick={() => setActiveNav('justificatifs')}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              activeNav === 'justificatifs'
                ? 'bg-orange-50 text-orange-900 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            Justificatifs
          </button>
        </nav>

        {/* Contenu principal */}
        <div className="flex-1">
          {/* Section title */}
          <h2 className="text-lg font-semibold mb-4 capitalize">
            {activeNav === 'declarations' ? 'Declarations fiscales' : activeNav}
          </h2>

          {activeNav === 'justificatifs' ? (
            <div className="border rounded-xl p-12 text-center text-muted-foreground bg-white">
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
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(row => (
                <div
                  key={row.href + row.title}
                  className="flex items-center justify-between border rounded-xl px-5 py-4 bg-white hover:shadow-sm transition-shadow"
                >
                  {/* Left: icon + title */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <row.icon className="h-5 w-5 text-orange-700" />
                    </div>
                    <span className="font-medium text-sm">{row.title}</span>
                  </div>

                  {/* Right: buttons */}
                  <div className="flex items-center gap-2">
                    {row.hasDownload && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {row.hasVisualize && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg gap-1.5"
                        asChild
                      >
                        <Link href={row.href}>Visualiser</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Export comptable — derniere ligne */}
              {activeNav === 'comptabilite' && (
                <div className="flex items-center justify-between border rounded-xl px-5 py-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Download className="h-5 w-5 text-orange-700" />
                    </div>
                    <span className="font-medium text-sm">
                      Export comptable
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={handleExportComptable}
                  >
                    Exporter
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
