'use client';

import { cn } from '@verone/ui';
import {
  Search,
  Phone,
  BarChart3,
  HeartHandshake,
  Package,
  PackageCheck,
  CheckCircle,
  Truck,
  Pause,
  XCircle,
  Lightbulb,
} from 'lucide-react';

interface StageConfig {
  label: string;
  description: string;
  actions: string[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STAGE_CONFIGS: Record<string, StageConfig> = {
  need_identified: {
    label: 'Besoin identifie',
    description:
      'Definir le cahier des charges du produit recherche : type, budget cible, quantites estimees.',
    actions: [
      'Completer la fiche produit (nom, description, dimensions)',
      'Definir le prix cible',
      'Ajouter des liens de reference (photos inspiration, produits similaires)',
    ],
    icon: Lightbulb,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  supplier_search: {
    label: 'Recherche fournisseur',
    description:
      'Trouver des fournisseurs potentiels sur Alibaba, salons, ou autres sources.',
    actions: [
      'Ajouter des liens fournisseur (URLs Alibaba, sites web)',
      'Ajouter des fournisseurs candidats au comparatif',
      'Consulter les pages entreprise pour evaluer la fiabilite',
    ],
    icon: Search,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  initial_contact: {
    label: 'Contact initial',
    description:
      'Prendre contact avec les fournisseurs identifies et obtenir les premieres informations.',
    actions: [
      'Enregistrer chaque echange dans les communications',
      'Noter le canal utilise (Alibaba, WhatsApp, email)',
      'Identifier le contact principal chez chaque fournisseur',
    ],
    icon: Phone,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  evaluation: {
    label: 'Evaluation',
    description:
      'Comparer les fournisseurs candidats sur leurs offres, fiabilite et certifications.',
    actions: [
      'Mettre a jour les devis recus (prix, MOQ, delai) pour chaque candidat',
      'Verifier les certifications et Trade Assurance',
      'Comparer les offres dans le tableau des candidats',
    ],
    icon: BarChart3,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  negotiation: {
    label: 'Negociation',
    description:
      'Negocier les conditions (prix, MOQ, Incoterms, delai) avec le(s) fournisseur(s) retenu(s).',
    actions: [
      "Enregistrer chaque proposition de prix dans l'historique",
      'Negocier les conditions de livraison et paiement',
      'Selectionner le fournisseur final dans les candidats',
    ],
    icon: HeartHandshake,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  sample_requested: {
    label: 'Echantillon demande',
    description:
      'Un echantillon a ete commande aupres du fournisseur selectionne. En attente de reception.',
    actions: [
      'Suivre la commande avec le fournisseur',
      'Enregistrer les communications de suivi',
      "Verifier les delais de livraison de l'echantillon",
    ],
    icon: Package,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
  },
  sample_received: {
    label: 'Echantillon recu',
    description:
      "L'echantillon est arrive. Evaluer la qualite avant validation.",
    actions: [
      'Verifier la conformite avec le cahier des charges',
      "Prendre des photos de l'echantillon",
      'Noter les defauts eventuels dans les notes',
    ],
    icon: PackageCheck,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
  sample_approved: {
    label: 'Echantillon valide',
    description:
      "L'echantillon est conforme. Le produit peut etre commande ou valide vers le catalogue.",
    actions: [
      'Valider le sourcing pour ajouter au catalogue',
      'Ou passer une commande fournisseur (PO)',
      'Mettre a jour le prix final dans la fiche',
    ],
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  order_placed: {
    label: 'Commande passee',
    description:
      'La commande fournisseur est en cours. Suivre la production et la livraison.',
    actions: [
      'Suivre le statut de production avec le fournisseur',
      'Verifier les documents (facture pro-forma, packing list)',
      'Planifier la reception en entrepot',
    ],
    icon: Truck,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  received: {
    label: 'Recu',
    description:
      'Les produits sont recus. Le sourcing est termine pour ce produit.',
    actions: [
      'Verifier la conformite de la livraison',
      'Valider vers le catalogue si pas encore fait',
      'Archiver le sourcing',
    ],
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  on_hold: {
    label: 'En pause',
    description:
      "Le sourcing est temporairement suspendu. Le produit reste visible mais aucune action n'est attendue.",
    actions: [
      'Cliquer "Reprendre" pour relancer le sourcing',
      'Verifier si le besoin est toujours actuel',
      'Mettre a jour les notes avec la raison de la pause',
    ],
    icon: Pause,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  cancelled: {
    label: 'Annule',
    description:
      "Le sourcing a ete annule. Le produit ne sera pas poursuivi. Aucune donnee n'est supprimee.",
    actions: [
      'Cliquer "Reprendre" pour rouvrir si necessaire',
      'Les donnees (communications, prix, candidats) sont conservees',
      "Le produit n'apparaitra plus dans les listes actives",
    ],
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

interface SourcingStageGuideProps {
  currentStatus: string;
}

export function SourcingStageGuide({ currentStatus }: SourcingStageGuideProps) {
  const config = STAGE_CONFIGS[currentStatus] ?? STAGE_CONFIGS.need_identified;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.color)} />
        <div className="min-w-0">
          <h3 className={cn('text-sm font-semibold mb-1', config.color)}>
            {config.label}
          </h3>
          <p className="text-xs text-gray-600 mb-2">{config.description}</p>
          <ul className="space-y-1">
            {config.actions.map((action, i) => (
              <li
                key={i}
                className="text-xs text-gray-500 flex items-start gap-1.5"
              >
                <span
                  className={cn(
                    'mt-1 h-1 w-1 rounded-full shrink-0',
                    config.color.replace('text-', 'bg-')
                  )}
                />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Returns which notebook sections should be visible for a given sourcing status.
 */
export function getSectionsForStatus(status: string): {
  showUrls: boolean;
  showCandidates: boolean;
  showCommunications: boolean;
  showPriceHistory: boolean;
  showValidation: boolean;
  showConsultations: boolean;
} {
  switch (status) {
    case 'need_identified':
      return {
        showUrls: true,
        showCandidates: false,
        showCommunications: false,
        showPriceHistory: false,
        showValidation: false,
        showConsultations: true,
      };
    case 'supplier_search':
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: false,
        showPriceHistory: false,
        showValidation: false,
        showConsultations: true,
      };
    case 'initial_contact':
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: true,
        showPriceHistory: false,
        showValidation: false,
        showConsultations: true,
      };
    case 'evaluation':
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: true,
        showPriceHistory: true,
        showValidation: false,
        showConsultations: true,
      };
    case 'negotiation':
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: true,
        showPriceHistory: true,
        showValidation: false,
        showConsultations: true,
      };
    case 'sample_requested':
    case 'sample_received':
    case 'sample_approved':
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: true,
        showPriceHistory: true,
        showValidation: true,
        showConsultations: true,
      };
    case 'order_placed':
    case 'received':
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: true,
        showPriceHistory: true,
        showValidation: true,
        showConsultations: true,
      };
    case 'on_hold':
    case 'cancelled':
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: true,
        showPriceHistory: true,
        showValidation: false,
        showConsultations: true,
      };
    default:
      return {
        showUrls: true,
        showCandidates: true,
        showCommunications: true,
        showPriceHistory: true,
        showValidation: true,
        showConsultations: true,
      };
  }
}
