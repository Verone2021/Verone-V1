/**
 * Constantes et types du formulaire de contact unifié LinkMe.
 *
 * @module contact/contact-form.config
 * @since 2026-06-05 - LINKME-CONTACT-001
 */

export type FormStatus = 'idle' | 'loading' | 'success' | 'error';
export type ProfileType = 'createur' | 'pro' | 'enseigne' | 'fournisseur';
export type LogisticsMode = 'self' | 'warehouse';

export interface IFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileType: ProfileType | '';
  logisticsMode: LogisticsMode | '';
  message: string;
}

export const INITIAL_FORM: IFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  profileType: '',
  logisticsMode: '',
  message: '',
};

export const PROFILE_OPTIONS: {
  value: ProfileType;
  title: string;
  hint: string;
}[] = [
  {
    value: 'createur',
    title: 'Ambassadeur créateur',
    hint: 'Je crée du contenu, j’ai une audience',
  },
  {
    value: 'pro',
    title: 'Professionnel prescripteur',
    hint: 'Architecte, décorateur, consultant…',
  },
  {
    value: 'enseigne',
    title: 'Enseigne / Réseau',
    hint: 'Je pilote plusieurs points de vente',
  },
  {
    value: 'fournisseur',
    title: 'Fournisseur',
    hint: 'Je veux référencer mes produits',
  },
];

export const LOGISTICS_OPTIONS: {
  value: LogisticsMode;
  label: string;
}[] = [
  {
    value: 'self',
    label: 'Vous gérez le stock et expédiez directement à chaque commande',
  },
  {
    value: 'warehouse',
    label: 'Vous souhaitez un stockage en entrepôt LinkMe',
  },
];

export const CALENDLY_CTA_LABELS: Record<ProfileType, string> = {
  createur: 'Réserver un créneau ambassadeur (15 min)',
  pro: 'Réserver un créneau ambassadeur (15 min)',
  enseigne: 'Réserver une démo réseau (30 min)',
  fournisseur: 'Réserver un créneau référencement (30 min)',
};

/** Mappe le query param `?type=` vers un type de profil du formulaire. */
export function normalizeType(raw: string | null): ProfileType | '' {
  switch (raw) {
    case 'enseigne':
      return 'enseigne';
    case 'fournisseur':
      return 'fournisseur';
    case 'pro':
      return 'pro';
    case 'createur':
    case 'ambassadeur':
      return 'createur';
    default:
      return '';
  }
}
