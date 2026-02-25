/**
 * Configuration des Product Tours LinkMe
 *
 * 4 tours guidés pour l'onboarding affilié:
 * 1. Bienvenue (Dashboard) - 5 étapes
 * 2. Créer une sélection - 4 étapes
 * 3. Passer une commande - 4 étapes
 * 4. Comprendre les commissions - 3 étapes
 *
 * Utilise Driver.js avec sélecteurs [data-tour="..."]
 *
 * @module tour-steps
 * @since 2026-02-26
 */

import type { DriveStep } from 'driver.js';

// ─── Tour IDs ────────────────────────────────────────────────────────────────

export const TOUR_IDS = {
  WELCOME: 'tour_welcome',
  SELECTION: 'tour_selection',
  ORDER: 'tour_order',
  COMMISSIONS: 'tour_commissions',
} as const;

export type TourId = (typeof TOUR_IDS)[keyof typeof TOUR_IDS];

// ─── Tour 1: Bienvenue (Dashboard) ──────────────────────────────────────────

export const welcomeTourSteps: DriveStep[] = [
  {
    element: '[data-tour="dashboard-welcome"]',
    popover: {
      title: 'Bienvenue sur LinkMe !',
      description:
        "Voici votre tableau de bord. C'est votre point d'entrée pour gérer vos sélections, commandes et commissions.",
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="onboarding-checklist"]',
    popover: {
      title: 'Votre progression',
      description:
        'Cette checklist vous guide étape par étape. Complétez-la pour maîtriser toutes les fonctionnalités de LinkMe.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="kpi-cards"]',
    popover: {
      title: "Vos commissions en un coup d'œil",
      description:
        'Suivez vos commissions en temps réel : total gagné, payables, en cours de règlement et en attente.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: 'Actions rapides',
      description:
        'Accédez directement à vos sélections, commandes et profil en un clic.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="analytics-link"]',
    popover: {
      title: 'Statistiques détaillées',
      description:
        'Consultez vos performances complètes : ventes, commissions, produits les plus vendus.',
      side: 'top',
      align: 'center',
    },
  },
];

// ─── Tour 2: Créer une sélection ───────────────────────────────────────────

export const selectionTourSteps: DriveStep[] = [
  {
    element: '[data-tour="selection-header"]',
    popover: {
      title: 'Vos sélections',
      description:
        'Une sélection est une vitrine de produits que vous partagez avec vos clients. Créez-en autant que vous voulez !',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="selection-create"]',
    popover: {
      title: 'Créer une sélection',
      description:
        'Cliquez ici pour créer votre première sélection. Donnez-lui un nom et ajoutez-y des produits du catalogue.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="selection-list"]',
    popover: {
      title: 'Gérer vos sélections',
      description:
        'Retrouvez toutes vos sélections ici. Chacune peut être en brouillon (privée) ou publiée (accessible par vos clients).',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="catalogue-link"]',
    popover: {
      title: 'Explorer le catalogue',
      description:
        'Parcourez le catalogue pour ajouter des produits à vos sélections. Définissez votre marge sur chaque produit.',
      side: 'bottom',
      align: 'center',
    },
  },
];

// ─── Tour 3: Passer une commande ───────────────────────────────────────────

export const orderTourSteps: DriveStep[] = [
  {
    element: '[data-tour="orders-header"]',
    popover: {
      title: 'Vos commandes',
      description:
        'Retrouvez ici toutes vos commandes passées pour vos clients. Suivez leur avancement en temps réel.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="orders-create"]',
    popover: {
      title: 'Nouvelle commande',
      description:
        'Créez une commande pour un de vos clients. Sélectionnez les produits depuis votre sélection active.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="orders-filters"]',
    popover: {
      title: 'Filtrer et rechercher',
      description:
        'Filtrez par statut (en approbation, validée, expédiée, livrée) pour retrouver rapidement une commande.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="orders-list"]',
    popover: {
      title: 'Suivi des commandes',
      description:
        'Chaque commande affiche son statut, le client, le montant et la commission générée. Cliquez pour voir les détails.',
      side: 'top',
      align: 'center',
    },
  },
];

// ─── Tour 4: Comprendre les commissions ────────────────────────────────────

export const commissionsTourSteps: DriveStep[] = [
  {
    element: '[data-tour="commissions-kpis"]',
    popover: {
      title: 'Vos commissions',
      description:
        "Vue d'ensemble de vos gains : total, payables (livrées), en cours de règlement, et en attente (commandes non livrées).",
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="commissions-request"]',
    popover: {
      title: 'Demander un versement',
      description:
        'Quand des commissions sont "payables", demandez votre versement ici. Vérone traite les demandes sous 48h.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="commissions-list"]',
    popover: {
      title: 'Historique détaillé',
      description:
        'Retrouvez le détail de chaque commission : produit vendu, montant, statut et date. Exportez en CSV si besoin.',
      side: 'top',
      align: 'center',
    },
  },
];

// ─── Map Tour ID → Steps ───────────────────────────────────────────────────

export const TOUR_STEPS_MAP: Record<TourId, DriveStep[]> = {
  [TOUR_IDS.WELCOME]: welcomeTourSteps,
  [TOUR_IDS.SELECTION]: selectionTourSteps,
  [TOUR_IDS.ORDER]: orderTourSteps,
  [TOUR_IDS.COMMISSIONS]: commissionsTourSteps,
};

// ─── Tour Labels (pour UI replay) ──────────────────────────────────────────

export const TOUR_LABELS: Record<TourId, string> = {
  [TOUR_IDS.WELCOME]: 'Découvrir le dashboard',
  [TOUR_IDS.SELECTION]: 'Créer une sélection',
  [TOUR_IDS.ORDER]: 'Passer une commande',
  [TOUR_IDS.COMMISSIONS]: 'Comprendre les commissions',
};
