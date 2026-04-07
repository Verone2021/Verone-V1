/**
 * PCG Comptes de niveau 2 — Classes 4, 5, 7 (Tiers, Financiers, Produits)
 * Codes 40x-46x, 51x-58x, 70x-79x
 */

import type { PcgCategory } from './pcg-types';

export const PCG_ACCOUNTS_TIERS_PRODUITS: PcgCategory[] = [
  // ============================================================
  // CLASSE 4 - COMPTES DE TIERS (niveau 2)
  // ============================================================
  {
    code: '401',
    label: 'Fournisseurs - Comptes',
    parentCode: '40',
    level: 2,
    description: 'Fournisseurs ordinaires',
  },
  {
    code: '403',
    label: 'Fournisseurs - Effets à payer',
    parentCode: '40',
    level: 2,
    description: 'Lettres de change à payer',
  },
  {
    code: '404',
    label: "Fournisseurs d'immobilisations",
    parentCode: '40',
    level: 2,
    description: "Achats d'équipements et immobilisations",
  },
  {
    code: '408',
    label: 'Fournisseurs - Factures non parvenues',
    parentCode: '40',
    level: 2,
    description: 'Factures en attente de réception',
  },
  {
    code: '411',
    label: 'Clients - Comptes',
    parentCode: '41',
    level: 2,
    description: 'Créances clients ordinaires',
  },
  {
    code: '413',
    label: 'Clients - Effets à recevoir',
    parentCode: '41',
    level: 2,
    description: 'Lettres de change à recevoir',
  },
  {
    code: '416',
    label: 'Clients douteux ou litigieux',
    parentCode: '41',
    level: 2,
    description: 'Créances douteuses',
  },
  {
    code: '418',
    label: 'Clients - Produits non encore facturés',
    parentCode: '41',
    level: 2,
    description: 'Produits à facturer',
  },
  {
    code: '421',
    label: 'Personnel - Rémunérations dues',
    parentCode: '42',
    level: 2,
    description: 'Salaires nets à payer',
  },
  {
    code: '425',
    label: 'Personnel - Avances et acomptes',
    parentCode: '42',
    level: 2,
    description: 'Avances sur salaires',
  },
  {
    code: '431',
    label: 'Sécurité sociale',
    parentCode: '43',
    level: 2,
    description: 'Cotisations URSSAF',
  },
  {
    code: '437',
    label: 'Autres organismes sociaux',
    parentCode: '43',
    level: 2,
    description: 'Retraites, prévoyance, mutuelle',
  },
  {
    code: '4411',
    label: 'TVA due/État',
    parentCode: '44',
    level: 2,
    description: "TVA à payer à l'État",
  },
  {
    code: '44566',
    label: 'TVA déductible sur achats',
    parentCode: '44',
    level: 2,
    description: 'TVA récupérable',
  },
  {
    code: '44567',
    label: 'TVA déductible sur immobilisations',
    parentCode: '44',
    level: 2,
    description: "TVA sur acquisitions d'immobilisations",
  },
  {
    code: '44571',
    label: 'TVA collectée',
    parentCode: '44',
    level: 2,
    description: 'TVA facturée aux clients',
  },
  {
    code: '455',
    label: 'Associés - Comptes courants',
    parentCode: '45',
    level: 2,
    description: 'Apports en compte courant',
  },
  {
    code: '467',
    label: 'Autres comptes débiteurs/créditeurs',
    parentCode: '46',
    level: 2,
    description: 'Créances et dettes diverses',
  },

  // ============================================================
  // CLASSE 5 - COMPTES FINANCIERS (niveau 2)
  // ============================================================
  {
    code: '512',
    label: 'Banque - Compte courant',
    parentCode: '51',
    level: 2,
    description: 'Compte courant bancaire principal',
  },
  {
    code: '514',
    label: 'Chèques à encaisser',
    parentCode: '51',
    level: 2,
    description: "Chèques en attente d'encaissement",
  },
  {
    code: '517',
    label: 'Autres organismes financiers',
    parentCode: '51',
    level: 2,
    description: "Comptes dans d'autres établissements",
  },
  {
    code: '531',
    label: 'Caisse siège social',
    parentCode: '53',
    level: 2,
    description: 'Caisse principale',
  },
  {
    code: '580',
    label: 'Virements internes',
    parentCode: '58',
    level: 2,
    description: "Transferts entre comptes de l'entreprise",
  },

  // ============================================================
  // CLASSE 7 - COMPTES DE PRODUITS (niveau 2)
  // ============================================================
  {
    code: '701',
    label: 'Ventes de produits finis',
    parentCode: '70',
    level: 2,
    description: 'Ventes de biens fabriqués',
  },
  {
    code: '706',
    label: 'Prestations de services',
    parentCode: '70',
    level: 2,
    description: 'Facturation de services',
  },
  {
    code: '707',
    label: 'Ventes de marchandises',
    parentCode: '70',
    level: 2,
    description: "Revente en l'état",
  },
  {
    code: '708',
    label: 'Produits des activités annexes',
    parentCode: '70',
    level: 2,
    description: 'Commissions, ports facturés',
  },
  {
    code: '709',
    label: 'Rabais, remises et ristournes accordés',
    parentCode: '70',
    level: 2,
    description: 'Réductions accordées aux clients',
  },
  {
    code: '713',
    label: 'Variation des stocks de produits',
    parentCode: '71',
    level: 2,
    description: 'Écart de stock produits finis',
  },
  {
    code: '721',
    label: 'Immobilisations incorporelles',
    parentCode: '72',
    level: 2,
    description: 'Production immobilisée incorporelle',
  },
  {
    code: '722',
    label: 'Immobilisations corporelles',
    parentCode: '72',
    level: 2,
    description: 'Production immobilisée corporelle',
  },
  {
    code: '741',
    label: "Subventions d'exploitation",
    parentCode: '74',
    level: 2,
    description: "Aides reçues pour l'exploitation",
  },
  {
    code: '751',
    label: 'Redevances perçues',
    parentCode: '75',
    level: 2,
    description: 'Redevances sur brevets, licences',
  },
  {
    code: '758',
    label: 'Produits divers de gestion',
    parentCode: '75',
    level: 2,
    description: 'Autres produits de gestion courante',
  },
  {
    code: '761',
    label: 'Produits de participations',
    parentCode: '76',
    level: 2,
    description: 'Dividendes reçus',
  },
  {
    code: '764',
    label: 'Revenus des valeurs mobilières',
    parentCode: '76',
    level: 2,
    description: 'Intérêts sur placements',
  },
  {
    code: '766',
    label: 'Gains de change',
    parentCode: '76',
    level: 2,
    description: 'Gains sur opérations en devises',
  },
  {
    code: '768',
    label: 'Autres produits financiers',
    parentCode: '76',
    level: 2,
    description: 'Produits financiers divers',
  },
  {
    code: '771',
    label: 'Produits exceptionnels de gestion',
    parentCode: '77',
    level: 2,
    description: 'Pénalités perçues, autres',
  },
  {
    code: '775',
    label: "Produits de cessions d'éléments d'actif",
    parentCode: '77',
    level: 2,
    description: 'Prix de vente des immobilisations cédées',
  },
  {
    code: '781',
    label: 'Reprises sur amortissements exploitation',
    parentCode: '78',
    level: 2,
    description: "Reprises de provisions d'exploitation",
  },
  {
    code: '791',
    label: "Transferts de charges d'exploitation",
    parentCode: '79',
    level: 2,
    description: 'Charges transférées',
  },
];
