import type {
  MissingFieldCategory,
  MissingField,
} from './order-missing-fields';

export interface RequestInfoTemplate {
  id: string;
  category: MissingFieldCategory;
  label: string;
  description: string;
  getMessage: (missingFields: MissingField[]) => string;
}

export const REQUEST_INFO_TEMPLATES: RequestInfoTemplate[] = [
  {
    id: 'responsable_info',
    category: 'responsable',
    label: 'Informations responsable',
    description: 'Demander les informations du contact responsable',
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'responsable')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,\n\nPour traiter votre commande, nous avons besoin des informations suivantes concernant le responsable :\n\n${fieldsList || '  - Nom, email et telephone du responsable'}\n\nMerci de nous transmettre ces informations dans les meilleurs delais.`;
    },
  },
  {
    id: 'billing_info',
    category: 'billing',
    label: 'Informations facturation',
    description: 'Demander les informations de facturation',
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'billing')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,\n\nPour etablir la facture de votre commande, nous avons besoin des informations suivantes :\n\n${fieldsList || '  - Contact et coordonnees de facturation'}\n\nMerci de nous transmettre ces informations dans les meilleurs delais.`;
    },
  },
  {
    id: 'delivery_info',
    category: 'delivery',
    label: 'Informations livraison',
    description: 'Demander les informations de livraison',
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'delivery')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,\n\nPour organiser la livraison de votre commande, nous avons besoin des informations suivantes :\n\n${fieldsList || '  - Adresse de livraison et contact sur place'}\n\nMerci de nous transmettre ces informations dans les meilleurs delais.`;
    },
  },
  {
    id: 'organisation_info',
    category: 'organisation',
    label: 'Informations entreprise',
    description: "Demander les informations legales de l'entreprise",
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'organisation')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,\n\nPour finaliser le dossier de votre commande, nous avons besoin des informations suivantes :\n\n${fieldsList || '  - SIRET ou N° TVA intracommunautaire'}\n\nMerci de nous transmettre ces informations dans les meilleurs delais.`;
    },
  },
  {
    id: 'custom',
    category: 'custom',
    label: 'Message personnalise',
    description: 'Rediger un message libre',
    getMessage: () => '',
  },
];

export interface RejectReasonTemplate {
  id: string;
  label: string;
  message: string;
}

export const REJECT_REASON_TEMPLATES: RejectReasonTemplate[] = [
  {
    id: 'incomplete_info',
    label: 'Informations incompletes',
    message:
      'Votre commande ne peut pas etre validee car les informations fournies sont incompletes.',
  },
  {
    id: 'invalid_franchise',
    label: 'Franchise non eligible',
    message:
      "Votre commande ne peut pas etre validee car la franchise concernee ne remplit pas les conditions d'eligibilite requises.",
  },
  {
    id: 'product_unavailable',
    label: 'Produits indisponibles',
    message:
      'Un ou plusieurs produits de votre commande ne sont plus disponibles.',
  },
  {
    id: 'duplicate_order',
    label: 'Commande en doublon',
    message:
      'Votre commande fait doublon avec une commande deja en cours de traitement.',
  },
  { id: 'custom', label: 'Raison personnalisee', message: '' },
];
