'use client';

import * as React from 'react';

import { cn } from '@verone/utils';
import { ChevronDown, HelpCircle, BookOpen, Workflow } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
import { Separator } from './separator';

// =====================================================================
// TYPES
// =====================================================================

export interface LexiqueItem {
  term: string;
  definition: string;
  icon?: React.ReactNode;
}

export interface WorkflowStep {
  step: number;
  title: string;
  description?: string;
}

export interface HelpLexiqueSectionProps {
  /** Titre de la section aide (par défaut: "Aide & Lexique") */
  title?: string;
  /** Termes du lexique à afficher */
  lexique?: LexiqueItem[];
  /** Étapes du workflow à afficher */
  workflow?: WorkflowStep[];
  /** Texte d'introduction */
  introduction?: string;
  /** État d'ouverture par défaut */
  defaultOpen?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

// =====================================================================
// COMPONENT
// =====================================================================

/**
 * Section d'aide collapsible avec lexique et workflow
 * À ajouter en bas des pages pour guider les utilisateurs
 */
export function HelpLexiqueSection({
  title = 'Aide & Lexique',
  lexique,
  workflow,
  introduction,
  defaultOpen = false,
  className,
}: HelpLexiqueSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'mt-8 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50',
        className
      )}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4">
        <Separator className="mb-4" />

        {/* Introduction */}
        {introduction && (
          <p className="text-sm text-muted-foreground mb-4">{introduction}</p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Lexique */}
          {lexique && lexique.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-sm">Lexique</h4>
              </div>
              <dl className="space-y-2">
                {lexique.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    {item.icon && (
                      <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.term}
                      </dt>
                      <dd className="text-xs text-muted-foreground">
                        {item.definition}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Workflow */}
          {workflow && workflow.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Workflow className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-sm">Workflow</h4>
              </div>
              <ol className="space-y-2">
                {workflow.map(step => (
                  <li key={step.step} className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {step.title}
                      </p>
                      {step.description && (
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// =====================================================================
// PRESETS - Configurations prêtes à l'emploi
// =====================================================================

/** Aide pour la page Transactions */
export const HELP_TRANSACTIONS: HelpLexiqueSectionProps = {
  introduction:
    'Cette page permet de gérer vos transactions bancaires : catégorisation, rapprochement avec les commandes et suivi des justificatifs.',
  lexique: [
    {
      term: 'À traiter',
      definition: 'Transactions sans catégorie ni organisation assignée',
    },
    {
      term: 'CCA (455)',
      definition:
        'Compte Courant Associé - Virements internes entre vos comptes',
    },
    {
      term: 'Rapprochée',
      definition: 'Transaction liée à une commande client ou fournisseur',
    },
    {
      term: 'Ignorée',
      definition:
        'Transaction qui ne nécessite pas de rapprochement (virement interne)',
    },
  ],
  workflow: [
    {
      step: 1,
      title: 'Classer les dépenses',
      description: 'Assigner une catégorie PCG',
    },
    {
      step: 2,
      title: 'Lier aux commandes',
      description: "Rapprocher les entrées d'argent",
    },
    {
      step: 3,
      title: 'Déposer justificatifs',
      description: 'Factures, reçus, etc.',
    },
  ],
};

/** Aide pour la page Dépenses */
export const HELP_DEPENSES: HelpLexiqueSectionProps = {
  introduction:
    'Cette page affiche vos dépenses (débits) pour la comptabilité. Chaque dépense doit avoir une catégorie PCG, un taux de TVA et un justificatif.',
  lexique: [
    {
      term: 'PCG',
      definition:
        'Plan Comptable Général - Classification officielle des comptes en France',
    },
    {
      term: 'TVA',
      definition:
        'Taxe sur la Valeur Ajoutée - Renseigner le taux (0%, 5.5%, 10%, 20%)',
    },
    {
      term: 'Justificatif',
      definition: 'Facture ou reçu prouvant la dépense',
    },
    {
      term: 'Organisation',
      definition: 'Fournisseur ou tiers lié à la transaction',
    },
  ],
  workflow: [
    {
      step: 1,
      title: 'Catégoriser',
      description: 'Choisir la catégorie PCG appropriée',
    },
    {
      step: 2,
      title: 'Renseigner TVA',
      description: 'Indiquer le taux et le montant HT',
    },
    {
      step: 3,
      title: 'Ajouter justificatif',
      description: 'Télécharger la facture',
    },
  ],
};

/** Aide pour la page Commandes */
export const HELP_COMMANDES: HelpLexiqueSectionProps = {
  introduction:
    'Cette page affiche vos commandes clients. Chaque commande payée doit être liée à la transaction bancaire correspondante.',
  lexique: [
    {
      term: 'Rapprochement',
      definition:
        "Lier une commande à l'entrée d'argent correspondante sur le compte",
    },
    {
      term: 'Score de confiance',
      definition:
        'Pourcentage indiquant la probabilité de correspondance (100% = certain)',
    },
    {
      term: 'Commande payée',
      definition:
        'Commande liée à une transaction bancaire confirmant le paiement',
    },
  ],
  workflow: [
    {
      step: 1,
      title: 'Identifier la commande',
      description: 'Trouver la commande à rapprocher',
    },
    {
      step: 2,
      title: 'Cliquer sur "Lier"',
      description: 'Ouvrir le modal de suggestions',
    },
    {
      step: 3,
      title: 'Valider la correspondance',
      description: 'Confirmer le lien avec la transaction',
    },
  ],
};
